#!/usr/bin/env python3
"""
Phase 1 Claude API 추적 검증 테스트

테스트 항목:
1. ClaudeAPITracker 클래스 초기화
2. 비용 계산 정확성
3. API 사용 로그 저장
4. 에러 발생 시에도 로그 저장
"""

import os
import sys
from decimal import Decimal

# 프로젝트 루트를 sys.path에 추가
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from utils.claude_api_tracker import ClaudeAPITracker, _tracker


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


def test_cost_calculation():
    """테스트 1: 비용 계산 정확성"""
    print("\n" + "=" * 50)
    print("테스트 1: 비용 계산 정확성")
    print("=" * 50)

    tracker = ClaudeAPITracker()

    # Claude Sonnet 4 가격: Input $3/1M, Output $15/1M
    test_cases = [
        # (input_tokens, output_tokens, expected_cost)
        (1000, 500, Decimal('0.0105')),  # (1000 * 3 / 1M) + (500 * 15 / 1M)
        (10000, 5000, Decimal('0.105')),
        (100, 100, Decimal('0.0018')),
        (0, 0, Decimal('0')),
    ]

    all_passed = True
    for input_tokens, output_tokens, expected in test_cases:
        calculated = tracker._calculate_cost(
            'claude-sonnet-4-20250514',
            input_tokens,
            output_tokens
        )

        # 소수점 6자리까지 비교
        diff = abs(calculated - expected)
        passed = diff < Decimal('0.000001')

        status = "✅" if passed else "❌"
        print(f"  {status} Input: {input_tokens}, Output: {output_tokens}")
        print(f"      예상: ${expected}, 계산: ${calculated}, 차이: ${diff}")

        if not passed:
            all_passed = False

    return all_passed


def test_log_usage():
    """테스트 2: API 사용 로그 저장"""
    print("\n" + "=" * 50)
    print("테스트 2: API 사용 로그 저장")
    print("=" * 50)

    tracker = ClaudeAPITracker()

    # 로그 저장 테스트
    tracker._log_usage(
        academy_id=1,
        endpoint='/v1/messages',
        input_tokens=1500,
        output_tokens=800,
        total_cost=Decimal('0.0165'),
        response_time_ms=1200,
        status='success',
        error_message=None
    )

    # DB에서 확인
    conn = get_db_connection()
    if not conn:
        print("  ❌ DB 연결 실패")
        return False

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM api_usage_logs
        WHERE api_name = 'claude'
        AND academy_id = 1
        ORDER BY created_at DESC
        LIMIT 1
    """)
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if result:
        print(f"  ✅ 로그 저장 성공")
        print(f"      Input Tokens: {result['request_tokens']}")
        print(f"      Output Tokens: {result['response_tokens']}")
        print(f"      Total Cost: ${result['total_cost']}")
        print(f"      Response Time: {result['response_time_ms']}ms")
        print(f"      Status: {result['status']}")

        # 값 검증
        if result['request_tokens'] == 1500 and result['response_tokens'] == 800:
            print(f"  ✅ 토큰 값 정확")
            return True
        else:
            print(f"  ❌ 토큰 값 불일치")
            return False
    else:
        print(f"  ❌ 로그 조회 실패")
        return False


def test_error_logging():
    """테스트 3: 에러 발생 시 로그 저장"""
    print("\n" + "=" * 50)
    print("테스트 3: 에러 발생 시 로그 저장")
    print("=" * 50)

    tracker = ClaudeAPITracker()

    # 에러 로그 저장
    tracker._log_usage(
        academy_id=2,
        endpoint='/v1/messages',
        input_tokens=500,
        output_tokens=0,
        total_cost=Decimal('0.0015'),
        response_time_ms=5000,
        status='error',
        error_message='API timeout after 5000ms'
    )

    # DB에서 확인
    conn = get_db_connection()
    if not conn:
        print("  ❌ DB 연결 실패")
        return False

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM api_usage_logs
        WHERE api_name = 'claude'
        AND status = 'error'
        ORDER BY created_at DESC
        LIMIT 1
    """)
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if result and result['error_message']:
        print(f"  ✅ 에러 로그 저장 성공")
        print(f"      Status: {result['status']}")
        print(f"      Error: {result['error_message']}")
        return True
    else:
        print(f"  ❌ 에러 로그 저장 실패")
        return False


def test_cost_calculation_accuracy():
    """테스트 4: 비용 계산 정확성 (1% 이내)"""
    print("\n" + "=" * 50)
    print("테스트 4: 비용 계산 정확성 검증")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        print("  ❌ DB 연결 실패")
        return False

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            request_tokens,
            response_tokens,
            total_cost
        FROM api_usage_logs
        WHERE api_name = 'claude'
        ORDER BY created_at DESC
        LIMIT 5
    """)

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    if not results:
        print("  ⚠️  검증할 데이터 없음")
        return True

    all_accurate = True
    for row in results:
        input_tokens = row['request_tokens'] or 0
        output_tokens = row['response_tokens'] or 0
        logged_cost = Decimal(str(row['total_cost']))

        # 예상 비용 계산
        expected_input_cost = Decimal(input_tokens) * Decimal('3') / Decimal('1000000')
        expected_output_cost = Decimal(output_tokens) * Decimal('15') / Decimal('1000000')
        expected_total = expected_input_cost + expected_output_cost

        if expected_total > 0:
            diff_percent = abs((logged_cost - expected_total) / expected_total * 100)
        else:
            diff_percent = 0

        status = "✅" if diff_percent < 1 else "❌"
        print(f"  {status} Input: {input_tokens}, Output: {output_tokens}")
        print(f"      예상: ${expected_total:.6f}, 기록: ${logged_cost:.6f}, 오차: {diff_percent:.2f}%")

        if diff_percent >= 1:
            all_accurate = False

    return all_accurate


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 60)
    print("  Phase 1 Claude API 추적 검증 테스트")
    print("=" * 60)

    results = {
        'cost_calculation': test_cost_calculation(),
        'log_usage': test_log_usage(),
        'error_logging': test_error_logging(),
        'cost_accuracy': test_cost_calculation_accuracy(),
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
        print("  🎉 모든 Claude API 추적 테스트 통과!")
    else:
        print("  ⚠️  일부 테스트 실패 - 확인 필요")
    print("=" * 60 + "\n")

    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
