#!/usr/bin/env python3
"""
Pre-work 통합 테스트 스크립트

모든 Pre-work 구성요소가 정상적으로 작동하는지 확인합니다.

실행 방법:
    cd backend
    python3 test_prework.py
"""

import sys
import os

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, os.path.dirname(__file__))

def test_alert_deduplicator():
    """Alert 중복 방지 로직 테스트"""
    print("🧪 [1/3] Alert Deduplicator 테스트...")

    from utils.alert_deduplicator import alert_deduplicator, AlertDeduplicator

    # 새 인스턴스로 테스트
    dedup = AlertDeduplicator()

    # 첫 알림 발송 가능
    assert dedup.should_send_alert("test_alert") == True, "첫 알림은 발송되어야 함"

    # 중복 알림 차단
    assert dedup.should_send_alert("test_alert") == False, "중복 알림은 차단되어야 함"

    # 리셋 후 재발송 가능
    dedup.reset_alert("test_alert")
    assert dedup.should_send_alert("test_alert") == True, "리셋 후 재발송 가능해야 함"

    print("   ✅ Alert Deduplicator 테스트 통과!")
    return True


def test_alert_thresholds():
    """Alert 임계값 Config 테스트"""
    print("🧪 [2/3] Alert Thresholds Config 테스트...")

    from config.alert_thresholds import (
        get_threshold,
        get_cooldown,
        SYSTEM_THRESHOLDS,
        BUSINESS_THRESHOLDS
    )

    # CPU Critical 임계값
    cpu_critical = get_threshold('system', 'cpu', 'critical')
    assert cpu_critical == 90, f"CPU critical은 90이어야 함 (실제: {cpu_critical})"

    # Backend 재시작 임계값
    restart_critical = get_threshold('system', 'backend_restart', 'critical')
    assert restart_critical == 100, f"Backend restart critical은 100이어야 함 (실제: {restart_critical})"

    # 무활동 학원 Warning
    inactive_warning = get_threshold('business', 'inactive_days', 'warning')
    assert inactive_warning == 14, f"Inactive days warning은 14이어야 함 (실제: {inactive_warning})"

    # Cooldown 시간
    cpu_cooldown = get_cooldown('cpu_critical')
    assert cpu_cooldown == 60, f"CPU critical cooldown은 60분이어야 함 (실제: {cpu_cooldown})"

    # 기본값
    default_cooldown = get_cooldown('unknown_alert')
    assert default_cooldown == 60, f"기본 cooldown은 60분이어야 함 (실제: {default_cooldown})"

    print("   ✅ Alert Thresholds Config 테스트 통과!")
    return True


def test_deployment_notifier():
    """배포 알림 모듈 테스트 (실제 발송 없이 구조만 확인)"""
    print("🧪 [3/3] Deployment Notifier 테스트...")

    from utils.deployment_notifier import deployment_notifier, DeploymentNotifier

    # 클래스 및 메서드 존재 확인
    assert hasattr(DeploymentNotifier, 'notify_phase_complete'), "notify_phase_complete 메서드 필요"
    assert hasattr(DeploymentNotifier, 'notify_deployment_start'), "notify_deployment_start 메서드 필요"
    assert hasattr(DeploymentNotifier, 'notify_deployment_complete'), "notify_deployment_complete 메서드 필요"
    assert hasattr(DeploymentNotifier, 'notify_deployment_failed'), "notify_deployment_failed 메서드 필요"

    # 싱글톤 인스턴스 확인
    assert deployment_notifier is not None, "싱글톤 인스턴스가 존재해야 함"

    print("   ✅ Deployment Notifier 테스트 통과!")
    return True


def main():
    """메인 테스트 실행"""
    print("")
    print("=" * 60)
    print("  TutorNote Master Admin - Pre-work 통합 테스트")
    print("=" * 60)
    print("")

    results = []

    try:
        results.append(("Alert Deduplicator", test_alert_deduplicator()))
    except Exception as e:
        print(f"   ❌ Alert Deduplicator 테스트 실패: {e}")
        results.append(("Alert Deduplicator", False))

    try:
        results.append(("Alert Thresholds", test_alert_thresholds()))
    except Exception as e:
        print(f"   ❌ Alert Thresholds 테스트 실패: {e}")
        results.append(("Alert Thresholds", False))

    try:
        results.append(("Deployment Notifier", test_deployment_notifier()))
    except Exception as e:
        print(f"   ❌ Deployment Notifier 테스트 실패: {e}")
        results.append(("Deployment Notifier", False))

    print("")
    print("=" * 60)

    passed = sum(1 for _, success in results if success)
    total = len(results)

    if passed == total:
        print(f"  ✅ Pre-work 모든 테스트 통과! ({passed}/{total})")
        print("=" * 60)
        print("")
        print("  🚀 Phase 1 구현을 시작할 준비가 되었습니다!")
        print("")
        return 0
    else:
        print(f"  ❌ 일부 테스트 실패 ({passed}/{total})")
        print("=" * 60)
        for name, success in results:
            status = "✅" if success else "❌"
            print(f"    {status} {name}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
