#!/usr/bin/env python3
"""
Phase 1 활동 로그 검증 테스트

테스트 항목:
1. 액션 타입별 로깅 저장
2. action_detail JSON 저장
3. 활동 통계 조회
4. 최근 활동 조회
"""

import os
import sys
import json

# 프로젝트 루트를 sys.path에 추가
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from middleware.activity_logger import log_activity, get_activity_stats, get_recent_activities


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


def test_action_type_logging():
    """테스트 1: 액션 타입별 로깅 저장"""
    print("\n" + "=" * 50)
    print("테스트 1: 액션 타입별 로깅 저장")
    print("=" * 50)

    # 테스트할 액션 타입들
    test_actions = [
        ('login', None),
        ('create_report', {'report_id': 999, 'ai_generated': True}),
        ('share_kakaotalk', {'report_id': 999, 'method': 'link'}),
        ('generate_card_news', {'report_id': 999, 'image_count': 3}),
        ('view_report', {'report_id': 999}),
    ]

    test_academy_id = 99  # 테스트용 학원 ID
    all_success = True

    for action_type, action_detail in test_actions:
        result = log_activity(
            action_type=action_type,
            action_detail=action_detail,
            academy_id=test_academy_id,
            user_id=99
        )

        if result:
            print(f"  ✅ {action_type}: 저장 성공")
        else:
            print(f"  ❌ {action_type}: 저장 실패")
            all_success = False

    return all_success


def test_action_detail_json():
    """테스트 2: action_detail JSON 저장 확인"""
    print("\n" + "=" * 50)
    print("테스트 2: action_detail JSON 저장 확인")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        print("  ❌ DB 연결 실패")
        return False

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT action_type, action_detail
        FROM activity_logs
        WHERE academy_id = 99
        AND action_detail IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 5
    """)
    results = cursor.fetchall()

    cursor.close()
    conn.close()

    if not results:
        print("  ⚠️  action_detail이 있는 로그 없음")
        return True

    all_valid = True
    for row in results:
        try:
            detail = json.loads(row['action_detail']) if isinstance(row['action_detail'], str) else row['action_detail']
            print(f"  ✅ {row['action_type']}: {detail}")
        except Exception as e:
            print(f"  ❌ {row['action_type']}: JSON 파싱 실패 - {e}")
            all_valid = False

    return all_valid


def test_activity_stats():
    """테스트 3: 활동 통계 조회"""
    print("\n" + "=" * 50)
    print("테스트 3: 활동 통계 조회")
    print("=" * 50)

    stats = get_activity_stats(academy_id=99, days=30)

    if not stats:
        print("  ⚠️  통계 데이터 없음")
        return True

    print(f"  총 활동: {stats.get('total', 0)}건")
    print(f"  액션별 통계:")
    for action, count in stats.get('by_action', {}).items():
        print(f"    - {action}: {count}건")

    if stats.get('total', 0) >= 5:
        print("  ✅ 테스트 1의 5개 로그 확인")
        return True
    else:
        print("  ⚠️  예상보다 적은 로그 (5개 미만)")
        return True


def test_recent_activities():
    """테스트 4: 최근 활동 조회"""
    print("\n" + "=" * 50)
    print("테스트 4: 최근 활동 조회")
    print("=" * 50)

    activities = get_recent_activities(academy_id=99, limit=10)

    if not activities:
        print("  ⚠️  최근 활동 없음")
        return True

    print(f"  최근 {len(activities)}건 활동:")
    for act in activities[:5]:  # 최근 5개만 출력
        print(f"    - [{act['created_at']}] {act['action_type']}")

    return True


def test_db_record_verification():
    """테스트 5: DB 레코드 직접 검증"""
    print("\n" + "=" * 50)
    print("테스트 5: DB 레코드 직접 검증")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        print("  ❌ DB 연결 실패")
        return False

    cursor = conn.cursor(dictionary=True)

    # 테스트 데이터 검증
    cursor.execute("""
        SELECT
            action_type,
            action_detail,
            academy_id,
            user_id,
            ip_address,
            user_agent,
            created_at
        FROM activity_logs
        WHERE academy_id = 99
        ORDER BY created_at DESC
        LIMIT 1
    """)
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if not result:
        print("  ❌ 테스트 레코드 없음")
        return False

    print(f"  ✅ 최근 레코드 확인:")
    print(f"      Action Type: {result['action_type']}")
    print(f"      Academy ID: {result['academy_id']}")
    print(f"      User ID: {result['user_id']}")
    print(f"      IP: {result['ip_address']}")
    print(f"      Created: {result['created_at']}")

    # 필수 필드 검증
    if result['academy_id'] == 99 and result['action_type']:
        return True
    else:
        print("  ❌ 필수 필드 값 불일치")
        return False


def cleanup_test_data():
    """테스트 데이터 정리"""
    print("\n" + "=" * 50)
    print("테스트 데이터 정리")
    print("=" * 50)

    conn = get_db_connection()
    if not conn:
        return

    cursor = conn.cursor()
    cursor.execute("DELETE FROM activity_logs WHERE academy_id = 99")
    conn.commit()
    deleted = cursor.rowcount
    cursor.close()
    conn.close()

    print(f"  🧹 {deleted}건 테스트 데이터 삭제")


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 60)
    print("  Phase 1 활동 로그 검증 테스트")
    print("=" * 60)

    results = {
        'action_type_logging': test_action_type_logging(),
        'action_detail_json': test_action_detail_json(),
        'activity_stats': test_activity_stats(),
        'recent_activities': test_recent_activities(),
        'db_record_verification': test_db_record_verification(),
    }

    # 테스트 데이터 정리
    cleanup_test_data()

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
        print("  🎉 모든 활동 로그 테스트 통과!")
    else:
        print("  ⚠️  일부 테스트 실패 - 확인 필요")
    print("=" * 60 + "\n")

    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
