"""
활동 로그 미들웨어

주요 사용자 액션을 자동으로 로깅합니다.

사용 예시:
    >>> from middleware.activity_logger import log_activity
    >>> log_activity('login')
    >>> log_activity('create_report', {'report_id': 123, 'ai_generated': True})
"""

import os
import json
from datetime import datetime
from typing import Optional, Dict, Any


class ActivityLogger:
    """활동 로그 저장 클래스"""

    # 지원하는 액션 타입
    ACTION_TYPES = [
        'login',
        'logout',
        'create_report',
        'update_report',
        'delete_report',
        'share_kakaotalk',
        'create_student',
        'update_student',
        'delete_student',
        'check_in',
        'check_out',
        'view_report',
        'generate_card_news',
        'send_alimtalk',
    ]

    def __init__(self):
        pass

    def _get_db_connection(self):
        """데이터베이스 연결"""
        try:
            import mysql.connector
            return mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'tutornote')
            )
        except Exception as e:
            print(f"[ActivityLogger] DB connection failed: {e}")
            return None

    def _get_request_info(self) -> Dict[str, str]:
        """
        Flask/FastAPI 요청 정보 추출

        Returns:
            dict: {'ip_address': str, 'user_agent': str}
        """
        ip_address = None
        user_agent = None

        try:
            # Flask 환경
            from flask import request
            ip_address = request.remote_addr
            user_agent = request.user_agent.string if request.user_agent else None
        except (ImportError, RuntimeError):
            pass

        try:
            # FastAPI 환경 (대안)
            # FastAPI에서는 request 객체를 직접 전달받아야 함
            pass
        except:
            pass

        return {
            'ip_address': ip_address or 'unknown',
            'user_agent': user_agent or 'unknown'
        }

    def _get_user_context(self) -> Dict[str, Optional[int]]:
        """
        현재 사용자 컨텍스트 추출

        Returns:
            dict: {'academy_id': int, 'user_id': int}
        """
        academy_id = None
        user_id = None

        try:
            # Flask g 객체에서 추출
            from flask import g
            academy_id = getattr(g, 'academy_id', None)
            user_id = getattr(g, 'user_id', None)
        except (ImportError, RuntimeError):
            pass

        return {
            'academy_id': academy_id,
            'user_id': user_id
        }

    def log(
        self,
        action_type: str,
        action_detail: Optional[Dict] = None,
        academy_id: Optional[int] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        활동 로그 저장

        Args:
            action_type: 액션 타입 (login, create_report 등)
            action_detail: 액션 상세 정보 (JSON)
            academy_id: 학원 ID (None이면 자동 추출)
            user_id: 사용자 ID (None이면 자동 추출)
            ip_address: IP 주소 (None이면 자동 추출)
            user_agent: User-Agent (None이면 자동 추출)

        Returns:
            bool: 저장 성공 여부
        """
        try:
            # 컨텍스트 자동 추출
            if academy_id is None or user_id is None:
                context = self._get_user_context()
                academy_id = academy_id or context['academy_id']
                user_id = user_id or context['user_id']

            # academy_id가 없으면 로깅 스킵 (익명 요청)
            if not academy_id:
                print(f"[ActivityLogger] Skipped: No academy_id for {action_type}")
                return False

            # 요청 정보 자동 추출
            if ip_address is None or user_agent is None:
                req_info = self._get_request_info()
                ip_address = ip_address or req_info['ip_address']
                user_agent = user_agent or req_info['user_agent']

            # DB 저장
            conn = self._get_db_connection()
            if not conn:
                return False

            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO activity_logs
                (academy_id, user_id, action_type, action_detail, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                academy_id,
                user_id,
                action_type,
                json.dumps(action_detail) if action_detail else None,
                ip_address,
                user_agent
            ))

            conn.commit()
            cursor.close()
            conn.close()

            print(f"[ActivityLogger] Logged: {action_type} for academy {academy_id}")
            return True

        except Exception as e:
            # 로깅 실패해도 메인 로직에 영향 없도록
            print(f"[ActivityLogger] Error logging {action_type}: {e}")
            return False


# 싱글톤 인스턴스
_logger = ActivityLogger()


def log_activity(
    action_type: str,
    action_detail: Optional[Dict] = None,
    academy_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> bool:
    """
    활동 로그 저장 (함수 인터페이스)

    Args:
        action_type: 액션 타입 (login, create_report, share_kakaotalk 등)
        action_detail: 액션 상세 정보 (딕셔너리)
        academy_id: 학원 ID (선택, None이면 자동 추출)
        user_id: 사용자 ID (선택, None이면 자동 추출)

    Returns:
        bool: 저장 성공 여부

    Examples:
        >>> log_activity('login')
        True
        >>> log_activity('create_report', {'report_id': 123, 'ai_generated': True})
        True
        >>> log_activity('share_kakaotalk', {'report_id': 123, 'method': 'link'})
        True
    """
    return _logger.log(
        action_type=action_type,
        action_detail=action_detail,
        academy_id=academy_id,
        user_id=user_id
    )


def get_activity_stats(academy_id: int, days: int = 30) -> Dict:
    """
    학원별 활동 통계 조회

    Args:
        academy_id: 학원 ID
        days: 조회 기간 (일)

    Returns:
        dict: 활동 통계
    """
    conn = _logger._get_db_connection()
    if not conn:
        return {}

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                action_type,
                COUNT(*) as count,
                MAX(created_at) as last_activity
            FROM activity_logs
            WHERE academy_id = %s
            AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY action_type
            ORDER BY count DESC
        """, (academy_id, days))

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        return {
            'by_action': {r['action_type']: r['count'] for r in results},
            'total': sum(r['count'] for r in results),
            'last_activity': max(
                (r['last_activity'] for r in results if r['last_activity']),
                default=None
            )
        }

    except Exception as e:
        print(f"[ActivityLogger] Failed to get stats: {e}")
        return {}


def get_recent_activities(academy_id: int, limit: int = 10) -> list:
    """
    최근 활동 내역 조회

    Args:
        academy_id: 학원 ID
        limit: 조회 개수

    Returns:
        list: 최근 활동 목록
    """
    conn = _logger._get_db_connection()
    if not conn:
        return []

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                id,
                action_type,
                action_detail,
                created_at
            FROM activity_logs
            WHERE academy_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (academy_id, limit))

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        return results

    except Exception as e:
        print(f"[ActivityLogger] Failed to get recent activities: {e}")
        return []
