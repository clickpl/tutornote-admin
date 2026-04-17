"""
Alert Checker 유틸리티

각 Alert 타입별로 체크 함수를 제공하며, 모든 Alert를 한번에 체크하는 기능을 제공합니다.

사용 예시:
    >>> from utils.alert_checker import check_all_alerts, check_cpu_alert
    >>> alerts = check_all_alerts()
    >>> cpu_alert = check_cpu_alert()
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

# 프로젝트 루트 설정
import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from config.alert_thresholds import get_threshold, get_cooldown


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
        print(f"[AlertChecker] DB connection failed: {e}")
        return None


def check_cpu_alert() -> Optional[Dict]:
    """
    CPU 사용률 Alert 체크

    최근 5분 평균 CPU 사용률을 기준으로 Warning/Critical Alert 생성

    Returns:
        dict: Alert 정보 (severity, type, value, threshold) or None
    """
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
        print(f"[AlertChecker] CPU check error: {e}")

    return None


def check_ram_alert() -> Optional[Dict]:
    """
    RAM 사용률 Alert 체크

    최근 5분 평균 RAM 사용률을 기준으로 Warning/Critical Alert 생성

    Returns:
        dict: Alert 정보 or None
    """
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
        print(f"[AlertChecker] RAM check error: {e}")

    return None


def check_disk_alert() -> Optional[Dict]:
    """
    Disk 사용률 Alert 체크

    최근 5분 평균 Disk 사용률을 기준으로 Warning/Critical Alert 생성

    Returns:
        dict: Alert 정보 or None
    """
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
        print(f"[AlertChecker] Disk check error: {e}")

    return None


def check_backend_restart_alert() -> Optional[Dict]:
    """
    Backend 재시작 빈도 Alert 체크

    최근 24시간 내 Backend 재시작 횟수를 기준으로 Alert 생성
    PM2 로그 또는 system_health_logs 기반

    Returns:
        dict: Alert 정보 or None
    """
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)

        # system_health_logs에서 연결 끊김 횟수로 재시작 횟수 추정
        # (실제 PM2 로그 파싱이 더 정확하지만, DB 기반으로 단순화)
        cursor.execute("""
            SELECT COUNT(*) as restart_count
            FROM (
                SELECT
                    created_at,
                    LAG(created_at) OVER (ORDER BY created_at) as prev_time
                FROM system_health_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ) t
            WHERE TIMESTAMPDIFF(MINUTE, prev_time, created_at) > 10
        """)

        result = cursor.fetchone()
        restart_count = result['restart_count'] if result else 0

        cursor.close()
        conn.close()

        restart_critical = get_threshold('system', 'backend_restart', 'critical')
        restart_warning = get_threshold('system', 'backend_restart', 'warning')

        if restart_count > restart_critical:
            return {
                'severity': 'critical',
                'type': 'backend_restart',
                'value': restart_count,
                'threshold': restart_critical
            }
        elif restart_count > restart_warning:
            return {
                'severity': 'warning',
                'type': 'backend_restart',
                'value': restart_count,
                'threshold': restart_warning
            }

    except Exception as e:
        print(f"[AlertChecker] Backend restart check error: {e}")

    return None


def check_inactive_academy_alert() -> Optional[Dict]:
    """
    무활동 학원 Alert 체크

    설정된 기간 이상 활동이 없는 학원 수를 기준으로 Alert 생성

    Returns:
        dict: Alert 정보 or None
    """
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)

        inactive_days_critical = get_threshold('business', 'inactive_days', 'critical')
        inactive_days_warning = get_threshold('business', 'inactive_days', 'warning')

        # 활동이 없는 학원 수 조회
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
        inactive_count_critical = result['count'] if result else 0

        # Warning 레벨도 체크
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
        """, (inactive_days_warning,))

        result = cursor.fetchone()
        inactive_count_warning = result['count'] if result else 0

        cursor.close()
        conn.close()

        if inactive_count_critical > 0:
            return {
                'severity': 'critical',
                'type': 'inactive_academy',
                'value': inactive_count_critical,
                'threshold': inactive_days_critical
            }
        elif inactive_count_warning > 0:
            return {
                'severity': 'warning',
                'type': 'inactive_academy',
                'value': inactive_count_warning,
                'threshold': inactive_days_warning
            }

    except Exception as e:
        print(f"[AlertChecker] Inactive academy check error: {e}")

    return None


