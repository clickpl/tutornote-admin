"""
Critical Alerts API 엔드포인트

대시보드용 Critical/Warning Alert 목록을 반환합니다.

API:
    GET /api/admin/dashboard/alerts - 현재 활성 Alert 목록 조회
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from flask import Blueprint, jsonify

# 프로젝트 루트 설정
import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)

from config.alert_thresholds import get_threshold

alerts_bp = Blueprint('alerts', __name__)


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
        print(f"[Alerts API] DB connection failed: {e}")
        return None


def check_cpu_alert() -> Optional[Dict]:
    """CPU 사용률 Alert 체크 (최근 5분 평균)"""
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT AVG(cpu_usage) as avg_cpu
            FROM system_health_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        """)
        result = cursor.fetchone()
        avg_cpu = float(result['avg_cpu']) if result and result['avg_cpu'] else 0

        cursor.close()
        conn.close()

        cpu_warning = get_threshold('system', 'cpu', 'warning')
        cpu_critical = get_threshold('system', 'cpu', 'critical')

        if avg_cpu > cpu_critical:
            return {
                'severity': 'critical',
                'type': 'cpu_usage',
                'value': avg_cpu,
                'threshold': cpu_critical
            }
        elif avg_cpu > cpu_warning:
            return {
                'severity': 'warning',
                'type': 'cpu_usage',
                'value': avg_cpu,
                'threshold': cpu_warning
            }

    except Exception as e:
        print(f"[Alerts API] CPU check error: {e}")

    return None


def check_ram_alert() -> Optional[Dict]:
    """RAM 사용률 Alert 체크 (최근 5분 평균)"""
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT AVG(ram_usage) as avg_ram
            FROM system_health_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        """)
        result = cursor.fetchone()
        avg_ram = float(result['avg_ram']) if result and result['avg_ram'] else 0

        cursor.close()
        conn.close()

        ram_warning = get_threshold('system', 'ram', 'warning')
        ram_critical = get_threshold('system', 'ram', 'critical')

        if avg_ram > ram_critical:
            return {
                'severity': 'critical',
                'type': 'ram_usage',
                'value': avg_ram,
                'threshold': ram_critical
            }
        elif avg_ram > ram_warning:
            return {
                'severity': 'warning',
                'type': 'ram_usage',
                'value': avg_ram,
                'threshold': ram_warning
            }

    except Exception as e:
        print(f"[Alerts API] RAM check error: {e}")

    return None


def check_disk_alert() -> Optional[Dict]:
    """Disk 사용률 Alert 체크 (최근 5분 평균)"""
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT AVG(disk_usage) as avg_disk
            FROM system_health_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        """)
        result = cursor.fetchone()
        avg_disk = float(result['avg_disk']) if result and result['avg_disk'] else 0

        cursor.close()
        conn.close()

        disk_warning = get_threshold('system', 'disk', 'warning')
        disk_critical = get_threshold('system', 'disk', 'critical')

        if avg_disk > disk_critical:
            return {
                'severity': 'critical',
                'type': 'disk_usage',
                'value': avg_disk,
                'threshold': disk_critical
            }
        elif avg_disk > disk_warning:
            return {
                'severity': 'warning',
                'type': 'disk_usage',
                'value': avg_disk,
                'threshold': disk_warning
            }

    except Exception as e:
        print(f"[Alerts API] Disk check error: {e}")

    return None


def check_inactive_academy_alert() -> Optional[Dict]:
    """무활동 학원 Alert 체크"""
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)

        inactive_days_critical = get_threshold('business', 'inactive_days', 'critical')
        inactive_days_warning = get_threshold('business', 'inactive_days', 'warning')

        # 30일 이상 무활동 학원 수 (Critical)
        cursor.execute("""
            SELECT COUNT(DISTINCT a.id) as count
            FROM academies a
            LEFT JOIN (
                SELECT academy_id, MAX(created_at) as last_activity
                FROM activity_logs
                GROUP BY academy_id
            ) al ON a.id = al.academy_id
            WHERE a.status = 'active'
            AND (al.last_activity IS NULL
                 OR al.last_activity < DATE_SUB(NOW(), INTERVAL %s DAY))
        """, (inactive_days_critical,))

        result = cursor.fetchone()
        inactive_count = result['count'] if result else 0

        cursor.close()
        conn.close()

        if inactive_count > 0:
            return {
                'severity': 'critical',
                'type': 'inactive_academy',
                'value': inactive_count,
                'threshold': inactive_days_critical
            }

    except Exception as e:
        print(f"[Alerts API] Inactive academy check error: {e}")

    return None


