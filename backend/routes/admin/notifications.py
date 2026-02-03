"""
알림 관리 API 엔드포인트

카카오 알림톡 + 텔레그램 알림 트래킹 대시보드 API

API:
    # 카카오 알림톡
    GET /api/admin/notifications/kakao/metrics - 메트릭 요약
    GET /api/admin/notifications/kakao/chart - 발송 추이 차트 (7일)
    GET /api/admin/notifications/kakao/templates - 템플릿 현황
    GET /api/admin/notifications/kakao/history - 발송 이력

    # 텔레그램 알림
    GET /api/admin/notifications/telegram/status - 알림 유형별 상태
    GET /api/admin/notifications/telegram/chart - 알림 현황 차트 (24시간)
    GET /api/admin/notifications/telegram/errors - 에러 알림 이력
    PUT /api/admin/notifications/telegram/config - 설정 변경
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from flask import Blueprint, jsonify, request

import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)


notifications_bp = Blueprint('notifications', __name__)


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
        print(f"[Notifications API] DB connection failed: {e}")
        return None


# =============================================================================
# 카카오 알림톡 API
# =============================================================================

@notifications_bp.route('/api/admin/notifications/kakao/metrics', methods=['GET'])
def get_kakao_metrics():
    """카카오 알림톡 메트릭 요약"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        month_start = today.replace(day=1)

        # 오늘 발송
        cursor.execute("""
            SELECT
                COUNT(*) as count,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM kakao_notification_log
            WHERE DATE(sent_at) = %s
        """, (today,))
        today_stats = cursor.fetchone()

        # 이번달 발송
        cursor.execute("""
            SELECT
                COUNT(*) as count,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                COALESCE(SUM(cost), 0) as cost
            FROM kakao_notification_log
            WHERE sent_at >= %s
        """, (month_start,))
        month_stats = cursor.fetchone()

        # 어제 발송
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM kakao_notification_log
            WHERE DATE(sent_at) = %s
        """, (yesterday,))
        yesterday_stats = cursor.fetchone()

        # 성공률 계산
        success_rate = 0
        if month_stats['count'] and month_stats['count'] > 0:
            success_rate = (month_stats['success'] / month_stats['count']) * 100

        # 전일 대비 증감률
        trend = "0"
        today_count = today_stats['count'] or 0
        yesterday_count = yesterday_stats['count'] or 0
        if yesterday_count > 0:
            trend_value = ((today_count - yesterday_count) / yesterday_count) * 100
            trend = f"{'+' if trend_value > 0 else ''}{round(trend_value, 1)}"

        return jsonify({
            'channel_status': 'approved',
            'today_count': today_count,
            'today_success': today_stats['success'] or 0,
            'today_failed': today_stats['failed'] or 0,
            'month_count': month_stats['count'] or 0,
            'month_success': month_stats['success'] or 0,
            'month_failed': month_stats['failed'] or 0,
            'success_rate': round(success_rate, 1),
            'month_cost': float(month_stats['cost'] or 0),
            'yesterday_count': yesterday_count,
            'trend': trend
        }), 200

    except Exception as e:
        print(f"[Kakao Metrics] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@notifications_bp.route('/api/admin/notifications/kakao/chart', methods=['GET'])
def get_kakao_chart():
    """발송 추이 차트 (7일)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        days = int(request.args.get('days', 7))
        if days > 30:
            days = 30

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days-1)

        cursor.execute("""
            SELECT
                DATE(sent_at) as date,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                COUNT(*) as total
            FROM kakao_notification_log
            WHERE DATE(sent_at) >= %s AND DATE(sent_at) <= %s
            GROUP BY DATE(sent_at)
            ORDER BY DATE(sent_at)
        """, (start_date, end_date))

        results = cursor.fetchall()

        # 날짜별 데이터 정제 (빈 날짜 포함)
        date_data = {r['date']: r for r in results}
        data = []
        current_date = start_date
        while current_date <= end_date:
            if current_date in date_data:
                row = date_data[current_date]
                data.append({
                    'date': row['date'].strftime('%Y-%m-%d'),
                    'success': row['success'],
                    'failed': row['failed'],
                    'total': row['total']
                })
            else:
                data.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'success': 0,
                    'failed': 0,
                    'total': 0
                })
            current_date += timedelta(days=1)

        return jsonify({'data': data}), 200

    except Exception as e:
        print(f"[Kakao Chart] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@notifications_bp.route('/api/admin/notifications/kakao/templates', methods=['GET'])
def get_kakao_templates():
    """템플릿 현황"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                template_code,
                template_name,
                category,
                status,
                last_used_at,
                use_count,
                approved_at
            FROM kakao_templates
            ORDER BY use_count DESC, template_name
        """)

        templates = cursor.fetchall()

        # datetime 직렬화
        for t in templates:
            if t['last_used_at']:
                t['last_used_at'] = t['last_used_at'].strftime('%Y-%m-%d %H:%M:%S')
            if t['approved_at']:
                t['approved_at'] = t['approved_at'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({'templates': templates}), 200

    except Exception as e:
        print(f"[Kakao Templates] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@notifications_bp.route('/api/admin/notifications/kakao/history', methods=['GET'])
def get_kakao_history():
    """발송 이력"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 페이지네이션
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        if page_size > 100:
            page_size = 100
        offset = (page - 1) * page_size

        # 필터
        academy_id = request.args.get('academy_id')
        template_code = request.args.get('template_code')
        status = request.args.get('status')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')

        # WHERE 조건 구성
        where_clauses = []
        params = []

        if academy_id:
            where_clauses.append("k.academy_id = %s")
            params.append(academy_id)
        if template_code:
            where_clauses.append("k.template_code = %s")
            params.append(template_code)
        if status:
            where_clauses.append("k.status = %s")
            params.append(status)
        if date_from:
            where_clauses.append("DATE(k.sent_at) >= %s")
            params.append(date_from)
        if date_to:
            where_clauses.append("DATE(k.sent_at) <= %s")
            params.append(date_to)

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        # 전체 개수
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM kakao_notification_log k
            {where_sql}
        """, params)
        total = cursor.fetchone()['total']

        # 데이터 조회
        cursor.execute(f"""
            SELECT
                k.id,
                k.sent_at,
                k.academy_id,
                COALESCE(a.name, '삭제된 학원') as academy_name,
                k.template_code,
                k.template_name,
                k.phone,
                k.receiver_name,
                k.status,
                k.error_code,
                k.error_message,
                k.cost,
                k.message_id
            FROM kakao_notification_log k
            LEFT JOIN academies a ON k.academy_id = a.id
            {where_sql}
            ORDER BY k.sent_at DESC
            LIMIT %s OFFSET %s
        """, params + [page_size, offset])

        items = cursor.fetchall()

        # datetime 직렬화
        for item in items:
            if item['sent_at']:
                item['sent_at'] = item['sent_at'].strftime('%Y-%m-%d %H:%M:%S')
            item['cost'] = float(item['cost']) if item['cost'] else 0

        # 요약 (필터 적용된 결과)
        cursor.execute(f"""
            SELECT
                COUNT(*) as total_count,
                SUM(CASE WHEN k.status = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN k.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                COALESCE(SUM(k.cost), 0) as total_cost
            FROM kakao_notification_log k
            {where_sql}
        """, params)
        summary = cursor.fetchone()

        return jsonify({
            'items': items,
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            },
            'summary': {
                'total_count': summary['total_count'] or 0,
                'success_count': summary['success_count'] or 0,
                'failed_count': summary['failed_count'] or 0,
                'total_cost': float(summary['total_cost'] or 0)
            }
        }), 200

    except Exception as e:
        print(f"[Kakao History] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


# =============================================================================
# 텔레그램 알림 API
# =============================================================================

@notifications_bp.route('/api/admin/notifications/telegram/status', methods=['GET'])
def get_telegram_status():
    """알림 유형별 상태"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        today = datetime.now().date()

        # 설정 조회
        cursor.execute("""
            SELECT
                notification_type,
                is_enabled,
                schedule_time,
                check_interval,
                config
            FROM telegram_notification_config
        """)
        configs = {c['notification_type']: c for c in cursor.fetchall()}

        # 유형별 오늘 발송 통계
        cursor.execute("""
            SELECT
                notification_type,
                COUNT(*) as today_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as today_failed,
                MAX(sent_at) as last_sent_at
            FROM telegram_notification_log
            WHERE DATE(sent_at) = %s
            GROUP BY notification_type
        """, (today,))
        today_stats = {s['notification_type']: s for s in cursor.fetchall()}

        # 유형 정보 정의
        type_info = {
            'server_check': {'name': '서버 점검', 'description': '5분마다 서버 리소스 체크'},
            'daily_report': {'name': '일일 점검 리포트', 'description': '매일 오전 9시 발송'},
            'service_report': {'name': '서비스 리포트', 'description': '매일 오전 9시 발송'},
            'error': {'name': '에러 알림', 'description': '서비스 에러 즉시 알림'}
        }

        types = []
        for ntype, info in type_info.items():
            config = configs.get(ntype, {})
            stats = today_stats.get(ntype, {})

            # config JSON 파싱
            config_data = {}
            if config.get('config'):
                if isinstance(config['config'], str):
                    config_data = json.loads(config['config'])
                else:
                    config_data = config['config']

            # schedule_time 직렬화
            schedule_time = None
            if config.get('schedule_time'):
                schedule_time = str(config['schedule_time'])

            # last_sent_at 직렬화
            last_sent_at = None
            if stats.get('last_sent_at'):
                last_sent_at = stats['last_sent_at'].strftime('%Y-%m-%d %H:%M:%S')

            types.append({
                'notification_type': ntype,
                'name': info['name'],
                'description': info['description'],
                'is_enabled': bool(config.get('is_enabled', True)),
                'check_interval': config.get('check_interval'),
                'schedule_time': schedule_time,
                'last_sent_at': last_sent_at,
                'today_count': stats.get('today_count', 0),
                'today_failed': stats.get('today_failed', 0),
                'config': config_data
            })

        return jsonify({'types': types}), 200

    except Exception as e:
        print(f"[Telegram Status] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@notifications_bp.route('/api/admin/notifications/telegram/chart', methods=['GET'])
def get_telegram_chart():
    """알림 현황 차트 (24시간)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        hours = int(request.args.get('hours', 24))
        if hours > 168:
            hours = 168

        start_time = datetime.now() - timedelta(hours=hours)

        # KST (UTC+9)로 변환하여 조회
        # start_time도 KST 기준으로 계산
        from datetime import timezone
        kst_offset = timedelta(hours=9)
        now_kst = datetime.now() + kst_offset
        start_time_kst = now_kst - timedelta(hours=hours)
        start_time_str = (start_time - kst_offset).strftime('%Y-%m-%d %H:%M:%S')  # UTC로 변환하여 DB 조회

        # DATE_FORMAT에서 %를 사용하기 위해 포맷 문자열을 별도 변수로
        date_format = '%Y-%m-%d %H'

        # sent_at을 KST로 변환하여 그룹핑
        cursor.execute(
            "SELECT "
            "DATE_FORMAT(DATE_ADD(sent_at, INTERVAL 9 HOUR), %s) as hour_key, "
            "notification_type, "
            "COUNT(*) as count "
            "FROM telegram_notification_log "
            "WHERE sent_at >= %s "
            "GROUP BY DATE_FORMAT(DATE_ADD(sent_at, INTERVAL 9 HOUR), %s), notification_type "
            "ORDER BY hour_key",
            (date_format, start_time_str, date_format)
        )

        results = cursor.fetchall()

        # 시간별 데이터 집계
        hour_data = {}
        for r in results:
            hour_key = r['hour_key']  # 예: '2026-01-23 10'
            if hour_key and hour_key not in hour_data:
                # hour_key에서 시간만 추출 (마지막 2자리)
                display_hour = hour_key[-2:] + ':00' if hour_key else '00:00'
                hour_data[hour_key] = {
                    'hour': display_hour,
                    'server_check': 0,
                    'daily_report': 0,
                    'service_report': 0,
                    'error': 0,
                    'total': 0
                }
            if hour_key and r['notification_type']:
                hour_data[hour_key][r['notification_type']] = r['count']
                hour_data[hour_key]['total'] += r['count']

        # 빈 시간대 채우기 (KST 기준)
        data = []
        current_time = start_time_kst.replace(minute=0, second=0, microsecond=0)
        end_time = now_kst.replace(minute=0, second=0, microsecond=0)

        while current_time <= end_time:
            hour_key = current_time.strftime('%Y-%m-%d %H')
            if hour_key in hour_data:
                data.append(hour_data[hour_key])
            else:
                data.append({
                    'hour': current_time.strftime('%H:%M'),
                    'server_check': 0,
                    'daily_report': 0,
                    'service_report': 0,
                    'error': 0,
                    'total': 0
                })
            current_time += timedelta(hours=1)

        return jsonify({'data': data}), 200

    except Exception as e:
        print(f"[Telegram Chart] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@notifications_bp.route('/api/admin/notifications/telegram/errors', methods=['GET'])
def get_telegram_errors():
    """에러 알림 이력"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 페이지네이션
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        if page_size > 100:
            page_size = 100
        offset = (page - 1) * page_size

        # 필터
        severity = request.args.get('severity')
        error_code = request.args.get('error_code')
        academy_id = request.args.get('academy_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')

        # WHERE 조건 구성
        where_clauses = ["notification_type = 'error'"]
        params = []

        if severity:
            where_clauses.append("severity = %s")
            params.append(severity)
        if error_code:
            where_clauses.append("error_code = %s")
            params.append(error_code)
        if academy_id:
            where_clauses.append("academy_id = %s")
            params.append(academy_id)
        if date_from:
            where_clauses.append("DATE(sent_at) >= %s")
            params.append(date_from)
        if date_to:
            where_clauses.append("DATE(sent_at) <= %s")
            params.append(date_to)

        where_sql = "WHERE " + " AND ".join(where_clauses)

        # 전체 개수
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM telegram_notification_log
            {where_sql}
        """, params)
        total = cursor.fetchone()['total']

        # 데이터 조회
        cursor.execute(f"""
            SELECT
                id,
                sent_at,
                notification_type,
                severity,
                title,
                message,
                error_code,
                error_type,
                academy_id,
                academy_name,
                status,
                telegram_message_id,
                metadata
            FROM telegram_notification_log
            {where_sql}
            ORDER BY sent_at DESC
            LIMIT %s OFFSET %s
        """, params + [page_size, offset])

        items = cursor.fetchall()

        # datetime 및 JSON 직렬화
        for item in items:
            if item['sent_at']:
                item['sent_at'] = item['sent_at'].strftime('%Y-%m-%d %H:%M:%S')
            if item['metadata']:
                if isinstance(item['metadata'], str):
                    item['metadata'] = json.loads(item['metadata'])

        # 심각도별 요약
        cursor.execute(f"""
            SELECT
                severity,
                COUNT(*) as count
            FROM telegram_notification_log
            {where_sql}
            GROUP BY severity
        """, params)
        severity_counts = {s['severity']: s['count'] for s in cursor.fetchall()}

        return jsonify({
            'items': items,
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            },
            'summary': {
                'critical': severity_counts.get('critical', 0),
                'high': severity_counts.get('high', 0),
                'medium': severity_counts.get('medium', 0),
                'low': severity_counts.get('low', 0)
            }
        }), 200

    except Exception as e:
        print(f"[Telegram Errors] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@notifications_bp.route('/api/admin/notifications/telegram/config', methods=['PUT'])
def update_telegram_config():
    """설정 변경"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        data = request.get_json()

        notification_type = data.get('notification_type')
        if not notification_type:
            return jsonify({'error': 'notification_type is required'}), 400

        # 업데이트할 필드 구성
        update_fields = []
        params = []

        if 'is_enabled' in data:
            update_fields.append("is_enabled = %s")
            params.append(data['is_enabled'])

        if 'check_interval' in data:
            update_fields.append("check_interval = %s")
            params.append(data['check_interval'])

        if 'schedule_time' in data:
            update_fields.append("schedule_time = %s")
            params.append(data['schedule_time'])

        if 'config' in data:
            update_fields.append("config = %s")
            params.append(json.dumps(data['config']))

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        params.append(notification_type)

        cursor.execute(f"""
            UPDATE telegram_notification_config
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE notification_type = %s
        """, params)

        conn.commit()

        # 업데이트된 설정 반환
        cursor.execute("""
            SELECT
                notification_type,
                is_enabled,
                check_interval,
                schedule_time,
                config
            FROM telegram_notification_config
            WHERE notification_type = %s
        """, (notification_type,))

        config = cursor.fetchone()
        if config:
            if config['schedule_time']:
                config['schedule_time'] = str(config['schedule_time'])
            if config['config']:
                if isinstance(config['config'], str):
                    config['config'] = json.loads(config['config'])

        return jsonify({
            'success': True,
            'message': '설정이 변경되었습니다',
            'config': config
        }), 200

    except Exception as e:
        print(f"[Telegram Config] Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


# =============================================================================
# Blueprint 등록 함수
# =============================================================================

def register_notifications_routes(app):
    """Notifications Blueprint 등록"""
    app.register_blueprint(notifications_bp)
    print("[Notifications API] Routes registered")
