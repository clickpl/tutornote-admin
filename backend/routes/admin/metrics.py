"""
핵심 지표 API 엔드포인트

대시보드용 12개 핵심 지표를 반환합니다.

API:
    GET /api/admin/metrics/academy-status - 학원 현황
    GET /api/admin/metrics/student-stats - 학생 현황
    GET /api/admin/metrics/report-activity - 리포트 활동
    GET /api/admin/metrics/engagement - 활성도 지표
    GET /api/admin/metrics/content-generation - 콘텐츠 생성
    GET /api/admin/metrics/parent-reach - 학부모 도달
    GET /api/admin/metrics/ai-efficiency - AI 효율성
    GET /api/admin/metrics/onboarding-funnel - 전환 퍼널
    GET /api/admin/metrics/monetization - 수익화 준비
    GET /api/admin/metrics/cost-breakdown - 비용 현황
    GET /api/admin/metrics/system-health - 시스템 건강
    GET /api/admin/metrics/api-status - API 상태
"""

import os
from datetime import datetime
from typing import Dict, Any
from flask import Blueprint, jsonify

import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)


metrics_bp = Blueprint('metrics', __name__)


def get_db_connection():
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
        print(f"[Metrics API] DB connection failed: {e}")
        return None


# =============================================================================
# Card 1-1: 학원 현황
# =============================================================================
@metrics_bp.route('/api/admin/metrics/academy-status', methods=['GET'])
def get_academy_status():
    """학원 현황 지표"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 전체 학원 수
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM academies
            WHERE is_deleted = 0
        """)
        total = cursor.fetchone()['total']

        # 활성 학원 (최근 7일 내 활동)
        cursor.execute("""
            SELECT COUNT(DISTINCT academy_id) as active
            FROM activity_logs
            WHERE created_at >= NOW() - INTERVAL 7 DAY
        """)
        active = cursor.fetchone()['active']

        # 신규 학원 (30일)
        cursor.execute("""
            SELECT COUNT(*) as new_signups
            FROM academies
            WHERE created_at >= NOW() - INTERVAL 30 DAY
            AND is_deleted = 0
        """)
        new_signups = cursor.fetchone()['new_signups']

        # 이탈 학원 (30일 이상 무활동)
        cursor.execute("""
            SELECT COUNT(*) as churned
            FROM academies a
            WHERE a.is_deleted = 0
            AND NOT EXISTS (
                SELECT 1 FROM activity_logs al
                WHERE al.academy_id = a.id
                AND al.created_at >= NOW() - INTERVAL 30 DAY
            )
        """)
        churned = cursor.fetchone()['churned']

        # 성장률 (전월 대비)
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as current_month,
                COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
                           AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as last_month
            FROM academies
            WHERE is_deleted = 0
        """)
        growth = cursor.fetchone()
        current_month = growth['current_month'] or 0
        last_month = growth['last_month'] or 0
        growth_rate = ((current_month - last_month) / last_month * 100) if last_month > 0 else 0

        cursor.close()
        conn.close()

        trend = 'up' if growth_rate > 0 else ('down' if growth_rate < 0 else 'stable')

        return jsonify({
            'total': total,
            'active': active,
            'new_signups': new_signups,
            'churned': churned,
            'growth_rate': round(growth_rate, 1),
            'trend': trend
        })

    except Exception as e:
        print(f"[Metrics API] Academy status error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 1-2: 학생 현황
# =============================================================================
@metrics_bp.route('/api/admin/metrics/student-stats', methods=['GET'])
def get_student_stats():
    """학생 현황 지표"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 총 학생 수
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM students
            WHERE is_deleted = 0
        """)
        total = cursor.fetchone()['total']

        # 이번 달 / 전월 신규 학생
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as this_month,
                COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
                           AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as last_month
            FROM students
            WHERE is_deleted = 0
        """)
        monthly = cursor.fetchone()
        this_month = monthly['this_month'] or 0
        last_month = monthly['last_month'] or 0
        monthly_growth = this_month - last_month
        growth_rate = ((this_month - last_month) / last_month * 100) if last_month > 0 else 0

        # 학원당 평균 학생 수
        cursor.execute("""
            SELECT
                COUNT(*) as student_count,
                COUNT(DISTINCT academy_id) as academy_count
            FROM students
            WHERE is_deleted = 0
        """)
        avg_data = cursor.fetchone()
        student_count = avg_data['student_count'] or 0
        academy_count = avg_data['academy_count'] or 1
        avg_per_academy = round(student_count / academy_count, 1)

        cursor.close()
        conn.close()

        trend = 'up' if growth_rate > 0 else ('down' if growth_rate < 0 else 'stable')

        return jsonify({
            'total': total,
            'this_month': this_month,
            'last_month': last_month,
            'monthly_growth': monthly_growth,
            'growth_rate': round(growth_rate, 1),
            'avg_per_academy': avg_per_academy,
            'trend': trend
        })

    except Exception as e:
        print(f"[Metrics API] Student stats error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 1-3: 리포트 활동
# =============================================================================
@metrics_bp.route('/api/admin/metrics/report-activity', methods=['GET'])
def get_report_activity():
    """리포트 활동 지표"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 이번 달 / 전월 리포트 수
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as this_month,
                COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
                           AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as last_month
            FROM progress_records
            WHERE is_deleted = 0
        """)
        monthly = cursor.fetchone()
        this_month = monthly['this_month'] or 0
        last_month = monthly['last_month'] or 0
        monthly_growth = this_month - last_month
        growth_rate = ((this_month - last_month) / last_month * 100) if last_month > 0 else 0

        # 학생당 평균 리포트 수 (이번 달)
        cursor.execute("""
            SELECT
                COUNT(*) as report_count,
                COUNT(DISTINCT student_id) as student_count
            FROM progress_records
            WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
            AND is_deleted = 0
        """)
        avg_data = cursor.fetchone()
        report_count = avg_data['report_count'] or 0
        student_count = avg_data['student_count'] or 1
        avg_per_student = round(report_count / student_count, 1) if student_count > 0 else 0

        cursor.close()
        conn.close()

        trend = 'up' if growth_rate > 0 else ('down' if growth_rate < 0 else 'stable')

        return jsonify({
            'this_month': this_month,
            'last_month': last_month,
            'monthly_growth': monthly_growth,
            'growth_rate': round(growth_rate, 1),
            'avg_per_student': avg_per_student,
            'trend': trend
        })

    except Exception as e:
        print(f"[Metrics API] Report activity error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 1-4: 활성도 지표
# =============================================================================
@metrics_bp.route('/api/admin/metrics/engagement', methods=['GET'])
def get_engagement():
    """활성도 지표 (DAU/MAU/고착도)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # DAU (Daily Active Users)
        cursor.execute("""
            SELECT COUNT(DISTINCT academy_id) as dau
            FROM activity_logs
            WHERE DATE(created_at) = CURDATE()
        """)
        dau = cursor.fetchone()['dau'] or 0

        # MAU (Monthly Active Users)
        cursor.execute("""
            SELECT COUNT(DISTINCT academy_id) as mau
            FROM activity_logs
            WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        mau = cursor.fetchone()['mau'] or 0

        # 고착도 (Stickiness) = DAU / MAU
        stickiness = round((dau / mau * 100), 1) if mau > 0 else 0

        # 이탈 위험 학원 (7일 이상 무활동)
        cursor.execute("""
            SELECT COUNT(*) as at_risk
            FROM academies a
            WHERE a.is_deleted = 0
            AND NOT EXISTS (
                SELECT 1 FROM activity_logs al
                WHERE al.academy_id = a.id
                AND al.created_at >= NOW() - INTERVAL 7 DAY
            )
        """)
        at_risk = cursor.fetchone()['at_risk'] or 0

        cursor.close()
        conn.close()

        return jsonify({
            'dau': dau,
            'mau': mau,
            'stickiness': stickiness,
            'at_risk': at_risk,
            'target_stickiness': 60  # 목표 고착도
        })

    except Exception as e:
        print(f"[Metrics API] Engagement error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 2-1: 콘텐츠 생성 (카드뉴스)
# =============================================================================
@metrics_bp.route('/api/admin/metrics/content-generation', methods=['GET'])
def get_content_generation():
    """콘텐츠 생성 지표 (카드뉴스)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 카드뉴스 생성 수 (이번 달)
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN card_news_generated = 1 THEN 1 END) as card_news_count,
                COUNT(DISTINCT CASE WHEN card_news_generated = 1 THEN academy_id END) as academy_count
            FROM progress_records pr
            JOIN students s ON pr.student_id = s.id
            WHERE pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
            AND pr.is_deleted = 0
        """)
        result = cursor.fetchone()
        card_news_count = result['card_news_count'] or 0
        academy_count = result['academy_count'] or 1
        avg_per_academy = round(card_news_count / academy_count, 1) if academy_count > 0 else 0

        # 전월 대비
        cursor.execute("""
            SELECT COUNT(*) as last_month
            FROM progress_records
            WHERE card_news_generated = 1
            AND created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
            AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01')
            AND is_deleted = 0
        """)
        last_month = cursor.fetchone()['last_month'] or 0
        growth_rate = ((card_news_count - last_month) / last_month * 100) if last_month > 0 else 0

        cursor.close()
        conn.close()

        trend = 'up' if growth_rate > 0 else ('down' if growth_rate < 0 else 'stable')

        return jsonify({
            'card_news_count': card_news_count,
            'avg_per_academy': avg_per_academy,
            'last_month': last_month,
            'growth_rate': round(growth_rate, 1),
            'trend': trend
        })

    except Exception as e:
        print(f"[Metrics API] Content generation error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 2-2: 학부모 도달
# =============================================================================
@metrics_bp.route('/api/admin/metrics/parent-reach', methods=['GET'])
def get_parent_reach():
    """학부모 도달 지표 (공유/열람/열람률)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 리포트 공유 수 (이번 달)
        cursor.execute("""
            SELECT COUNT(*) as shares
            FROM activity_logs
            WHERE action_type = 'share_kakaotalk'
            AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        shares = cursor.fetchone()['shares'] or 0

        # 학부모 열람 수 (이번 달)
        cursor.execute("""
            SELECT COUNT(*) as views
            FROM report_views
            WHERE viewer_type = 'parent'
            AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        views = cursor.fetchone()['views'] or 0

        # 열람률
        view_rate = round((views / shares * 100), 1) if shares > 0 else 0

        cursor.close()
        conn.close()

        return jsonify({
            'shares': shares,
            'views': views,
            'view_rate': view_rate,
            'target_rate': 60  # 목표 열람률
        })

    except Exception as e:
        print(f"[Metrics API] Parent reach error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 2-3: AI 효율성
# =============================================================================
@metrics_bp.route('/api/admin/metrics/ai-efficiency', methods=['GET'])
def get_ai_efficiency():
    """AI 효율성 지표"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # AI로 생성된 리포트 수 (이번 달)
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN ai_generated = 1 THEN 1 END) as ai_reports,
                COUNT(DISTINCT CASE WHEN ai_generated = 1 THEN s.academy_id END) as academy_count
            FROM progress_records pr
            JOIN students s ON pr.student_id = s.id
            WHERE pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
            AND pr.is_deleted = 0
        """)
        result = cursor.fetchone()
        ai_reports = result['ai_reports'] or 0
        academy_count = result['academy_count'] or 1

        # 시간 절감 계산 (수동 90분 → AI 9분)
        hours_saved = round(ai_reports * ((90 - 9) / 60), 1)

        # 학원당 평균
        avg_per_academy = round(ai_reports / academy_count, 1) if academy_count > 0 else 0

        # 보호자 동의 완료율
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN consent_status = 'approved' THEN 1 END) as approved,
                COUNT(*) as total
            FROM students
            WHERE is_deleted = 0
        """)
        consent = cursor.fetchone()
        approved = consent['approved'] or 0
        total = consent['total'] or 1
        consent_rate = round((approved / total * 100), 1) if total > 0 else 0

        cursor.close()
        conn.close()

        return jsonify({
            'ai_reports': ai_reports,
            'hours_saved': hours_saved,
            'avg_per_academy': avg_per_academy,
            'consent_rate': consent_rate
        })

    except Exception as e:
        print(f"[Metrics API] AI efficiency error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 2-4: 전환 퍼널
# =============================================================================
@metrics_bp.route('/api/admin/metrics/onboarding-funnel', methods=['GET'])
def get_onboarding_funnel():
    """온보딩 퍼널 분석 (최근 30일)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 신규 학원 전환 퍼널
        cursor.execute("""
            SELECT
                COUNT(DISTINCT a.id) as total_signups,
                COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN a.id END) as has_students,
                COUNT(DISTINCT CASE WHEN pr.id IS NOT NULL THEN a.id END) as created_report,
                COUNT(DISTINCT CASE WHEN al.action_type = 'share_kakaotalk' THEN a.id END) as shared_kakaotalk
            FROM academies a
            LEFT JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
            LEFT JOIN progress_records pr ON s.id = pr.student_id AND pr.is_deleted = 0
            LEFT JOIN activity_logs al ON a.id = al.academy_id AND al.action_type = 'share_kakaotalk'
            WHERE a.created_at >= NOW() - INTERVAL 30 DAY
            AND a.is_deleted = 0
        """)

        result = cursor.fetchone()
        total = result['total_signups'] or 0
        has_students = result['has_students'] or 0
        created_report = result['created_report'] or 0
        shared = result['shared_kakaotalk'] or 0

        cursor.close()
        conn.close()

        # 전환율 계산
        return jsonify({
            'funnel': {
                'signups': total,
                'has_students': has_students,
                'created_report': created_report,
                'shared_kakaotalk': shared
            },
            'conversion_rates': {
                'signup_to_student': round((has_students / total * 100), 1) if total > 0 else 0,
                'student_to_report': round((created_report / has_students * 100), 1) if has_students > 0 else 0,
                'report_to_share': round((shared / created_report * 100), 1) if created_report > 0 else 0,
                'overall': round((shared / total * 100), 1) if total > 0 else 0
            }
        })

    except Exception as e:
        print(f"[Metrics API] Onboarding funnel error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 3-1: 수익화 준비
# =============================================================================
@metrics_bp.route('/api/admin/metrics/monetization', methods=['GET'])
def get_monetization():
    """수익화 준비 지표 (헤비유저/MRR)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 헤비유저 (월 20건 이상 리포트)
        cursor.execute("""
            SELECT COUNT(DISTINCT academy_id) as heavy_users
            FROM (
                SELECT s.academy_id, COUNT(*) as report_count
                FROM progress_records pr
                JOIN students s ON pr.student_id = s.id
                WHERE pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
                AND pr.is_deleted = 0
                GROUP BY s.academy_id
                HAVING COUNT(*) >= 20
            ) heavy
        """)
        heavy_users = cursor.fetchone()['heavy_users'] or 0

        # MAU
        cursor.execute("""
            SELECT COUNT(DISTINCT academy_id) as mau
            FROM activity_logs
            WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        mau = cursor.fetchone()['mau'] or 0

        # 헤비유저 비율
        heavy_user_rate = round((heavy_users / mau * 100), 1) if mau > 0 else 0

        # 예상 MRR (Standard 플랜 ₩24,900 가정)
        estimated_mrr = mau * 24900

        cursor.close()
        conn.close()

        return jsonify({
            'heavy_users': heavy_users,
            'mau': mau,
            'heavy_user_rate': heavy_user_rate,
            'estimated_mrr': estimated_mrr,
            'plan_price': 24900
        })

    except Exception as e:
        print(f"[Metrics API] Monetization error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 3-2: 비용 현황
# =============================================================================
@metrics_bp.route('/api/admin/metrics/cost-breakdown', methods=['GET'])
def get_cost_breakdown():
    """비용 현황 지표"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 이번 달 비용 항목별 집계
        cursor.execute("""
            SELECT
                cost_type,
                SUM(amount) as cost
            FROM operational_costs
            WHERE billing_month = DATE_FORMAT(NOW(), '%Y-%m-01')
            GROUP BY cost_type
        """)
        costs_by_type = {row['cost_type']: float(row['cost']) for row in cursor.fetchall()}

        # 총 비용
        total = sum(costs_by_type.values())

        # 학원당 평균 비용
        cursor.execute("""
            SELECT COUNT(*) as academy_count
            FROM academies
            WHERE is_deleted = 0
        """)
        academy_count = cursor.fetchone()['academy_count'] or 1
        cost_per_academy = round(total / academy_count, 0)

        # 손익분기점 (Standard ₩24,900 기준)
        breakeven = int(total / 24900) + 1 if total > 0 else 0

        cursor.close()
        conn.close()

        return jsonify({
            'total': total,
            'alimtalk': costs_by_type.get('alimtalk', 0),
            'claude': costs_by_type.get('claude_api', 0),
            'server': costs_by_type.get('server', 0),
            'domain': costs_by_type.get('domain', 0),
            'other': costs_by_type.get('other', 0),
            'cost_per_academy': cost_per_academy,
            'breakeven_academies': breakeven
        })

    except Exception as e:
        print(f"[Metrics API] Cost breakdown error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 3-3: 시스템 건강
# =============================================================================
@metrics_bp.route('/api/admin/metrics/system-health', methods=['GET'])
def get_system_health():
    """시스템 건강 지표"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 최근 5분 평균 리소스 사용량
        cursor.execute("""
            SELECT
                AVG(cpu_usage) as cpu,
                AVG(ram_usage) as ram,
                AVG(disk_usage) as disk
            FROM system_health_logs
            WHERE created_at >= NOW() - INTERVAL 5 MINUTE
        """)
        result = cursor.fetchone()
        cpu = round(float(result['cpu']), 1) if result['cpu'] else 0
        ram = round(float(result['ram']), 1) if result['ram'] else 0
        disk = round(float(result['disk']), 1) if result['disk'] else 0

        # Backend 재시작 횟수 (일주일간 - 10분 이상 갭 = 재시작으로 간주)
        cursor.execute("""
            SELECT COUNT(*) as restart_count
            FROM (
                SELECT
                    created_at,
                    LAG(created_at) OVER (ORDER BY created_at) as prev_time
                FROM system_health_logs
                WHERE created_at >= NOW() - INTERVAL 7 DAY
            ) t
            WHERE TIMESTAMPDIFF(MINUTE, prev_time, created_at) > 10
        """)
        restart_count = cursor.fetchone()['restart_count'] or 0

        cursor.close()
        conn.close()

        # 상태 판정
        cpu_status = 'critical' if cpu > 90 else ('warning' if cpu > 80 else 'normal')
        ram_status = 'critical' if ram > 90 else ('warning' if ram > 80 else 'normal')
        disk_status = 'critical' if disk > 90 else ('warning' if disk > 80 else 'normal')

        return jsonify({
            'cpu': cpu,
            'ram': ram,
            'disk': disk,
            'cpu_status': cpu_status,
            'ram_status': ram_status,
            'disk_status': disk_status,
            'restart_count': restart_count,
            'target_cpu': 60
        })

    except Exception as e:
        print(f"[Metrics API] System health error: {e}")
        return jsonify({'error': str(e)}), 500


# =============================================================================
# Card 3-4: API 상태
# =============================================================================
@metrics_bp.route('/api/admin/metrics/api-status', methods=['GET'])
def get_api_status():
    """API 상태 지표"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 각 API별 최근 1시간 상태
        cursor.execute("""
            SELECT
                api_name,
                AVG(response_time_ms) as avg_response_time,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
                COUNT(*) as total_count
            FROM api_health_checks
            WHERE created_at >= NOW() - INTERVAL 1 HOUR
            GROUP BY api_name
        """)

        api_stats = {}
        for row in cursor.fetchall():
            api_name = row['api_name']
            total = row['total_count'] or 0
            success = row['success_count'] or 0
            success_rate = round((success / total * 100), 1) if total > 0 else 100

            # 상태 판정
            if success_rate >= 99:
                status = 'healthy'
            elif success_rate >= 95:
                status = 'warning'
            else:
                status = 'critical'

            api_stats[api_name] = {
                'status': status,
                'response_time': round(float(row['avg_response_time']), 0) if row['avg_response_time'] else 0,
                'success_rate': success_rate
            }

        # 기본값 설정 (데이터가 없는 경우)
        if 'claude' not in api_stats:
            api_stats['claude'] = {'status': 'healthy', 'response_time': 0, 'success_rate': 100}
        if 'kakao' not in api_stats:
            api_stats['kakao'] = {'status': 'healthy', 'response_time': 0, 'success_rate': 100}

        cursor.close()
        conn.close()

        return jsonify({
            'claude': api_stats.get('claude'),
            'kakao': api_stats.get('kakao'),
            'uptime_hours': 24 * 99  # 가정: 99일 가동
        })

    except Exception as e:
        print(f"[Metrics API] API status error: {e}")
        return jsonify({'error': str(e)}), 500


# Blueprint 등록용 함수
def register_metrics_routes(app):
    """Flask 앱에 metrics Blueprint 등록"""
    app.register_blueprint(metrics_bp)
