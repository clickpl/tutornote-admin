#!/usr/bin/env python3
"""
Phase 1 통합 테스트 시나리오

전체 Phase 1 구현을 End-to-End로 검증합니다.

시나리오:
1. DB 연결 및 테이블 확인
2. 학원 활동 시뮬레이션 (login -> report_create -> share)
3. API 사용 로그 시뮬레이션
4. 시스템 헬스체크 실행
5. Alert 체크 및 알림 생성
6. 모든 데이터 조회 및 검증
"""

import os
import sys
import json
import time
from decimal import Decimal
from datetime import datetime

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


def scenario_1_academy_activity():
    """시나리오 1: 학원 활동 시뮬레이션"""
    print("\n" + "=" * 55)
    print("[시나리오 1] 학원 활동 시뮬레이션")
    print("=" * 55)

    from middleware.activity_logger import log_activity

    test_academy_id = 100
    test_user_id = 100

    # 1. 로그인
    print("  1. 로그인 활동 로깅...")
    login_result = log_activity(
        action_type='login',
        academy_id=test_academy_id,
        user_id=test_user_id
    )
    print(f"     {'✅' if login_result else '❌'} 로그인 로깅")

    # 2. 리포트 생성
    print("  2. 리포트 생성 활동 로깅...")
    report_result = log_activity(
        action_type='create_report',
        action_detail={'report_id': 9999, 'ai_generated': True, 'generation_time': 2.5},
        academy_id=test_academy_id,
        user_id=test_user_id
    )
    print(f"     {'✅' if report_result else '❌'} 리포트 생성 로깅")

    # 3. 카카오톡 공유
    print("  3. 카카오톡 공유 활동 로깅...")
    share_result = log_activity(
        action_type='share_kakaotalk',
        action_detail={'report_id': 9999, 'method': 'link'},
        academy_id=test_academy_id,
        user_id=test_user_id
    )
    print(f"     {'✅' if share_result else '❌'} 카카오톡 공유 로깅")

    # 4. 카드뉴스 생성
    print("  4. 카드뉴스 생성 활동 로깅...")
    cardnews_result = log_activity(
        action_type='generate_card_news',
        action_detail={'report_id': 9999, 'image_count': 3},
        academy_id=test_academy_id,
        user_id=test_user_id
    )
    print(f"     {'✅' if cardnews_result else '❌'} 카드뉴스 생성 로깅")

    all_success = login_result and report_result and share_result and cardnews_result
    return all_success, test_academy_id


def scenario_2_api_usage_logging():
    """시나리오 2: API 사용 로그 시뮬레이션"""
    print("\n" + "=" * 55)
    print("[시나리오 2] Claude API 사용 로그 시뮬레이션")
    print("=" * 55)

    from utils.claude_api_tracker import ClaudeAPITracker

    tracker = ClaudeAPITracker()

    # 성공 케이스
    print("  1. 성공 케이스 로깅...")
    tracker._log_usage(
        academy_id=100,
        endpoint='/v1/messages',
        input_tokens=2500,
        output_tokens=1200,
        total_cost=Decimal('0.0255'),
        response_time_ms=1800,
        status='success',
        error_message=None
    )
    print("     ✅ 성공 케이스 로깅 완료")

    # 실패 케이스
    print("  2. 실패 케이스 로깅...")
    tracker._log_usage(
        academy_id=100,
        endpoint='/v1/messages',
        input_tokens=500,
        output_tokens=0,
        total_cost=Decimal('0.0015'),
        response_time_ms=30000,
        status='error',
        error_message='Rate limit exceeded'
    )
    print("     ✅ 실패 케이스 로깅 완료")

    return True


