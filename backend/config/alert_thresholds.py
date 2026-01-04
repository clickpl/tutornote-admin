"""
Alert 임계값 설정

운영 중 이 파일을 수정하고 서버 재시작하면 즉시 반영됨

사용 예시:
    >>> from config.alert_thresholds import get_threshold, get_cooldown
    >>> cpu_critical = get_threshold('system', 'cpu', 'critical')  # 90
    >>> cooldown = get_cooldown('cpu_critical')  # 60분
"""

from typing import Dict, Any, Optional


# 시스템 리소스 임계값
SYSTEM_THRESHOLDS: Dict[str, Dict[str, int]] = {
    'cpu': {
        'warning': 80,      # % - 주의 (노랑)
        'critical': 90,     # % - 위험 (빨강)
    },
    'ram': {
        'warning': 80,      # %
        'critical': 90,     # %
    },
    'disk': {
        'warning': 80,      # %
        'critical': 90,     # %
    },
    'backend_restart': {
        'warning': 50,      # 횟수/일
        'critical': 100,    # 횟수/일
    }
}

# 비즈니스 지표 임계값
BUSINESS_THRESHOLDS: Dict[str, Dict[str, int]] = {
    'inactive_days': {
        'warning': 14,      # 일
        'critical': 30,     # 일 (환불 가능 기간)
    },
    'parent_view_rate': {
        'warning': 30,      # % - 학부모 열람률
    },
    'daily_active_rate': {
        'warning': 40,      # % - DAU/MAU 비율
    }
}

# Alert 중복 방지 시간 (분)
ALERT_COOLDOWN: Dict[str, int] = {
    'cpu_critical': 60,         # CPU 위험 알림은 1시간마다
    'cpu_warning': 120,         # CPU 주의 알림은 2시간마다
    'ram_critical': 60,         # RAM 위험 알림은 1시간마다
    'ram_warning': 120,         # RAM 주의 알림은 2시간마다
    'disk_critical': 60,        # Disk 위험 알림은 1시간마다
    'disk_warning': 120,        # Disk 주의 알림은 2시간마다
    'backend_restart': 30,      # Backend 재시작은 30분마다
    'inactive_academy': 1440,   # 무활동 학원은 1일(24시간)마다
    'parent_view_rate': 720,    # 학부모 열람률은 12시간마다
}

# 텔레그램 알림 설정
TELEGRAM_NOTIFICATION: Dict[str, Any] = {
    'enabled': True,
    'send_daily_summary': True,     # 일일 요약 발송 여부
    'daily_summary_time': '09:00',  # 발송 시간 (KST)
}


def get_threshold(category: str, metric: str, level: str) -> int:
    """
    임계값 가져오기

    Args:
        category: 'system' 또는 'business'
        metric: 'cpu', 'ram', 'inactive_days' 등
        level: 'warning' 또는 'critical'

    Returns:
        int: 임계값

    Raises:
        ValueError: 알 수 없는 category인 경우

    Examples:
        >>> get_threshold('system', 'cpu', 'critical')
        90
        >>> get_threshold('business', 'inactive_days', 'warning')
        14
    """
    if category == 'system':
        return SYSTEM_THRESHOLDS.get(metric, {}).get(level, 0)
    elif category == 'business':
        return BUSINESS_THRESHOLDS.get(metric, {}).get(level, 0)
    else:
        raise ValueError(f"Unknown category: {category}")


def get_cooldown(alert_type: str) -> int:
    """
    Alert 중복 방지 시간(분) 가져오기

    Args:
        alert_type: 알림 타입 (예: 'cpu_critical', 'backend_restart')

    Returns:
        int: 중복 방지 시간 (분). 기본값 60분

    Examples:
        >>> get_cooldown('cpu_critical')
        60
        >>> get_cooldown('backend_restart')
        30
    """
    return ALERT_COOLDOWN.get(alert_type, 60)  # 기본 60분


def is_notification_enabled() -> bool:
    """텔레그램 알림 활성화 여부"""
    return TELEGRAM_NOTIFICATION.get('enabled', True)


def get_daily_summary_time() -> str:
    """일일 요약 발송 시간 (HH:MM 형식)"""
    return TELEGRAM_NOTIFICATION.get('daily_summary_time', '09:00')
