"""
Claude API 사용량 추적 모듈

Claude API 호출 시 토큰 사용량과 비용을 자동으로 추적합니다.

사용 예시:
    >>> from utils.claude_api_tracker import generate_feedback_with_tracking
    >>> feedback = generate_feedback_with_tracking(prompt, academy_id=1)
"""

import os
import time
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any

try:
    import anthropic
except ImportError:
    anthropic = None


class ClaudeAPITracker:
    """Claude API 호출 및 사용량 추적 클래스"""

    # Claude 모델별 가격 (USD per 1M tokens)
    PRICING = {
        'claude-sonnet-4-20250514': {'input': Decimal('3'), 'output': Decimal('15')},
        'claude-3-5-sonnet-20241022': {'input': Decimal('3'), 'output': Decimal('15')},
        'claude-3-opus-20240229': {'input': Decimal('15'), 'output': Decimal('75')},
        'claude-3-haiku-20240307': {'input': Decimal('0.25'), 'output': Decimal('1.25')},
        'default': {'input': Decimal('3'), 'output': Decimal('15')},
    }

    def __init__(self):
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        self.client = None
        if anthropic and self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)

    def _get_db_connection(self):
        """데이터베이스 연결 (프로젝트에 맞게 수정 필요)"""
        try:
            import mysql.connector
            return mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'tutornote')
            )
        except Exception as e:
            print(f"[ClaudeAPITracker] DB connection failed: {e}")
            return None

    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> Decimal:
        """토큰 사용량에 따른 비용 계산 (USD)"""
        pricing = self.PRICING.get(model, self.PRICING['default'])
        input_cost = Decimal(input_tokens) * pricing['input'] / Decimal('1000000')
        output_cost = Decimal(output_tokens) * pricing['output'] / Decimal('1000000')
        return input_cost + output_cost

    def _log_usage(
        self,
        academy_id: Optional[int],
        endpoint: str,
        input_tokens: int,
        output_tokens: int,
        total_cost: Decimal,
        response_time_ms: int,
        status: str = 'success',
        error_message: Optional[str] = None
    ):
        """API 사용량을 DB에 저장"""
        conn = self._get_db_connection()
        if not conn:
            return

        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO api_usage_logs
                (api_name, academy_id, endpoint, request_tokens, response_tokens,
                 total_cost, response_time_ms, status, error_message)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                'claude',
                academy_id,
                endpoint,
                input_tokens,
                output_tokens,
                float(total_cost),
                response_time_ms,
                status,
                error_message
            ))
            conn.commit()
            print(f"[ClaudeAPITracker] Logged: {input_tokens}+{output_tokens} tokens, ${total_cost:.4f}")
        except Exception as e:
            print(f"[ClaudeAPITracker] Failed to log usage: {e}")
        finally:
            cursor.close()
            conn.close()

    def generate(
        self,
        prompt: str,
        academy_id: Optional[int] = None,
        model: str = "claude-sonnet-4-20250514",
        max_tokens: int = 1000,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Claude API 호출 + 사용량 추적

        Args:
            prompt: 사용자 프롬프트
            academy_id: 학원 ID (로깅용)
            model: Claude 모델명
            max_tokens: 최대 출력 토큰 수
            system_prompt: 시스템 프롬프트 (선택)

        Returns:
            str: AI 생성 텍스트

        Raises:
            Exception: API 호출 실패 시
        """
        if not self.client:
            raise Exception("Claude API client not initialized. Check ANTHROPIC_API_KEY.")

        start_time = time.time()
        input_tokens = 0
        output_tokens = 0
        response_text = ""
        error_msg = None
        status = 'success'

        try:
            # API 호출 파라미터 구성
            params: Dict[str, Any] = {
                'model': model,
                'max_tokens': max_tokens,
                'messages': [{"role": "user", "content": prompt}]
            }

            if system_prompt:
                params['system'] = system_prompt

            # API 호출
            response = self.client.messages.create(**params)

            # 결과 추출
            response_text = response.content[0].text
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens

        except Exception as e:
            error_msg = str(e)
            status = 'error'
            raise e

        finally:
            # 응답 시간 계산
            response_time_ms = int((time.time() - start_time) * 1000)

            # 비용 계산
            total_cost = self._calculate_cost(model, input_tokens, output_tokens)

            # 사용량 로깅
            self._log_usage(
                academy_id=academy_id,
                endpoint='/v1/messages',
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_cost=total_cost,
                response_time_ms=response_time_ms,
                status=status,
                error_message=error_msg
            )

        return response_text


# 싱글톤 인스턴스
_tracker = ClaudeAPITracker()


def generate_feedback_with_tracking(
    prompt: str,
    academy_id: Optional[int] = None,
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 1000,
    system_prompt: Optional[str] = None
) -> str:
    """
    Claude API 호출 + 사용량 추적 (함수 인터페이스)

    Args:
        prompt: AI에게 전달할 프롬프트
        academy_id: 학원 ID
        model: Claude 모델명
        max_tokens: 최대 출력 토큰 수
        system_prompt: 시스템 프롬프트 (선택)

    Returns:
        str: AI 생성 피드백 텍스트

    Examples:
        >>> feedback = generate_feedback_with_tracking(
        ...     "학생의 피아노 실력에 대한 피드백을 작성해주세요.",
        ...     academy_id=1
        ... )
    """
    return _tracker.generate(
        prompt=prompt,
        academy_id=academy_id,
        model=model,
        max_tokens=max_tokens,
        system_prompt=system_prompt
    )


def get_api_usage_stats(academy_id: Optional[int] = None, days: int = 30) -> Dict:
    """
    API 사용량 통계 조회

    Args:
        academy_id: 특정 학원 ID (None이면 전체)
        days: 조회 기간 (일)

    Returns:
        dict: 사용량 통계
    """
    conn = _tracker._get_db_connection()
    if not conn:
        return {}

    try:
        cursor = conn.cursor(dictionary=True)

        if academy_id:
            cursor.execute("""
                SELECT
                    COUNT(*) as total_calls,
                    SUM(request_tokens) as total_input_tokens,
                    SUM(response_tokens) as total_output_tokens,
                    SUM(total_cost) as total_cost_usd,
                    AVG(response_time_ms) as avg_response_time
                FROM api_usage_logs
                WHERE api_name = 'claude'
                AND academy_id = %s
                AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            """, (academy_id, days))
        else:
            cursor.execute("""
                SELECT
                    COUNT(*) as total_calls,
                    SUM(request_tokens) as total_input_tokens,
                    SUM(response_tokens) as total_output_tokens,
                    SUM(total_cost) as total_cost_usd,
                    AVG(response_time_ms) as avg_response_time
                FROM api_usage_logs
                WHERE api_name = 'claude'
                AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            """, (days,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        return {
            'total_calls': result['total_calls'] or 0,
            'total_input_tokens': result['total_input_tokens'] or 0,
            'total_output_tokens': result['total_output_tokens'] or 0,
            'total_cost_usd': float(result['total_cost_usd'] or 0),
            'avg_response_time_ms': float(result['avg_response_time'] or 0)
        }

    except Exception as e:
        print(f"[ClaudeAPITracker] Failed to get stats: {e}")
        return {}
