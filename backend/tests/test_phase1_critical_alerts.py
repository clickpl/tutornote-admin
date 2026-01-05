#!/usr/bin/env python3
"""
Phase 1 Critical Alerts UI 검증 테스트

테스트 항목:
1. Alert Checker 함수 (7개 타입)
2. Alert 메시지 포맷팅
3. Alert API 응답 구조
4. Alert 임계값 동작
"""

import os
import sys
from decimal import Decimal

# 프로젝트 루트를 sys.path에 추가
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


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
        print(f"[DB] Connection failed: {e}")
        return None


def test_alert_checker_import():
    """테스트 1: Alert Checker 모듈 임포트"""
    print("\n" + "=" * 50)
    print("테스트 1: Alert Checker 모듈 임포트")
    print("=" * 50)

    try:
        from utils.alert_checker import (
            check_cpu_alert,
            check_ram_alert,
            check_disk_alert,
            check_backend_restart_alert,
            check_inactive_academy_alert,
            check_parent_view_rate_alert,
            check_api_error_rate_alert,
            check_all_alerts,
            format_alert_message,
            get_alert_summary
        )
        print("  ✅ 모든 Alert 체크 함수 임포트 성공")
        print("      - check_cpu_alert")
        print("      - check_ram_alert")
        print("      - check_disk_alert")
        print("      - check_backend_restart_alert")
        print("      - check_inactive_academy_alert")
        print("      - check_parent_view_rate_alert")
        print("      - check_api_error_rate_alert")
        return True
    except ImportError as e:
        print(f"  ❌ 임포트 실패: {e}")
        return False


def test_alert_checker_functions():
    """테스트 2: Alert Checker 함수 실행"""
    print("\n" + "=" * 50)
    print("테스트 2: Alert Checker 함수 실행")
    print("=" * 50)

    try:
        from utils.alert_checker import (
            check_cpu_alert,
            check_ram_alert,
            check_disk_alert,
            check_backend_restart_alert,
            check_inactive_academy_alert,
            check_parent_view_rate_alert,
            check_api_error_rate_alert,
        )

        functions = [
            ('CPU Alert', check_cpu_alert),
            ('RAM Alert', check_ram_alert),
            ('Disk Alert', check_disk_alert),
            ('Backend Restart Alert', check_backend_restart_alert),
            ('Inactive Academy Alert', check_inactive_academy_alert),
            ('Parent View Rate Alert', check_parent_view_rate_alert),
            ('API Error Rate Alert', check_api_error_rate_alert),
        ]

        all_success = True
        for name, fn in functions:
            try:
                result = fn()
                if result:
                    severity = result.get('severity', 'unknown')
                    value = result.get('value', 0)
                    print(f"  ⚠️  {name}: {severity.upper()} - {value:.1f}")
                else:
                    print(f"  ✅ {name}: 정상 (Alert 없음)")
            except Exception as e:
                print(f"  ❌ {name}: 오류 - {e}")
                all_success = False

        return all_success

    except Exception as e:
        print(f"  ❌ 함수 실행 오류: {e}")
        return False


def test_check_all_alerts():
    """테스트 3: 전체 Alert 체크"""
    print("\n" + "=" * 50)
    print("테스트 3: 전체 Alert 체크")
    print("=" * 50)

    try:
        from utils.alert_checker import check_all_alerts

        alerts = check_all_alerts()
        print(f"  총 {len(alerts)}개 Alert 감지")

        if alerts:
            for alert in alerts:
                emoji = "🔴" if alert['severity'] == 'critical' else "🟡"
                print(f"    {emoji} [{alert['severity'].upper()}] {alert['title']}")
        else:
            print("  ✅ 모든 시스템 정상")

        return True

    except Exception as e:
        print(f"  ❌ 전체 Alert 체크 오류: {e}")
        return False


def test_alert_message_format():
    """테스트 4: Alert 메시지 포맷팅"""
    print("\n" + "=" * 50)
    print("테스트 4: Alert 메시지 포맷팅")
    print("=" * 50)

    try:
        from utils.alert_checker import format_alert_message

        test_alert = {
            'severity': 'critical',
            'type': 'cpu_usage',
            'value': 95.5,
            'threshold': 90
        }

        formatted = format_alert_message(test_alert)

        required_fields = ['id', 'severity', 'type', 'title', 'description', 'action', 'value', 'threshold', 'created_at']
        missing_fields = [f for f in required_fields if f not in formatted]

        if missing_fields:
            print(f"  ❌ 누락된 필드: {missing_fields}")
            return False

        print("  ✅ 모든 필드 포함:")
        for field in required_fields:
            value = formatted[field]
            if len(str(value)) > 50:
                value = str(value)[:50] + "..."
            print(f"      - {field}: {value}")

        return True

    except Exception as e:
        print(f"  ❌ 포맷팅 오류: {e}")
        return False