def check_api_error_rate_alert() -> Optional[Dict]:
    """API 에러율 Alert 체크"""
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)

        # 최근 1시간 API 에러율
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
            FROM api_usage_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        """)
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if result and result['total'] and result['total'] > 0:
            total = result['total']
            errors = result['errors'] or 0
            error_rate = (errors / total) * 100

            api_error_warning = get_threshold('system', 'api_error_rate', 'warning')
            api_error_critical = get_threshold('system', 'api_error_rate', 'critical')

            if error_rate > api_error_critical:
                return {
                    'severity': 'critical',
                    'type': 'api_error_rate',
                    'value': error_rate,
                    'threshold': api_error_critical
                }
            elif error_rate > api_error_warning:
                return {
                    'severity': 'warning',
                    'type': 'api_error_rate',
                    'value': error_rate,
                    'threshold': api_error_warning
                }

    except Exception as e:
        print(f"[Alerts API] API error rate check error: {e}")

    return None


def format_alert_message(alert: Dict) -> Dict:
    """Alert 데이터를 UI용 메시지로 변환"""
    type_messages = {
        'cpu_usage': {
            'title': f"CPU 사용률 {'위험' if alert['severity'] == 'critical' else '주의'}: {alert['value']:.1f}%",
            'description': f"현재 CPU 사용률이 {alert['value']:.1f}%입니다. 시스템 성능 저하 위험.",
            'action': "Backend 재시작 또는 프로세스 확인이 필요합니다."
        },
        'ram_usage': {
            'title': f"RAM 사용률 {'위험' if alert['severity'] == 'critical' else '주의'}: {alert['value']:.1f}%",
            'description': f"현재 RAM 사용률이 {alert['value']:.1f}%입니다. 메모리 부족 위험.",
            'action': "메모리 누수 확인 또는 서버 재시작이 필요합니다."
        },
        'disk_usage': {
            'title': f"디스크 공간 {'부족' if alert['severity'] == 'critical' else '주의'}: {alert['value']:.1f}%",
            'description': f"현재 디스크 사용률이 {alert['value']:.1f}%입니다.",
            'action': "로그 파일 정리 또는 디스크 확장이 필요합니다."
        },
        'inactive_academy': {
            'title': f"무활동 학원 감지: {int(alert['value'])}개",
            'description': f"{int(alert['threshold'])}일 이상 활동이 없는 학원이 {int(alert['value'])}개 있습니다.",
            'action': "고객 이탈 방지를 위한 연락이 필요합니다."
        },
        'api_error_rate': {
            'title': f"API 에러율 {'위험' if alert['severity'] == 'critical' else '주의'}: {alert['value']:.1f}%",
            'description': f"최근 1시간 API 에러율이 {alert['value']:.1f}%입니다.",
            'action': "API 서버 상태 확인 및 에러 로그 분석이 필요합니다."
        },
    }

    msg = type_messages.get(alert['type'], {
        'title': f"알 수 없는 Alert: {alert['type']}",
        'description': f"값: {alert['value']}",
        'action': '확인이 필요합니다.'
    })

    return {
        'id': f"{alert['type']}_{alert['value']:.1f}".replace('.', '_'),
        'severity': alert['severity'],
        'type': alert['type'],
        'title': msg['title'],
        'description': msg['description'],
        'action': msg['action'],
        'value': alert['value'],
        'threshold': alert['threshold'],
        'created_at': datetime.now().isoformat()
    }


def get_all_alerts() -> List[Dict]:
    """모든 Alert 체크 및 수집"""
    alerts = []

    # 각 Alert 체크 함수 실행
    checks = [
        check_cpu_alert,
        check_ram_alert,
        check_disk_alert,
        check_inactive_academy_alert,
        check_api_error_rate_alert,
    ]

    for check_fn in checks:
        try:
            alert = check_fn()
            if alert:
                formatted = format_alert_message(alert)
                alerts.append(formatted)
        except Exception as e:
            print(f"[Alerts API] Check function error: {e}")

    # Critical Alert를 먼저 정렬
    alerts.sort(key=lambda x: (0 if x['severity'] == 'critical' else 1, x['type']))

    return alerts


@alerts_bp.route('/api/admin/dashboard/alerts', methods=['GET'])
def get_alerts():
    """
    Critical Alerts 조회 API

    Returns:
        JSON: {
            "alerts": [...],
            "total_count": int
        }
    """
    try:
        alerts = get_all_alerts()

        return jsonify({
            'alerts': alerts,
            'total_count': len(alerts)
        })

    except Exception as e:
        print(f"[Alerts API] Error: {e}")
        return jsonify({
            'alerts': [],
            'total_count': 0,
            'error': str(e)
        }), 500


# Blueprint 등록용 함수
def register_alerts_routes(app):
    """Flask 앱에 alerts Blueprint 등록"""
    app.register_blueprint(alerts_bp)
