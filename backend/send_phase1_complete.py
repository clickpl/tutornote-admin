#!/usr/bin/env python3
"""
Phase 1 완료 알림 발송 스크립트

사용법:
    TELEGRAM_BOT_TOKEN="xxx" TELEGRAM_CHAT_ID="xxx" python3 send_phase1_complete.py
"""

import os
import sys

# 프로젝트 루트를 sys.path에 추가
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from utils.deployment_notifier import deployment_notifier


def main():
    """Phase 1 완료 알림 발송"""
    print("=" * 50)
    print("TutorNote Master Admin - Phase 1 완료 알림")
    print("=" * 50)
    print()

    completed_tasks = [
        "DB 스키마 6개 테이블 생성 (activity_logs, report_views, api_usage_logs, operational_costs, system_health_logs, api_health_checks)",
        "progress_records 테이블 4개 컬럼 추가 (ai_generated, generation_time_seconds, edit_count, card_news_generated)",
        "Claude API 사용량 추적 로직 구현 (claude_api_tracker.py)",
        "활동 로그 Middleware 구현 (activity_logger.py)",
        "시스템 헬스체크 Cron Job 구현 (health_check.py, setup_cron.sh)",
        "Critical Alerts 섹션 UI 구현 (Backend API + Frontend Component)",
        "Alert Rule 로직 구현 (alert_checker.py - 7개 Alert 타입)",
        "인사이트 지표 메뉴 숨김 처리 (Phase 2 완료 시 활성화)"
    ]

    print("완료된 작업:")
    for i, task in enumerate(completed_tasks, 1):
        print(f"  {i}. {task}")
    print()

    # 텔레그램 알림 발송
    result = deployment_notifier.notify_phase_complete(
        phase="Phase 1: 긴급 수정",
        completed_tasks=completed_tasks
    )

    if result:
        print("✅ 텔레그램 알림 발송 완료!")
    else:
        print("⚠️  텔레그램 알림 발송 실패")
        print("   환경변수 확인: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID")

    print()
    print("=" * 50)
    print("Phase 1 구현 완료!")
    print("=" * 50)

    return result


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