def test_alert_api_response_structure():
    """테스트 5: Alert API 응답 구조"""
    print("\n" + "=" * 50)
    print("테스트 5: Alert API 응답 구조")
    print("=" * 50)

    try:
        from utils.alert_checker import get_alert_summary

        summary = get_alert_summary()

        required_fields = ['critical_count', 'warning_count', 'total_count', 'alerts']
        missing_fields = [f for f in required_fields if f not in summary]

        if missing_fields:
            print(f"  ❌ 누락된 필드: {missing_fields}")
            return False

        print("  ✅ API 응답 구조 정상:")
        print(f"      - critical_count: {summary['critical_count']}")
        print(f"      - warning_count: {summary['warning_count']}")
        print(f"      - total_count: {summary['total_count']}")
        print(f"      - alerts: {len(summary['alerts'])}개")

        return True

    except Exception as e:
        print(f"  ❌ API 구조 오류: {e}")
        return False


def test_alert_threshold_config():
    """테스트 6: Alert 임계값 설정"""
    print("\n" + "=" * 50)
    print("테스트 6: Alert 임계값 설정")
    print("=" * 50)

    try:
        from config.alert_thresholds import get_threshold

        # 시스템 임계값
        system_metrics = ['cpu', 'ram', 'disk']
        print("  System 임계값:")
        for metric in system_metrics:
            warning = get_threshold('system', metric, 'warning')
            critical = get_threshold('system', metric, 'critical')
            print(f"    - {metric.upper()}: Warning {warning}%, Critical {critical}%")

            if warning >= critical:
                print(f"      ❌ Warning이 Critical보다 크거나 같음!")
                return False

        # 비즈니스 임계값
        print("  Business 임계값:")
        inactive_warning = get_threshold('business', 'inactive_days', 'warning')
        inactive_critical = get_threshold('business', 'inactive_days', 'critical')
        print(f"    - 무활동: Warning {inactive_warning}일, Critical {inactive_critical}일")

        print("  ✅ 임계값 설정 정상")
        return True

    except Exception as e:
        print(f"  ❌ 임계값 오류: {e}")
        return False


def test_frontend_component_exists():
    """테스트 7: Frontend 컴포넌트 존재 확인"""
    print("\n" + "=" * 50)
    print("테스트 7: Frontend 컴포넌트 확인")
    print("=" * 50)

    frontend_path = os.path.join(PROJECT_ROOT, '..', 'frontend', 'components', 'dashboard', 'CriticalAlerts.tsx')

    if os.path.exists(frontend_path):
        with open(frontend_path, 'r') as f:
            content = f.read()

        # 필수 요소 확인
        checks = [
            ('fetchAlerts 함수', 'fetchAlerts' in content),
            ('AlertCard 컴포넌트', 'AlertCard' in content),
            ('severity 처리', 'severity' in content),
            ('critical/warning 스타일', 'critical' in content and 'warning' in content),
            ('자동 갱신', 'setInterval' in content),
        ]

        print(f"  파일 경로: {frontend_path}")
        all_passed = True
        for name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"    {status} {name}")
            if not passed:
                all_passed = False

        return all_passed
    else:
        print(f"  ❌ 파일 없음: {frontend_path}")
        return False


def test_simulated_high_ram_alert():
    """테스트 8: RAM Alert 시뮬레이션 (현재 RAM 사용률 체크)"""
    print("\n" + "=" * 50)
    print("테스트 8: RAM Alert 시뮬레이션")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        print("  ❌ DB 연결 실패")
        return False

    try:
        import psutil
        current_ram = psutil.virtual_memory().percent

        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT AVG(ram_usage) as avg_ram
            FROM system_health_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        """)
        result = cursor.fetchone()
        avg_ram_db = float(result['avg_ram']) if result and result['avg_ram'] else 0

        cursor.close()
        conn.close()

        from config.alert_thresholds import get_threshold
        ram_warning = get_threshold('system', 'ram', 'warning')
        ram_critical = get_threshold('system', 'ram', 'critical')

        print(f"  현재 시스템 RAM: {current_ram:.1f}%")
        print(f"  DB 기록 평균 RAM: {avg_ram_db:.1f}%")
        print(f"  임계값: Warning {ram_warning}%, Critical {ram_critical}%")

        if avg_ram_db > ram_critical:
            print(f"  🔴 Critical Alert 발생 예상")
        elif avg_ram_db > ram_warning:
            print(f"  🟡 Warning Alert 발생 예상")
        else:
            print(f"  ✅ Alert 없음 (정상 범위)")

        return True

    except Exception as e:
        print(f"  ❌ 시뮬레이션 오류: {e}")
        return False


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 60)
    print("  Phase 1 Critical Alerts 검증 테스트")
    print("=" * 60)

    results = {
        'alert_checker_import': test_alert_checker_import(),
        'alert_checker_functions': test_alert_checker_functions(),
        'check_all_alerts': test_check_all_alerts(),
        'alert_message_format': test_alert_message_format(),
        'alert_api_response': test_alert_api_response_structure(),
        'alert_threshold_config': test_alert_threshold_config(),
        'frontend_component': test_frontend_component_exists(),
        'ram_alert_simulation': test_simulated_high_ram_alert(),
    }

    print("\n" + "=" * 60)
    print("  테스트 결과 요약")
    print("=" * 60)

    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("  🎉 모든 Critical Alerts 테스트 통과!")
    else:
        print("  ⚠️  일부 테스트 실패 - 확인 필요")
    print("=" * 60 + "\n")

    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
