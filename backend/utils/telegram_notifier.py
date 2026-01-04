"""
텔레그램 알림 발송 모듈

환경변수:
    TELEGRAM_BOT_TOKEN: 텔레그램 봇 토큰
    TELEGRAM_CHAT_ID: 알림을 받을 채팅방 ID
"""

import os
import requests
from datetime import datetime
from typing import Dict, Optional


class TelegramNotifier:
    """텔레그램 봇을 통한 알림 발송 클래스"""

    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None

    def _is_configured(self) -> bool:
        """텔레그램 설정 확인"""
        return bool(self.bot_token and self.chat_id)

    def send_message(self, message: str, parse_mode: str = 'Markdown') -> bool:
        """
        텔레그램 메시지 발송

        Args:
            message: 발송할 메시지 (Markdown 지원)
            parse_mode: 메시지 파싱 모드 ('Markdown' 또는 'HTML')

        Returns:
            bool: 발송 성공 여부
        """
        if not self._is_configured():
            print(f"[TelegramNotifier] Not configured. Message: {message[:100]}...")
            return False

        try:
            response = requests.post(
                f"{self.api_url}/sendMessage",
                json={
                    'chat_id': self.chat_id,
                    'text': message,
                    'parse_mode': parse_mode
                },
                timeout=10
            )

            if response.status_code == 200:
                print(f"[TelegramNotifier] Message sent successfully")
                return True
            else:
                print(f"[TelegramNotifier] Failed: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"[TelegramNotifier] Error: {e}")
            return False

    def send_critical_alert(self, alert: Dict) -> bool:
        """
        Critical Alert를 텔레그램으로 전송

        Args:
            alert: {
                'severity': 'critical' | 'warning',
                'title': str,
                'description': str,
                'action': str (optional)
            }

        Returns:
            bool: 발송 성공 여부
        """
        try:
            # 이모지 선택
            emoji = "🚨" if alert.get('severity') == 'critical' else "⚠️"

            # 메시지 포맷팅
            message = f"""
{emoji} *TutorNote Master Admin Alert*

*{alert.get('title', 'Unknown Alert')}*

{alert.get('description', '')}
"""

            if alert.get('action'):
                message += f"\n📌 *권장 조치*: {alert['action']}"

            message += f"\n\n⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

            return self.send_message(message)

        except Exception as e:
            print(f"[TelegramNotifier] Critical alert failed: {e}")
            return False

    def send_daily_summary(self, summary: Dict) -> bool:
        """
        일일 요약 리포트를 텔레그램으로 전송

        Args:
            summary: {
                'date': str,
                'active_academies': int,
                'new_reports': int,
                'issues': List[str]
            }

        Returns:
            bool: 발송 성공 여부
        """
        try:
            message = f"""
📊 *일일 요약 리포트* ({summary.get('date', 'Unknown')})

✅ 활성 학원: {summary.get('active_academies', 0)}개
📝 신규 리포트: {summary.get('new_reports', 0)}건

"""
            issues = summary.get('issues', [])
            if issues:
                message += "⚠️ *주의 사항*:\n"
                for issue in issues:
                    message += f"  • {issue}\n"
            else:
                message += "✨ 모든 시스템 정상 작동 중"

            return self.send_message(message)

        except Exception as e:
            print(f"[TelegramNotifier] Daily summary failed: {e}")
            return False


# 싱글톤 인스턴스 생성
telegram_notifier = TelegramNotifier()