def check_parent_view_rate_alert() -> Optional[Dict]:
    """
    학부모 열람률 저조 Alert 체크

    최근 7일간 리포트 열람률이 낮은 경우 Alert 생성

    Returns:
        dict: Alert 정보 or None
    """
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)

        # 최근 7일간 리포트 열람률 계산
        cursor.execute("""
            SELECT
                COUNT(DISTINCT rv.report_id) as viewed,
                (SELECT COUNT(*) FROM progress_records
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 AND is_sample = 0) as total
            FROM report_views rv
            WHERE rv.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """)

        result = cursor.fetchone()
        viewed = result['viewed'] if result else 0
        total = result['total'] if result else 0

        cursor.close()
        conn.close()

        if total > 0:
            view_rate = (viewed / total) * 100

            view_rate_warning = get_threshold('business', 'parent_view_rate', 'warning')
            view_rate_critical = get_threshold('business', 'parent_view_rate', 'critical')

            if view_rate < view_rate_critical:
                return {
                    'severity': 'critical',
                    'type': 'parent_view_rate',
                    'value': view_rate,
                    'threshold': view_rate_critical
                }
            elif view_rate < view_rate_warning:
                return {
                    'severity': 'warning',
                    'type': 'parent_view_rate',
                    'value': view_rate,
                    'threshold': view_rate_warning
                }

    except Exception as e:
        print(f"[AlertChecker] Parent view rate check error: {e}")

    return None


def check_api_error_rate_alert() -> Optional[Dict]:
    """
    API 에러율 Alert 체크

    최근 1시간 API 호출 에러율을 기준으로 Alert 생성

    Returns:
        dict: Alert 정보 or None
    """
    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)

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
        print(f"[AlertChecker] API error rate check error: {e}")

    return None


def format_alert_message(alert: Dict) -> Dict:
    """
    Alert 데이터를 UI용 메시지로 변환

    Args:
        alert: Raw alert 데이터

    Returns:
        dict: UI 표시용 포맷팅된 Alert 데이터
    """
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
        'backend_restart': {
            'title': f"Backend 재시작 빈도 이상: {int(alert['value'])}회",
            'description': f"최근 24시간 동안 Backend가 {int(alert['value'])}회 재시작되었습니다.",
            'action': "에러 로그 확인 및 안정성 점검이 필요합니다."
        },
        'inactive_academy': {
            'title': f"무활동 학원 감지: {int(alert['value'])}개",
            'description': f"{int(alert['threshold'])}일 이상 활동이 없는 학원이 {int(alert['value'])}개 있습니다.",
            'action': "고객 이탈 방지를 위한 연락이 필요합니다."
        },
        'parent_view_rate': {
            'title': f"학부모 열람률 저조: {alert['value']:.1f}%",
            'description': f"최근 7일간 리포트 열람률이 {alert['value']:.1f}%로 낮습니다.",
            'action': "알림톡 발송 또는 학원 교육이 필요합니다."
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


def check_all_alerts() -> List[Dict]:
    """
    모든 Alert 체크 및 수집

    등록된 모든 Alert 체크 함수를 실행하고 결과를 수집합니다.

    Returns:
        list: 포맷팅된 Alert 목록 (Critical 먼저 정렬)
    """
    alerts = []

    # Alert 체크 함수 목록
    check_functions = [
        check_cpu_alert,
        check_ram_alert,
        check_disk_alert,
        check_backend_restart_alert,
        check_inactive_academy_alert,
        check_parent_view_rate_alert,
        check_api_error_rate_alert,
    ]

    for check_fn in check_functions:
        try:
            alert = check_fn()
            if alert:
                formatted = format_alert_message(alert)
                alerts.append(formatted)
        except Exception as e:
            print(f"[AlertChecker] Check function {check_fn.__name__} error: {e}")

    # Critical Alert를 먼저, 그 다음 Warning 정렬
    alerts.sort(key=lambda x: (0 if x['severity'] == 'critical' else 1, x['type']))

    return alerts


def get_alert_summary() -> Dict[str, Any]:
    """
    Alert 요약 정보 반환

    Returns:
        dict: {
            'critical_count': int,
            'warning_count': int,
            'total_count': int,
            'alerts': list
        }
    """
    alerts = check_all_alerts()

    critical_count = len([a for a in alerts if a['severity'] == 'critical'])
    warning_count = len([a for a in alerts if a['severity'] == 'warning'])

    return {
        'critical_count': critical_count,
        'warning_count': warning_count,
        'total_count': len(alerts),
        'alerts': alerts
    }


if __name__ == '__main__':
    """테스트 실행"""
    print("=== Alert Checker Test ===\n")

    summary = get_alert_summary()

    print(f"Critical: {summary['critical_count']}")
    print(f"Warning: {summary['warning_count']}")
    print(f"Total: {summary['total_count']}")
    print()

    for alert in summary['alerts']:
        emoji = "🔴" if alert['severity'] == 'critical' else "🟡"
        print(f"{emoji} [{alert['severity'].upper()}] {alert['title']}")
        print(f"   {alert['description']}")
        print(f"   -> {alert['action']}")
        print()
