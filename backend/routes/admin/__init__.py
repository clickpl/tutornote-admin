# Admin routes package
"""
Admin Dashboard API Blueprints

Phase 2에서 추가된 Blueprints:
- metrics_bp: 12개 핵심 지표 API
- tables_bp: 3개 테이블 섹션 API
- reports_bp: 학부모 열람 추적 API
- notifications_bp: 알림 관리 API (카카오 알림톡 + 텔레그램)
- holidays_bp: 휴일 관리 API (공휴일 CRUD)
"""

from routes.admin.alerts import alerts_bp, register_alerts_routes
from routes.admin.metrics import metrics_bp, register_metrics_routes
from routes.admin.tables import tables_bp, register_tables_routes
from routes.admin.reports import reports_bp, register_reports_routes
from routes.admin.notifications import notifications_bp, register_notifications_routes
from routes.admin.holidays import holidays_bp, register_holidays_routes


def register_all_admin_routes(app):
    """모든 Admin Blueprint 등록"""
    register_alerts_routes(app)
    register_metrics_routes(app)
    register_tables_routes(app)
    register_reports_routes(app)
    register_notifications_routes(app)
    register_holidays_routes(app)


__all__ = [
    'alerts_bp',
    'metrics_bp',
    'tables_bp',
    'reports_bp',
    'notifications_bp',
    'holidays_bp',
    'register_all_admin_routes',
    'register_alerts_routes',
    'register_metrics_routes',
    'register_tables_routes',
    'register_reports_routes',
    'register_notifications_routes',
    'register_holidays_routes',
]