def scenario_3_health_check():
    """시나리오 3: 시스템 헬스체크"""
    print("\n" + "=" * 55)
    print("[시나리오 3] 시스템 헬스체크 실행")
    print("=" * 55)

    try:
        import psutil

        # 메트릭 수집
        cpu = psutil.cpu_percent(interval=0.5)
        ram = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent

        print(f"  CPU: {cpu:.1f}%")
        print(f"  RAM: {ram:.1f}%")
        print(f"  Disk: {disk:.1f}%")

        # DB에 저장
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO system_health_logs
                (cpu_usage, ram_usage, disk_usage, active_connections)
                VALUES (%s, %s, %s, %s)
            """, (cpu, ram, disk, 0))
            conn.commit()
            cursor.close()
            conn.close()
            print("  ✅ 헬스체크 메트릭 저장 완료")
            return True
        else:
            print("  ❌ DB 연결 실패")
            return False

    except Exception as e:
        print(f"  ❌ 헬스체크 오류: {e}")
        return False


def scenario_4_alert_check():
    """시나리오 4: Alert 체크"""
    print("\n" + "=" * 55)
    print("[시나리오 4] Critical Alerts 체크")
    print("=" * 55)

    from utils.alert_checker import get_alert_summary

    summary = get_alert_summary()

    print(f"  Critical Alerts: {summary['critical_count']}개")
    print(f"  Warning Alerts: {summary['warning_count']}개")
    print(f"  Total: {summary['total_count']}개")

    if summary['alerts']:
        print("\n  감지된 Alert 목록:")
        for alert in summary['alerts']:
            emoji = "🔴" if alert['severity'] == 'critical' else "🟡"
            print(f"    {emoji} {alert['title']}")

    return True


def scenario_5_data_verification(test_academy_id):
    """시나리오 5: 데이터 검증"""
    print("\n" + "=" * 55)
    print("[시나리오 5] 데이터 검증")
    print("=" * 55)

    conn = get_db_connection()
    if not conn:
        print("  ❌ DB 연결 실패")
        return False

    cursor = conn.cursor(dictionary=True)
    all_valid = True

    # 1. 활동 로그 확인
    cursor.execute("""
        SELECT action_type, COUNT(*) as count
        FROM activity_logs
        WHERE academy_id = %s
        GROUP BY action_type
    """, (test_academy_id,))
    activity_results = cursor.fetchall()

    print("\n  [활동 로그]")
    if activity_results:
        for row in activity_results:
            print(f"    - {row['action_type']}: {row['count']}건")
    else:
        print("    ⚠️  활동 로그 없음")
        all_valid = False

    # 2. API 사용 로그 확인
    cursor.execute("""
        SELECT
            COUNT(*) as total,
            SUM(request_tokens) as total_input,
            SUM(response_tokens) as total_output,
            SUM(total_cost) as total_cost
        FROM api_usage_logs
        WHERE academy_id = %s
    """, (test_academy_id,))
    api_result = cursor.fetchone()

    print("\n  [API 사용 로그]")
    if api_result and api_result['total']:
        print(f"    - 총 요청: {api_result['total']}건")
        print(f"    - Input Tokens: {api_result['total_input'] or 0}")
        print(f"    - Output Tokens: {api_result['total_output'] or 0}")
        print(f"    - Total Cost: ${api_result['total_cost'] or 0}")
    else:
        print("    ⚠️  API 사용 로그 없음")

    # 3. 시스템 헬스 로그 확인
    cursor.execute("""
        SELECT COUNT(*) as count,
               AVG(cpu_usage) as avg_cpu,
               AVG(ram_usage) as avg_ram
        FROM system_health_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    """)
    health_result = cursor.fetchone()

    print("\n  [시스템 헬스 로그]")
    if health_result and health_result['count']:
        print(f"    - 최근 1시간 기록: {health_result['count']}건")
        print(f"    - 평균 CPU: {health_result['avg_cpu']:.1f}%")
        print(f"    - 평균 RAM: {health_result['avg_ram']:.1f}%")
    else:
        print("    ⚠️  헬스 로그 없음")

    cursor.close()
    conn.close()

    return all_valid


def cleanup_test_data(test_academy_id):
    """테스트 데이터 정리"""
    print("\n" + "=" * 55)
    print("[정리] 테스트 데이터 삭제")
    print("=" * 55)

    conn = get_db_connection()
    if not conn:
        return

    cursor = conn.cursor()

    # 활동 로그 삭제
    cursor.execute("DELETE FROM activity_logs WHERE academy_id = %s", (test_academy_id,))
    activity_deleted = cursor.rowcount

    # API 사용 로그 삭제
    cursor.execute("DELETE FROM api_usage_logs WHERE academy_id = %s", (test_academy_id,))
    api_deleted = cursor.rowcount

    conn.commit()
    cursor.close()
    conn.close()

    print(f"  🧹 활동 로그 {activity_deleted}건 삭제")
    print(f"  🧹 API 사용 로그 {api_deleted}건 삭제")


def main():
    """메인 통합 테스트 실행"""
    print("\n" + "=" * 60)
    print("  Phase 1 통합 테스트 시나리오")
    print("=" * 60)

    start_time = time.time()

    results = {}

    # 시나리오 1: 학원 활동 시뮬레이션
    scenario_1_result, test_academy_id = scenario_1_academy_activity()
    results['academy_activity'] = scenario_1_result

    # 시나리오 2: API 사용 로그
    results['api_usage_logging'] = scenario_2_api_usage_logging()

    # 시나리오 3: 헬스체크
    results['health_check'] = scenario_3_health_check()

    # 시나리오 4: Alert 체크
    results['alert_check'] = scenario_4_alert_check()

    # 시나리오 5: 데이터 검증
    results['data_verification'] = scenario_5_data_verification(test_academy_id)

    # 테스트 데이터 정리
    cleanup_test_data(test_academy_id)

    elapsed_time = time.time() - start_time

    print("\n" + "=" * 60)
    print("  통합 테스트 결과 요약")
    print("=" * 60)

    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False

    print(f"\n  실행 시간: {elapsed_time:.2f}초")
    print("\n" + "=" * 60)
    if all_passed:
        print("  🎉 Phase 1 통합 테스트 전체 통과!")
    else:
        print("  ⚠️  일부 시나리오 실패 - 확인 필요")
    print("=" * 60 + "\n")

    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
