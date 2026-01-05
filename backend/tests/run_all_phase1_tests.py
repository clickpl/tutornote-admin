#!/usr/bin/env python3
"""
Phase 1 전체 테스트 실행 스크립트

모든 Phase 1 검증 테스트를 순차적으로 실행하고 결과를 요약합니다.
"""

import subprocess
import sys
import os
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS_DIR = os.path.join(PROJECT_ROOT, 'tests')


def run_test(test_name, test_file):
    """단일 테스트 실행"""
    print(f"\n{'='*60}")
    print(f"  🧪 {test_name}")
    print(f"{'='*60}\n")

    try:
        result = subprocess.run(
            [sys.executable, os.path.join(TESTS_DIR, test_file)],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )

        # 출력 표시
        if result.stdout:
            # 주요 결과만 표시
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if '✅' in line or '❌' in line or '🎉' in line or '⚠️' in line:
                    print(line)

        return result.returncode == 0

    except Exception as e:
        print(f"  ❌ 테스트 실행 오류: {e}")
        return False


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 70)
    print("  🚀 TutorNote Master Admin - Phase 1 전체 테스트")
    print("  " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 70)

    tests = [
        ("1. DB 스키마 검증", "test_phase1_db_schema.py"),
        ("2. Claude API 추적 검증", "test_phase1_claude_api.py"),
        ("3. 활동 로그 검증", "test_phase1_activity_log.py"),
        ("4. 시스템 헬스체크 검증", "test_phase1_health_check.py"),
        ("5. Critical Alerts 검증", "test_phase1_critical_alerts.py"),
        ("6. 통합 테스트 시나리오", "test_phase1_integration.py"),
    ]

    results = {}

    for test_name, test_file in tests:
        passed = run_test(test_name, test_file)
        results[test_name] = passed

    # 최종 요약
    print("\n" + "=" * 70)
    print("  📊 Phase 1 테스트 최종 결과")
    print("=" * 70 + "\n")

    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False

    passed_count = sum(1 for p in results.values() if p)
    total_count = len(results)

    print(f"\n  총 {total_count}개 테스트 중 {passed_count}개 통과")

    print("\n" + "=" * 70)
    if all_passed:
        print("  🎉 Phase 1 검증 완료! 모든 테스트 통과!")
        print("\n  ✅ DB 스키마: 6개 테이블 + 4개 컬럼 추가 확인")
        print("  ✅ Claude API 추적: 토큰/비용 계산 정확성 확인")
        print("  ✅ 활동 로그: 5개 액션 타입 로깅 확인")
        print("  ✅ 시스템 헬스체크: Cron Job 메트릭 수집 확인")
        print("  ✅ Critical Alerts: 7개 Alert 타입 동작 확인")
        print("  ✅ 통합 테스트: End-to-End 시나리오 검증 완료")
    else:
        print("  ⚠️  일부 테스트 실패 - Phase 1 검증 미완료")
        print("  실패한 테스트를 확인하고 수정이 필요합니다.")
    print("=" * 70 + "\n")

    return 0 if all_passed else 1


if __name__ == '__main__':
    sys.exit(main())
