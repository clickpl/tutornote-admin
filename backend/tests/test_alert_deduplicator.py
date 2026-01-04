"""
Alert Deduplicator 테스트

실행 방법:
    cd backend
    pytest tests/test_alert_deduplicator.py -v
"""

import pytest
import sys
import os
from datetime import datetime, timedelta

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.alert_deduplicator import AlertDeduplicator, alert_deduplicator


class TestAlertDeduplicator:
    """AlertDeduplicator 클래스 테스트"""

    def setup_method(self):
        """각 테스트 전에 새 인스턴스 생성"""
        self.dedup = AlertDeduplicator()

    def test_first_alert_should_send(self):
        """첫 번째 알림은 항상 발송되어야 함"""
        result = self.dedup.should_send_alert("test_alert")
        assert result is True

    def test_duplicate_alert_should_not_send(self):
        """동일한 알림은 cooldown 시간 내에 재발송되지 않아야 함"""
        # 첫 번째 알림
        first = self.dedup.should_send_alert("test_alert")
        assert first is True

        # 즉시 같은 알림 (60분 이내)
        second = self.dedup.should_send_alert("test_alert")
        assert second is False

    def test_different_alerts_should_send(self):
        """다른 종류의 알림은 독립적으로 발송되어야 함"""
        result1 = self.dedup.should_send_alert("cpu_critical")
        result2 = self.dedup.should_send_alert("ram_critical")

        assert result1 is True
        assert result2 is True

    def test_custom_cooldown(self):
        """커스텀 cooldown 시간이 적용되어야 함"""
        # 30분 cooldown 설정
        result1 = self.dedup.should_send_alert("custom_alert", cooldown_minutes=30)
        assert result1 is True

        # 즉시 재발송 시도 (실패해야 함)
        result2 = self.dedup.should_send_alert("custom_alert", cooldown_minutes=30)
        assert result2 is False

    def test_reset_alert(self):
        """reset_alert 후에는 즉시 재발송 가능해야 함"""
        # 첫 번째 알림
        self.dedup.should_send_alert("reset_test")

        # 리셋
        self.dedup.reset_alert("reset_test")

        # 리셋 후 재발송 가능
        result = self.dedup.should_send_alert("reset_test")
        assert result is True

    def test_reset_nonexistent_alert(self):
        """존재하지 않는 알림 리셋 시 에러가 발생하지 않아야 함"""
        # 에러 없이 실행되어야 함
        self.dedup.reset_alert("nonexistent_alert")

    def test_clear_old_alerts(self):
        """오래된 알림 기록이 삭제되어야 함"""
        # 알림 기록 생성
        self.dedup.should_send_alert("old_alert")

        # 수동으로 시간 조작 (25시간 전으로)
        self.dedup._sent_alerts["old_alert"] = datetime.now() - timedelta(hours=25)

        # 24시간 이상 된 알림 삭제
        deleted_count = self.dedup.clear_old_alerts(hours=24)

        assert deleted_count == 1
        assert "old_alert" not in self.dedup._sent_alerts

    def test_clear_keeps_recent_alerts(self):
        """최근 알림은 삭제되지 않아야 함"""
        # 최근 알림 기록
        self.dedup.should_send_alert("recent_alert")

        # 24시간 이상 된 알림만 삭제
        deleted_count = self.dedup.clear_old_alerts(hours=24)

        assert deleted_count == 0
        assert "recent_alert" in self.dedup._sent_alerts

    def test_get_active_alerts(self):
        """활성 알림 목록을 반환해야 함"""
        self.dedup.should_send_alert("alert1")
        self.dedup.should_send_alert("alert2")

        active = self.dedup.get_active_alerts()

        assert "alert1" in active
        assert "alert2" in active
        assert len(active) == 2


class TestSingleton:
    """싱글톤 인스턴스 테스트"""

    def test_singleton_exists(self):
        """싱글톤 인스턴스가 존재해야 함"""
        assert alert_deduplicator is not None

    def test_singleton_is_alertdeduplicator(self):
        """싱글톤 인스턴스는 AlertDeduplicator 타입이어야 함"""
        assert isinstance(alert_deduplicator, AlertDeduplicator)


class TestIntegration:
    """통합 테스트"""

    def test_full_workflow(self):
        """전체 워크플로우 테스트"""
        dedup = AlertDeduplicator()

        # 1. 첫 알림 발송
        assert dedup.should_send_alert("cpu_90") is True

        # 2. 중복 알림 차단
        assert dedup.should_send_alert("cpu_90") is False

        # 3. 다른 알림은 허용
        assert dedup.should_send_alert("ram_85") is True

        # 4. 리셋 후 재발송 허용
        dedup.reset_alert("cpu_90")
        assert dedup.should_send_alert("cpu_90") is True

        # 5. 오래된 알림 정리
        dedup._sent_alerts["old"] = datetime.now() - timedelta(hours=25)
        deleted = dedup.clear_old_alerts()
        assert deleted == 1


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
