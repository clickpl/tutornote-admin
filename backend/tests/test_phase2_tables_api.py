#!/usr/bin/env python3
"""
Phase 2 Tables API 테스트

3개 테이블 섹션 API 엔드포인트 검증
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


def test_at_risk_academies_api():
    """테스트 1: 이탈 위험 학원 API"""
    print("\n" + "=" * 50)
    print("테스트 1: 이탈 위험 학원 API (/api/admin/tables/at-risk-academies)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/tables/at-risk-academies", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()

            if 'academies' not in data or 'total_count' not in data:
                print("  ⚠️ 필수 필드 누락")
                return False

            print(f"  ✅ 이탈 위험 학원: {data['total_count']}개")

            if len(data['academies']) > 0:
                academy = data['academies'][0]
                required_fields = ['id', 'academy_name', 'inactive_days', 'risk_level']

                missing = [f for f in required_fields if f not in academy]
                if missing:
                    print(f"  ⚠️ 학원 데이터 누락 필드: {missing}")
                    return False

                print(f"  ✅ 샘플: {academy['academy_name']} ({academy['inactive_days']}일 무활동, {academy['risk_level']})")

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


def test_active_academies_api():
    """테스트 2: 활성 학원 API"""
    print("\n" + "=" * 50)
    print("테스트 2: 활성 학원 API (/api/admin/tables/active-academies)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/tables/active-academies", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()

            if 'academies' not in data or 'total_count' not in data:
                print("  ⚠️ 필수 필드 누락")
                return False

            print(f"  ✅ 활성 학원: {data['total_count']}개")

            if len(data['academies']) > 0:
                academy = data['academies'][0]
                required_fields = ['id', 'academy_name', 'monthly_reports', 'is_heavy_user', 'recommended_plan']

                missing = [f for f in required_fields if f not in academy]
                if missing:
                    print(f"  ⚠️ 학원 데이터 누락 필드: {missing}")
                    return False

                heavy_label = "헤비유저" if academy['is_heavy_user'] else "일반"
                print(f"  ✅ 샘플: {academy['academy_name']} ({academy['monthly_reports']}건/월, {heavy_label}, {academy['recommended_plan']})")

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


def test_onboarding_funnel_table_api():
    """테스트 3: 온보딩 퍼널 테이블 API"""
    print("\n" + "=" * 50)
    print("테스트 3: 온보딩 퍼널 테이블 API (/api/admin/tables/onboarding-funnel)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/tables/onboarding-funnel", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()

            required_keys = ['academies', 'total_count', 'funnel_summary', 'conversion_rates']
            missing = [k for k in required_keys if k not in data]
            if missing:
                print(f"  ⚠️ 필수 키 누락: {missing}")
                return False

            print(f"  ✅ 신규 학원: {data['total_count']}개 (30일 내)")

            # 퍼널 요약
            funnel = data['funnel_summary']
            print(f"  ✅ 퍼널: 가입 {funnel['signup']} → 학생 {funnel['student_added']} → 리포트 {funnel['report_created']} → 공유 {funnel['shared']}")

            # 전환율
            rates = data['conversion_rates']
            print(f"  ✅ 전환율: 가입→학생 {rates['signup_to_student']}%, 학생→리포트 {rates['student_to_report']}%, 리포트→공유 {rates['report_to_share']}%")
            print(f"  ✅ 전체 전환율: {rates['overall']}%")

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


def test_heavy_users_api():
    """테스트 4: 헤비유저 API"""
    print("\n" + "=" * 50)
    print("테스트 4: 헤비유저 API (/api/admin/tables/heavy-users)")
    print("=" * 50)

    try:
        response = requests.get(f"{API_BASE_URL}/api/admin/tables/heavy-users", headers=get_auth_headers(), timeout=10)

        if response.status_code == 200:
            data = response.json()

            if 'academies' not in data or 'total_count' not in data:
                print("  ⚠️ 필수 필드 누락")
                return False

            print(f"  ✅ 헤비유저: {data['total_count']}개 (월 20건+)")

            if len(data['academies']) > 0:
                academy = data['academies'][0]
                print(f"  ✅ 샘플: {academy['academy_name']} ({academy['monthly_reports']}건/월)")

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
    print("  Phase 2 Tables API 테스트")
    print("  " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 60)

    tests = [
        ('이탈 위험 학원 API', test_at_risk_academies_api),
        ('활성 학원 API', test_active_academies_api),
        ('온보딩 퍼널 테이블 API', test_onboarding_funnel_table_api),
        ('헤비유저 API', test_heavy_users_api),
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
        return 0

    print("\n" + "=" * 60)
    if failed == 0:
        print("  🎉 Phase 2 Tables API 테스트 통과!")
    else:
        print("  ⚠️ 일부 테스트 실패 - 확인 필요")
    print("=" * 60 + "\n")

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
