"""
리포트 열람 추적 API 엔드포인트

학부모 리포트 열람을 추적합니다.

API:
    POST /api/reports/track-view - 열람 기록
    POST /api/reports/track-duration - 체류 시간 업데이트
"""

import os
from datetime import datetime
from flask import Blueprint, request, jsonify

import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)


reports_bp = Blueprint('reports', __name__)


def get_db_connection():
    """데이터베이스 연결"""
    try:
        import mysql.connector
        return mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'tutornote')
        )
    except Exception as e:
        print(f"[Reports API] DB connection failed: {e}")
        return None


@reports_bp.route('/api/reports/track-view', methods=['POST'])
def track_view():
    """학부모 리포트 열람 추적"""
    data = request.json
    share_token = data.get('share_token')
    viewer_type = data.get('viewer_type', 'parent')

    if not share_token:
        return jsonify({'error': 'share_token is required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # 공유 토큰으로 리포트 ID 조회
        # report_shares 테이블이 있다고 가정
        cursor.execute("""
            SELECT progress_record_id as report_id
            FROM report_shares
            WHERE share_token = %s AND is_active = 1
        """, (share_token,))

        result = cursor.fetchone()
        if not result:
            # report_shares 테이블이 없거나 토큰이 없는 경우
            # 간단히 토큰 자체를 기록
            report_id = None
        else:
            report_id = result['report_id']

        # 열람 기록 저장
        cursor.execute("""
            INSERT INTO report_views
            (report_id, share_token, viewer_type, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            report_id,
            share_token,
            viewer_type,
            request.remote_addr,
            request.user_agent.string if request.user_agent else None
        ))

        conn.commit()
        view_id = cursor.lastrowid

        cursor.close()
        conn.close()

        print(f"[Reports API] View tracked: {share_token}, viewer: {viewer_type}")

        return jsonify({
            'success': True,
            'view_id': view_id
        })

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        print(f"[Reports API] Track view error: {e}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/api/reports/track-duration', methods=['POST'])
def track_duration():
    """학부모 체류 시간 업데이트"""
    data = request.get_json(silent=True) or {}
    share_token = data.get('share_token')
    duration = data.get('duration')

    if not share_token:
        return '', 204  # No Content - Beacon API는 응답을 무시하므로

    conn = get_db_connection()
    if not conn:
        return '', 204

    cursor = conn.cursor()

    try:
        # 최근 열람 기록의 체류 시간 업데이트
        cursor.execute("""
            UPDATE report_views
            SET view_duration_seconds = %s
            WHERE share_token = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (duration, share_token))

        conn.commit()
        cursor.close()
        conn.close()

        print(f"[Reports API] Duration updated: {share_token}, {duration}s")

        return '', 204  # No Content

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        print(f"[Reports API] Track duration error: {e}")
        return '', 204


@reports_bp.route('/api/reports/views-stats', methods=['GET'])
def get_views_stats():
    """열람 통계 조회"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 이번 달 열람 통계
        cursor.execute("""
            SELECT
                COUNT(*) as total_views,
                COUNT(DISTINCT share_token) as unique_reports,
                AVG(view_duration_seconds) as avg_duration,
                COUNT(CASE WHEN viewer_type = 'parent' THEN 1 END) as parent_views
            FROM report_views
            WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({
            'total_views': result['total_views'] or 0,
            'unique_reports': result['unique_reports'] or 0,
            'avg_duration': round(float(result['avg_duration']), 1) if result['avg_duration'] else 0,
            'parent_views': result['parent_views'] or 0
        })

    except Exception as e:
        print(f"[Reports API] Views stats error: {e}")
        return jsonify({'error': str(e)}), 500


# Blueprint 등록용 함수
def register_reports_routes(app):
    """Flask 앱에 reports Blueprint 등록"""
    app.register_blueprint(reports_bp)
