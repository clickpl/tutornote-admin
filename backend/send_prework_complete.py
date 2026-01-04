#!/usr/bin/env python3
"""
Pre-work 완료 텔레그램 알림 발송 스크립트

실행 방법:
    cd backend
    python3 send_prework_complete.py
"""

import sys
import os

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, os.path.dirname(__file__))

from utils.deployment_notifier import deployment_notifier


def main():
    print("📤 텔레그램으로 Pre-work 완료 알림 발송 중...")

    result = deployment_notifier.notify_phase_complete(
        "Pre-work: 구현 준비",
        [
            "Alert 중복 방지 로직 구현 (alert_deduplicator.py)",
            "Alert 임계값 Config 파일 작성 (alert_thresholds.py)",
            "텔레그램 배포 알림 기능 구현 (deployment_notifier.py)",
            "테스트 코드 작성 및 모든 테스트 통과 ✅",
            "Staging 환경 셋업 스크립트 작성 (setup_staging.sh)"
        ]
    )

    if result:
        print("✅ 텔레그램 알림 발송 성공!")
        return 0
    else:
        print("⚠️  텔레그램 알림 발송 실패 (환경변수 미설정 또는 네트워크 오류)")
        print("   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 환경변수를 확인하세요.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
