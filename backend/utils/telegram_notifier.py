"""
텔레그램 알림 발송 모듈

환경변수:
    TELEGRAM_BOT_TOKEN: 텔레그램 봇 토큰
    TELEGRAM_CHAT_ID: 알림을 받을 채팅방 ID
"""

import os
import json
import requests
from datetime import datetime
from typing import Dict, Optional, Any

# .env 파일 로드 시도
try:
    from dotenv import load_dotenv
    # 현재 파일 기준으로 .env 파일 찾기
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    env_path = os.path.join(project_root, '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass  # dotenv 없으면 환경변수에서 직접 읽음


def get_db_connection():
    """데이터베이스 연결"""
    try:
        import mysql.connector
        return mysql.connector.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            port=int(os.getenv('DB_PORT', '3306')),
            user=os.getenv('DB_USER', 'clickpl_user'),
            password=os.getenv('DB_PASSWORD', '***REMOVED***'),
            database=os.getenv('DB_NAME', 'tutornote_db')
        )
    except Exception as e:
        print(f"[TelegramNotifier] DB connection failed: {e}")
        return None


class TelegramNotifier:
    """텔레그램 봇을 통한 알림 발송 클래스"""

    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None

    def _is_configured(self) -> bool:
        """텔레그램 설정 확인"""
        return bool(self.bot_token and self.chat_id)

    def _log_notification(
        self,
        notification_type: str,
        message: str,
        title: str = None,
        severity: str = None,
        status: str = 'sent',
        telegram_message_id: str = None,
        error_message: str = None,
        metadata: Dict[str, Any] = None,
        academy_id: int = None,
        academy_name: str = None,
        error_code: str = None,
        error_type: str = None
    ) -> bool:
        """
        알림 발송 이력을 DB에 저장

        Args:
            notification_type: 'server_check' | 'daily_report' | 'service_report' | 'error'
            message: 알림 내용
            title: 알림 제목
            severity: 'low' | 'medium' | 'high' | 'critical'
            status: 'sent' | 'failed'
            telegram_message_id: 텔레그램 메시지 ID
            error_message: 발송 실패 시 에러 메시지
            metadata: 추가 정보 (CPU, 메모리 등)
            academy_id: 관련 학원 ID
            academy_name: 학원명
            error_code: 에러 코드
            error_type: 에러 유형

        Returns:
            bool: 저장 성공 여부
        """
        conn = get_db_connection()
        if not conn:
            return False

        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO telegram_notification_log
                (notification_type, severity, title, message, academy_id, academy_name,
                 error_code, error_type, metadata, status, telegram_message_id, error_message, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                notification_type,
                severity,
                title,
                message,
                academy_id,
                academy_name,
                error_code,
                error_type,
                json.dumps(metadata) if metadata else None,
                status,
                telegram_message_id,
                error_message
            ))

            conn.commit()
            cursor.close()
            conn.close()
            print(f"[TelegramNotifier] Notification logged: {notification_type}")
            return True

        except Exception as e:
            print(f"[TelegramNotifier] Failed to log notification: {e}")
            return False

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

    def send_critical_alert(self, alert: Dict, notification_type: str = 'server_check') -> bool:
        """
        Critical Alert를 텔레그램으로 전송

        Args:
            alert: {
                'severity': 'critical' | 'warning',
                'title': str,
                'description': str,
                'action': str (optional),
                'metadata': dict (optional) - CPU, RAM, Disk 값 등
            }
            notification_type: 알림 유형 ('server_check', 'error', 'daily_report', 'service_report')

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

            success = self.send_message(message)

            # DB에 로깅 (알림 카운터 업데이트용)
            severity = alert.get('severity', 'medium')
            if severity == 'warning':
                severity = 'high'  # warning을 high로 매핑

            self._log_notification(
                notification_type=notification_type,
                message=message,
                title=alert.get('title'),
                severity=severity,
                status='sent' if success else 'failed',
                metadata=alert.get('metadata'),
                error_message=None if success else 'Failed to send telegram message'
            )

            return success

        except Exception as e:
            print(f"[TelegramNotifier] Critical alert failed: {e}")
            return False

    def send_daily_summary(self, summary: Dict, notification_type: str = 'daily_report') -> bool:
        """
        일일 요약 리포트를 텔레그램으로 전송

        Args:
            summary: {
                'date': str,
                'active_academies': int,
                'new_reports': int,
                'issues': List[str]
            }
            notification_type: 알림 유형 ('daily_report' 또는 'service_report')

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

            success = self.send_message(message)

            # DB에 로깅
            self._log_notification(
                notification_type=notification_type,
                message=message,
                title=f"일일 요약 리포트 ({summary.get('date', 'Unknown')})",
                severity='low',
                status='sent' if success else 'failed',
                metadata={
                    'active_academies': summary.get('active_academies', 0),
                    'new_reports': summary.get('new_reports', 0),
                    'issues_count': len(issues)
                },
                error_message=None if success else 'Failed to send telegram message'
            )

            return success

        except Exception as e:
            print(f"[TelegramNotifier] Daily summary failed: {e}")
            return False


    def send_and_log(
        self,
        message: str,
        notification_type: str,
        title: str = None,
        severity: str = 'low',
        metadata: Dict[str, Any] = None,
        academy_id: int = None,
        academy_name: str = None,
        error_code: str = None,
        error_type: str = None,
        parse_mode: str = 'Markdown'
    ) -> bool:
        """
        텔레그램 메시지 발송 및 DB 로깅

        Args:
            message: 발송할 메시지
            notification_type: 알림 유형 ('server_check', 'daily_report', 'service_report', 'error')
            title: 알림 제목
            severity: 심각도 ('low', 'medium', 'high', 'critical')
            metadata: 추가 정보
            academy_id: 관련 학원 ID
            academy_name: 학원명
            error_code: 에러 코드
            error_type: 에러 유형
            parse_mode: 메시지 파싱 모드

        Returns:
            bool: 발송 성공 여부
        """
        success = self.send_message(message, parse_mode)

        # DB에 로깅
        self._log_notification(
            notification_type=notification_type,
            message=message,
            title=title,
            severity=severity,
            status='sent' if success else 'failed',
            metadata=metadata,
            academy_id=academy_id,
            academy_name=academy_name,
            error_code=error_code,
            error_type=error_type,
            error_message=None if success else 'Failed to send telegram message'
        )

        return success


# 싱글톤 인스턴스 생성
telegram_notifier = TelegramNotifier()


def send_telegram_message(message: str, parse_mode: str = 'Markdown') -> bool:
    """
    텔레그램 메시지 발송 헬퍼 함수

    Args:
        message: 발송할 메시지
        parse_mode: 파싱 모드 ('Markdown' 또는 'HTML')

    Returns:
        bool: 발송 성공 여부
    """
    return telegram_notifier.send_message(message, parse_mode)


def send_telegram_notification(
    message: str,
    notification_type: str,
    title: str = None,
    severity: str = 'low',
    metadata: Dict[str, Any] = None,
    parse_mode: str = 'Markdown'
) -> bool:
    """
    텔레그램 메시지 발송 및 DB 로깅 헬퍼 함수

    Args:
        message: 발송할 메시지
        notification_type: 알림 유형 ('server_check', 'daily_report', 'service_report', 'error')
        title: 알림 제목
        severity: 심각도
        metadata: 추가 정보
        parse_mode: 파싱 모드

    Returns:
        bool: 발송 성공 여부
    """
    return telegram_notifier.send_and_log(
        message=message,
        notification_type=notification_type,
        title=title,
        severity=severity,
        metadata=metadata,
        parse_mode=parse_mode
    )
