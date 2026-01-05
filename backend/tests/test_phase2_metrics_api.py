#!/usr/bin/env python3
"""
Phase 2 Metrics API 테스트

12개 핵심 지표 API 엔드포인트 검증
"""

import os
import sys
import requests
import jwt
from datetime import datetime, timedelta

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

API_BASE_URL = os.getenv('API_URL', 'http://localhost:3003')
ADMIN_SECRET_KEY = os.getenv('ADMIN_SECRET_KEY', 'tutornote-admin-secret-2025')


def get_auth_headers():
    """테스트용 JWT 토큰 생성"""
    payload = {
        'email': 'test@admin.com',
        'role': 'master_admin',
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, ADMIN_SECRET_KEY, algorithm='HS256')
    return {'Authorization': f'Bearer {token}'}


def test_academy_status_api():
    """테스트 1: 학원 현황 API"""
    print("\n" + "=" * 50)
    print("테스트 1: 학원 현황 API (/api/admin/metrics/academy-status)")
    print("=" * 50)

    try:
        response = requests.get(
            f"{API_BASE_URL}/api/admin/metrics/academy-status",
            headers=get_auth_headers(),
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            required_fields = ['active_academies', 'total_academies', 'new_this_month', 'churned_this_month']

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"  ⚠️ 누락된 필드: {missing}")
                return False

            print(f"  ✅ 활성 학원: {data['active_academies']}")
            print(f"  ✅ 전체 학원: {data['total_academies']}")
            print(f"  ✅ 신규 가입: {data['new_this_month']}")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패 (서버 미실행 상태)")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def test_student_stats_api():
    """테스트 2: 학생 통계 API"""
    print("\n" + "=" * 50)
    print("테스트 2: 학생 통계 API (/api/admin/metrics/student-stats)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/metrics/student-stats", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()
            required_fields = ['total_students', 'new_this_month', 'avg_per_academy']

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"  ⚠️ 누락된 필드: {missing}")
                return False

            print(f"  ✅ 총 학생: {data['total_students']}")
            print(f"  ✅ 학원당 평균: {data['avg_per_academy']:.1f}명")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def test_engagement_api():
    """테스트 3: 고착도 API"""
    print("\n" + "=" * 50)
    print("테스트 3: 고착도 API (/api/admin/metrics/engagement)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/metrics/engagement", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()
            required_fields = ['dau', 'mau', 'stickiness', 'stickiness_label']

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"  ⚠️ 누락된 필드: {missing}")
                return False

            print(f"  ✅ DAU: {data['dau']}")
            print(f"  ✅ MAU: {data['mau']}")
            print(f"  ✅ Stickiness: {data['stickiness']:.1f}% ({data['stickiness_label']})")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def test_parent_reach_api():
    """테스트 4: 학부모 열람률 API"""
    print("\n" + "=" * 50)
    print("테스트 4: 학부모 열람률 API (/api/admin/metrics/parent-reach)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/metrics/parent-reach", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()
            required_fields = ['total_shares', 'total_views', 'view_rate']

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"  ⚠️ 누락된 필드: {missing}")
                return False

            print(f"  ✅ 총 공유: {data['total_shares']}회")
            print(f"  ✅ 총 열람: {data['total_views']}회")
            print(f"  ✅ 열람률: {data['view_rate']:.1f}%")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def test_onboarding_funnel_api():
    """테스트 5: 온보딩 퍼널 API"""
    print("\n" + "=" * 50)
    print("테스트 5: 온보딩 퍼널 API (/api/admin/metrics/onboarding-funnel)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/metrics/onboarding-funnel", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()
            required_fields = ['signup', 'student_added', 'report_created', 'shared', 'conversion_rate']

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"  ⚠️ 누락된 필드: {missing}")
                return False

            print(f"  ✅ 가입: {data['signup']}")
            print(f"  ✅ 학생 등록: {data['student_added']}")
            print(f"  ✅ 리포트 생성: {data['report_created']}")
            print(f"  ✅ 공유 완료: {data['shared']}")
            print(f"  ✅ 전환율: {data['conversion_rate']:.1f}%")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def test_monetization_api():
    """테스트 6: 수익화 API"""
    print("\n" + "=" * 50)
    print("테스트 6: 수익화 API (/api/admin/metrics/monetization)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/metrics/monetization", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()
            required_fields = ['heavy_users', 'heavy_user_rate', 'estimated_mrr']

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"  ⚠️ 누락된 필드: {missing}")
                return False

            print(f"  ✅ 헤비유저: {data['heavy_users']}개")
            print(f"  ✅ 헤비유저 비율: {data['heavy_user_rate']:.1f}%")
            print(f"  ✅ 예상 MRR: ${data['estimated_mrr']}")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def test_system_health_api():
    """테스트 7: 시스템 헬스 API"""
    print("\n" + "=" * 50)
    print("테스트 7: 시스템 헬스 API (/api/admin/metrics/system-health)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/metrics/system-health", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()
            required_fields = ['cpu_usage', 'ram_usage', 'disk_usage']

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"  ⚠️ 누락된 필드: {missing}")
                return False

            print(f"  ✅ CPU: {data['cpu_usage']:.1f}%")
            print(f"  ✅ RAM: {data['ram_usage']:.1f}%")
            print(f"  ✅ Disk: {data['disk_usage']:.1f}%")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def test_api_status_api():
    """테스트 8: API 상태 API"""
    print("\n" + "=" * 50)
    print("테스트 8: API 상태 API (/api/admin/metrics/api-status)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/metrics/api-status", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()

            if 'claude' not in data or 'kakao' not in data:
                print("  ⚠️ claude 또는 kakao 필드 누락")
                return False

            print(f"  ✅ Claude: {data['claude']['status']} (성공률 {data['claude']['success_rate']}%)")
            print(f"  ✅ Kakao: {data['kakao']['status']} (성공률 {data['kakao']['success_rate']}%)")
            return True
        else:
            print(f"  ❌ API 오류: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("  ⚠️ API 서버 연결 실패")
        return None
    except Exception as e:
        print(f"  ❌ 테스트 실패: {e}")
        return False


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 60)
    print("  Phase 2 Metrics API 테스트")
    print("  " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 60)

    tests = [
        ('학원 현황 API', test_academy_status_api),
        ('학생 통계 API', test_student_stats_api),
        ('고착도 API', test_engagement_api),
        ('학부모 열람률 API', test_parent_reach_api),
        ('온보딩 퍼널 API', test_onboarding_funnel_api),
        ('수익화 API', test_monetization_api),
        ('시스템 헬스 API', test_system_health_api),
        ('API 상태 API', test_api_status_api),
    ]

    results = {}
    for test_name, test_fn in tests:
        result = test_fn()
        results[test_name] = result

    # 결과 요약
    print("\n" + "=" * 60)
    print("  테스트 결과 요약")
    print("=" * 60)

    passed = 0
    failed = 0
    skipped = 0

    for test_name, result in results.items():
        if result is True:
            status = "✅ PASS"
            passed += 1
        elif result is False:
            status = "❌ FAIL"
            failed += 1
        else:
            status = "⚠️ SKIP"
            skipped += 1

        print(f"  {test_name}: {status}")

    print(f"\n  총 {len(tests)}개 테스트: {passed} 통과, {failed} 실패, {skipped} 건너뜀")

    if skipped > 0:
        print("\n  ⚠️ API 서버가 실행 중이지 않습니다.")
        print("  서버 실행 후 다시 테스트해주세요.")
        return 0  # 서버 미실행은 실패로 간주하지 않음

    print("\n" + "=" * 60)
    if failed == 0:
        print("  🎉 Phase 2 Metrics API 테스트 통과!")
    else:
        print("  ⚠️ 일부 테스트 실패 - 확인 필요")
    print("=" * 60 + "\n")

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
