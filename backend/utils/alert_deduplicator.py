"""
Alert 중복 발송 방지 모듈

5분마다 헬스체크가 실행되면서 같은 Critical Alert가
반복 발송되는 것을 방지합니다.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional


class AlertDeduplicator:
    """
    Alert 중복 발송 방지 클래스
    같은 알림을 설정된 시간(기본 60분) 내에는 재발송하지 않음
    """

    def __init__(self):
        self._sent_alerts: Dict[str, datetime] = {}

    def should_send_alert(self, alert_key: str, cooldown_minutes: int = 60) -> bool:
        """
        알림 발송 여부 결정

        Args:
            alert_key: 알림 고유 키 (예: "cpu_critical_92.4", "backend_restart_102")
            cooldown_minutes: 재발송 방지 시간 (분)

        Returns:
            bool: True면 발송, False면 Skip

        Examples:
            >>> dedup = AlertDeduplicator()
            >>> dedup.should_send_alert("cpu_critical")
            True
            >>> dedup.should_send_alert("cpu_critical")  # 60분 내 재호출
            False
        """
        now = datetime.now()

        if alert_key in self._sent_alerts:
            last_sent = self._sent_alerts[alert_key]
            elapsed = (now - last_sent).total_seconds() / 60

            if elapsed < cooldown_minutes:
                print(f"Alert '{alert_key}' skipped (sent {elapsed:.1f}m ago)")
                return False

        # 발송 허용 - 시간 기록
        self._sent_alerts[alert_key] = now
        return True

    def reset_alert(self, alert_key: str) -> None:
        """
        특정 알림 즉시 재발송 가능하도록 리셋

        Args:
            alert_key: 리셋할 알림의 고유 키
        """
        if alert_key in self._sent_alerts:
            del self._sent_alerts[alert_key]

    def clear_old_alerts(self, hours: int = 24) -> int:
        """
        24시간 이상 오래된 알림 기록 삭제 (메모리 관리)

        Args:
            hours: 이 시간보다 오래된 알림 기록 삭제

        Returns:
            int: 삭제된 알림 기록 수
        """
        now = datetime.now()
        keys_to_delete = []

        for key, sent_time in self._sent_alerts.items():
            if (now - sent_time).total_seconds() > hours * 3600:
                keys_to_delete.append(key)

        for key in keys_to_delete:
            del self._sent_alerts[key]

        return len(keys_to_delete)

    def get_active_alerts(self) -> Dict[str, datetime]:
        """현재 활성 상태인 알림 기록 반환 (디버깅용)"""
        return self._sent_alerts.copy()


# 싱글톤 인스턴스
alert_deduplicator = AlertDeduplicator()
