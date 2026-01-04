"""
배포 및 Phase 완료 알림 모듈

Phase별 구현 완료 및 배포 완료 시 텔레그램으로 자동 알림합니다.

사용 예시:
    >>> from utils.deployment_notifier import deployment_notifier
    >>> deployment_notifier.notify_phase_complete(
    ...     "Phase 1: 긴급 수정",
    ...     ["DB 스키마 생성", "Claude API 추적"]
    ... )
"""

import os
from datetime import datetime
from typing import List, Dict

from utils.telegram_notifier import telegram_notifier


class DeploymentNotifier:
    """배포 및 Phase 완료 알림"""

    @staticmethod
    def notify_phase_complete(phase: str, completed_tasks: List[str]) -> bool:
        """
        Phase 완료 시 텔레그램 알림

        Args:
            phase: Phase 이름 (예: "Phase 1: 긴급 수정")
            completed_tasks: 완료된 작업 목록 (예: ["DB 스키마 생성", "Claude API 추적"])

        Returns:
            bool: 발송 성공 여부
        """
        message = f"""
✅ *{phase} 구현 완료!*

*완료된 작업*:
"""
        for i, task in enumerate(completed_tasks, 1):
            message += f"  {i}. ✓ {task}\n"

        message += f"\n⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        message += f"\n\n🚀 다음 단계로 진행 가능합니다."

        return telegram_notifier.send_message(message)

    @staticmethod
    def notify_deployment_start(environment: str, version: str) -> bool:
        """
        배포 시작 알림

        Args:
            environment: 환경 이름 (예: "Staging", "Production")
            version: 버전 (예: "v1.1.0")

        Returns:
            bool: 발송 성공 여부
        """
        message = f"""
🔵 *Master Admin 배포 시작*

*환경*: {environment}
*버전*: {version}
*시작 시간*: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

배포 진행 중입니다...
"""
        return telegram_notifier.send_message(message)

    @staticmethod
    def notify_deployment_complete(
        environment: str,
        version: str,
        changes: List[str],
        dashboard_url: str = "https://tma.tutornote.kr"
    ) -> bool:
        """
        배포 완료 시 텔레그램 알림

        Args:
            environment: 환경 이름 (예: "Staging", "Production")
            version: 버전 (예: "v1.1.0")
            changes: 주요 변경사항 목록
            dashboard_url: 대시보드 URL

        Returns:
            bool: 발송 성공 여부
        """
        emoji = "🟢" if environment == "Production" else "🟡"

        message = f"""
{emoji} *Master Admin 배포 완료*

*환경*: {environment}
*버전*: {version}
*배포 시간*: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

*주요 변경사항*:
"""
        for i, change in enumerate(changes, 1):
            message += f"  {i}. {change}\n"

        message += f"\n🔗 [대시보드 바로가기]({dashboard_url})"
        message += f"\n\n✅ 배포가 정상적으로 완료되었습니다."

        return telegram_notifier.send_message(message)

    @staticmethod
    def notify_deployment_failed(environment: str, version: str, error: str) -> bool:
        """
        배포 실패 알림

        Args:
            environment: 환경 이름
            version: 버전
            error: 에러 내용

        Returns:
            bool: 발송 성공 여부
        """
        message = f"""
🔴 *Master Admin 배포 실패*

*환경*: {environment}
*버전*: {version}
*실패 시간*: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

*에러 내용*:
```
{error}
```

⚠️ 즉시 확인이 필요합니다.
"""
        return telegram_notifier.send_message(message)

    @staticmethod
    def notify_prework_complete() -> bool:
        """
        Pre-work 완료 알림 (편의 메서드)

        Returns:
            bool: 발송 성공 여부
        """
        return DeploymentNotifier.notify_phase_complete(
            "Pre-work: 구현 준비",
            [
                "Alert 중복 방지 로직 구현",
                "Alert 임계값 Config 파일 작성",
                "텔레그램 배포 알림 기능 구현",
                "테스트 코드 작성 및 통과",
                "Staging 환경 셋업 스크립트 작성"
            ]
        )


# 싱글톤 인스턴스
deployment_notifier = DeploymentNotifier()
