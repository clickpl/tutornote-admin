"""
테이블 섹션 API 엔드포인트

대시보드용 3개 테이블 데이터를 반환합니다.

API:
    GET /api/admin/tables/at-risk-academies - 이탈 위험 학원
    GET /api/admin/tables/active-academies - 활성 학원 상세
    GET /api/admin/tables/onboarding-funnel - 온보딩 퍼널 분석
"""

import os
from datetime import datetime
from flask import Blueprint, jsonify, request

import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)


tables_bp = Blueprint('tables', __name__)


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
        print(f"[Tables API] DB connection failed: {e}")
        return None


# =============================================================================
# Table 1: 이탈 위험 학원
# =============================================================================
@tables_bp.route('/api/admin/tables/at-risk-academies', methods=['GET'])
def get_at_risk_academies():
    """이탈 위험 학원 목록 (7일 이상 무활동)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                a.id,
                a.name as academy_name,
                a.owner_name,
                a.phone,
                COUNT(DISTINCT s.id) as student_count,
                COUNT(DISTINCT pr.id) as report_count,
                MAX(al.created_at) as last_activity,
                DATEDIFF(NOW(), COALESCE(MAX(al.created_at), a.created_at)) as inactive_days,
                a.created_at as signup_date
            FROM academies a
            LEFT JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
            LEFT JOIN progress_records pr ON s.id = pr.student_id AND pr.is_deleted = 0
            LEFT JOIN activity_logs al ON a.id = al.academy_id
            WHERE a.is_deleted = 0
            AND NOT EXISTS (
                SELECT 1 FROM activity_logs al2
                WHERE al2.academy_id = a.id
                AND al2.created_at >= NOW() - INTERVAL 7 DAY
            )
            GROUP BY a.id
            ORDER BY inactive_days DESC
            LIMIT 50
        """)

        results = cursor.fetchall()

        # 위험 수준 판정
        for row in results:
            days = row['inactive_days'] or 0
            if days >= 21:
                row['risk_level'] = 'critical'
            elif days >= 14:
                row['risk_level'] = 'warning'
            else:
                row['risk_level'] = 'caution'

            # datetime 변환
            if row['last_activity']:
                row['last_activity'] = row['last_activity'].isoformat()
            if row['signup_date']:
                row['signup_date'] = row['signup_date'].isoformat()

        cursor.close()
        conn.close()

        return jsonify({
            'academies': results,
            'total_count': len(results)
        })

    except Exception as e:
        print(f"[Tables API] At-risk academies error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Table 2: 활성 학원 상세
# =============================================================================
@tables_bp.route('/api/admin/tables/active-academies', methods=['GET'])
def get_active_academies():
    """활성 학원 상세 목록"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                a.id,
                a.name as academy_name,
                a.owner_name,
                a.phone,
                COUNT(DISTINCT s.id) as student_count,
                COUNT(DISTINCT CASE WHEN pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN pr.id END) as monthly_reports,
                COUNT(DISTINCT CASE WHEN al.action_type = 'share_kakaotalk' THEN al.id END) as total_shares,
                MAX(al.created_at) as last_activity,
                a.created_at as signup_date
            FROM academies a
            JOIN (
                SELECT DISTINCT academy_id
                FROM activity_logs
                WHERE created_at >= NOW() - INTERVAL 7 DAY
            ) active ON a.id = active.academy_id
            LEFT JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
            LEFT JOIN progress_records pr ON s.id = pr.student_id AND pr.is_deleted = 0
            LEFT JOIN activity_logs al ON a.id = al.academy_id
            WHERE a.is_deleted = 0
            GROUP BY a.id
            ORDER BY monthly_reports DESC
            LIMIT 50
        """)

        results = cursor.fetchall()

        # 헤비유저 및 플랜 추천 판정
        for row in results:
            monthly_reports = row['monthly_reports'] or 0

            # 헤비유저 판정 (월 20건 이상)
            row['is_heavy_user'] = monthly_reports >= 20

            # 플랜 추천
            if monthly_reports >= 50:
                row['recommended_plan'] = 'Pro'
            elif monthly_reports >= 20:
                row['recommended_plan'] = 'Standard'
            else:
                row['recommended_plan'] = 'Free'

            # datetime 변환
            if row['last_activity']:
                row['last_activity'] = row['last_activity'].isoformat()
            if row['signup_date']:
                row['signup_date'] = row['signup_date'].isoformat()

        cursor.close()
        conn.close()

        return jsonify({
            'academies': results,
            'total_count': len(results)
        })

    except Exception as e:
        print(f"[Tables API] Active academies error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Table 3: 온보딩 퍼널 분석
# =============================================================================
@tables_bp.route('/api/admin/tables/onboarding-funnel', methods=['GET'])
def get_onboarding_funnel_table():
    """온보딩 퍼널 분석 테이블 (최근 30일 신규 학원)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 신규 학원별 퍼널 진행 상황
        cursor.execute("""
            SELECT
                a.id,
                a.name as academy_name,
                a.owner_name,
                a.created_at as signup_date,
                CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as has_students,
                COUNT(DISTINCT s.id) as student_count,
                CASE WHEN pr.id IS NOT NULL THEN 1 ELSE 0 END as created_report,
                COUNT(DISTINCT pr.id) as report_count,
                CASE WHEN al.id IS NOT NULL THEN 1 ELSE 0 END as shared_kakaotalk,
                MIN(s.created_at) as first_student_date,
                MIN(pr.created_at) as first_report_date,
                MIN(CASE WHEN al.action_type = 'share_kakaotalk' THEN al.created_at END) as first_share_date
            FROM academies a
            LEFT JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
            LEFT JOIN progress_records pr ON s.id = pr.student_id AND pr.is_deleted = 0
            LEFT JOIN activity_logs al ON a.id = al.academy_id AND al.action_type = 'share_kakaotalk'
            WHERE a.created_at >= NOW() - INTERVAL 30 DAY
            AND a.is_deleted = 0
            GROUP BY a.id
            ORDER BY a.created_at DESC
        """)

        results = cursor.fetchall()

        # 퍼널 단계 판정
        for row in results:
            # 현재 단계 결정
            if row['shared_kakaotalk']:
                row['current_step'] = 4
                row['status'] = 'completed'
            elif row['created_report']:
                row['current_step'] = 3
                row['status'] = 'report_created'
            elif row['has_students']:
                row['current_step'] = 2
                row['status'] = 'student_added'
            else:
                row['current_step'] = 1
                row['status'] = 'signup_only'

            # datetime 변환
            for field in ['signup_date', 'first_student_date', 'first_report_date', 'first_share_date']:
                if row[field]:
                    row[field] = row[field].isoformat()

        cursor.close()
        conn.close()

        # 퍼널 요약 통계
        total = len(results)
        step_counts = {
            'signup': total,
            'student_added': sum(1 for r in results if r['has_students']),
            'report_created': sum(1 for r in results if r['created_report']),
            'shared': sum(1 for r in results if r['shared_kakaotalk'])
        }

        return jsonify({
            'academies': results,
            'total_count': total,
            'funnel_summary': step_counts,
            'conversion_rates': {
                'signup_to_student': round((step_counts['student_added'] / total * 100), 1) if total > 0 else 0,
                'student_to_report': round((step_counts['report_created'] / step_counts['student_added'] * 100), 1) if step_counts['student_added'] > 0 else 0,
                'report_to_share': round((step_counts['shared'] / step_counts['report_created'] * 100), 1) if step_counts['report_created'] > 0 else 0,
                'overall': round((step_counts['shared'] / total * 100), 1) if total > 0 else 0
            }
        })

    except Exception as e:
        print(f"[Tables API] Onboarding funnel error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# 헤비유저 학원 목록
# =============================================================================
@tables_bp.route('/api/admin/tables/heavy-users', methods=['GET'])
def get_heavy_users():
    """헤비유저 학원 목록 (월 20건 이상)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                a.id,
                a.name as academy_name,
                a.owner_name,
                COUNT(DISTINCT s.id) as student_count,
                COUNT(DISTINCT pr.id) as monthly_reports,
                COUNT(DISTINCT CASE WHEN al.action_type = 'share_kakaotalk' THEN al.id END) as total_shares,
                a.created_at as signup_date
            FROM academies a
            JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
            JOIN progress_records pr ON s.id = pr.student_id
                AND pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
                AND pr.is_deleted = 0
            LEFT JOIN activity_logs al ON a.id = al.academy_id
            WHERE a.is_deleted = 0
            GROUP BY a.id
            HAVING COUNT(DISTINCT pr.id) >= 20
            ORDER BY monthly_reports DESC
        """)

        results = cursor.fetchall()

        for row in results:
            if row['signup_date']:
                row['signup_date'] = row['signup_date'].isoformat()

        cursor.close()
        conn.close()

        return jsonify({
            'academies': results,
            'total_count': len(results)
        })

    except Exception as e:
        print(f"[Tables API] Heavy users error: {e}")
        return jsonify({'error': str(e)}), 500


# Blueprint 등록용 함수
def register_tables_routes(app):
    """Flask 앱에 tables Blueprint 등록"""
    app.register_blueprint(tables_bp)
