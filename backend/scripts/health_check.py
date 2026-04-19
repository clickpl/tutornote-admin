#!/usr/bin/env python3
"""
시스템 헬스체크 스크립트

5분마다 실행되어 시스템 상태를 수집하고 Critical Alert를 체크합니다.

실행 방법:
    python3 scripts/health_check.py

Crontab 설정:
    */5 * * * * /usr/bin/python3 /path/to/backend/scripts/health_check.py >> /var/log/tutornote/health_check.log 2>&1
"""

import os
import sys
from datetime import datetime

# 프로젝트 루트를 sys.path에 추가
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# .env 파일 로드
try:
    from dotenv import load_dotenv
    env_path = os.path.join(PROJECT_ROOT, '.env')
    load_dotenv(env_path)
except ImportError:
    pass  # dotenv 없으면 환경변수에서 직접 읽음

try:
    import psutil
except ImportError:
    print("ERROR: psutil 설치 필요: pip3 install psutil --break-system-packages")
    sys.exit(1)

from config.alert_thresholds import get_threshold, get_cooldown
from utils.alert_deduplicator import alert_deduplicator
from utils.telegram_notifier import telegram_notifier


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
        print(f"[HealthCheck] DB connection failed: {e}")
        return None


def collect_system_metrics():
    """
    시스템 리소스 사용량 수집

    Returns:
        tuple: (cpu_usage, ram_usage, disk_usage, active_connections)
    """
    # CPU 사용률 (1초 간격)
    cpu_usage = psutil.cpu_percent(interval=1)

    # RAM 사용률
    ram = psutil.virtual_memory()
    ram_usage = ram.percent

    # Disk 사용률 (루트 파티션)
    disk = psutil.disk_usage('/')
    disk_usage = disk.percent

    # 활성 연결 수 (네트워크)
    try:
        active_connections = len([
            conn for conn in psutil.net_connections()
            if conn.status == 'ESTABLISHED'
        ])
    except (PermissionError, psutil.AccessDenied):
        active_connections = 0

    return cpu_usage, ram_usage, disk_usage, active_connections


def save_metrics(cpu, ram, disk, connections):
    """
    수집된 메트릭을 DB에 저장

    Args:
        cpu: CPU 사용률 (%)
        ram: RAM 사용률 (%)
        disk: Disk 사용률 (%)
        connections: 활성 연결 수
    """
    conn = get_db_connection()
    if not conn:
        return False

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO system_health_logs
            (cpu_usage, ram_usage, disk_usage, active_connections)
            VALUES (%s, %s, %s, %s)
        """, (cpu, ram, disk, connections))

        conn.commit()
        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"[HealthCheck] Failed to save metrics: {e}")
        return False


def check_and_alert_cpu(cpu_usage):
    """CPU Alert 체크 및 텔레그램 알림"""
    cpu_warning = get_threshold('system', 'cpu', 'warning')
    cpu_critical = get_threshold('system', 'cpu', 'critical')

    if cpu_usage > cpu_critical:
        alert_key = f"cpu_critical_{int(cpu_usage)}"
        cooldown = get_cooldown('cpu_critical')

        if alert_deduplicator.should_send_alert(alert_key, cooldown):
            telegram_notifier.send_critical_alert({
                'severity': 'critical',
                'title': f'CPU 사용률 위험: {cpu_usage:.1f}%',
                'description': f'현재 CPU 사용률이 {cpu_usage:.1f}%로 매우 높습니다. 시스템 성능 저하 위험.',
                'action': 'Backend 재시작 또는 프로세스 확인이 필요합니다.',
                'metadata': {'cpu_usage': cpu_usage, 'threshold': cpu_critical, 'alert_type': 'cpu'}
            }, notification_type='server_check')
            return 'critical'

    elif cpu_usage > cpu_warning:
        alert_key = f"cpu_warning_{int(cpu_usage)}"
        cooldown = get_cooldown('cpu_warning')

        if alert_deduplicator.should_send_alert(alert_key, cooldown):
            telegram_notifier.send_critical_alert({
                'severity': 'warning',
                'title': f'CPU 사용률 주의: {cpu_usage:.1f}%',
                'description': f'CPU 사용률이 {cpu_usage:.1f}%입니다. 모니터링이 필요합니다.',
                'action': '프로세스 상태를 확인해주세요.',
                'metadata': {'cpu_usage': cpu_usage, 'threshold': cpu_warning, 'alert_type': 'cpu'}
            }, notification_type='server_check')
            return 'warning'

    return None


def check_and_alert_ram(ram_usage):
    """RAM Alert 체크 및 텔레그램 알림"""
    ram_warning = get_threshold('system', 'ram', 'warning')
    ram_critical = get_threshold('system', 'ram', 'critical')

    if ram_usage > ram_critical:
        alert_key = f"ram_critical_{int(ram_usage)}"
        cooldown = get_cooldown('ram_critical')

        if alert_deduplicator.should_send_alert(alert_key, cooldown):
            telegram_notifier.send_critical_alert({
                'severity': 'critical',
                'title': f'RAM 사용률 위험: {ram_usage:.1f}%',
                'description': f'현재 RAM 사용률이 {ram_usage:.1f}%로 매우 높습니다. 메모리 부족 위험.',
                'action': '메모리 누수 확인 또는 서버 재시작이 필요합니다.',
                'metadata': {'ram_usage': ram_usage, 'threshold': ram_critical, 'alert_type': 'ram'}
            }, notification_type='server_check')
            return 'critical'

    elif ram_usage > ram_warning:
        alert_key = f"ram_warning_{int(ram_usage)}"
        cooldown = get_cooldown('ram_warning')

        if alert_deduplicator.should_send_alert(alert_key, cooldown):
            telegram_notifier.send_critical_alert({
                'severity': 'warning',
                'title': f'RAM 사용률 주의: {ram_usage:.1f}%',
                'description': f'RAM 사용률이 {ram_usage:.1f}%입니다. 모니터링이 필요합니다.',
                'action': '메모리 사용량을 확인해주세요.',
                'metadata': {'ram_usage': ram_usage, 'threshold': ram_warning, 'alert_type': 'ram'}
            }, notification_type='server_check')
            return 'warning'

    return None


def check_and_alert_disk(disk_usage):
    """Disk Alert 체크 및 텔레그램 알림"""
    disk_warning = get_threshold('system', 'disk', 'warning')
    disk_critical = get_threshold('system', 'disk', 'critical')

    if disk_usage > disk_critical:
        alert_key = f"disk_critical_{int(disk_usage)}"
        cooldown = get_cooldown('disk_critical')

        if alert_deduplicator.should_send_alert(alert_key, cooldown):
            telegram_notifier.send_critical_alert({
                'severity': 'critical',
                'title': f'디스크 공간 부족: {disk_usage:.1f}%',
                'description': f'현재 디스크 사용률이 {disk_usage:.1f}%로 매우 높습니다. 서비스 장애 위험.',
                'action': '로그 파일 정리 또는 디스크 확장이 필요합니다.',
                'metadata': {'disk_usage': disk_usage, 'threshold': disk_critical, 'alert_type': 'disk'}
            }, notification_type='server_check')
            return 'critical'

    elif disk_usage > disk_warning:
        alert_key = f"disk_warning_{int(disk_usage)}"
        cooldown = get_cooldown('disk_warning')

        if alert_deduplicator.should_send_alert(alert_key, cooldown):
            telegram_notifier.send_critical_alert({
                'severity': 'warning',
                'title': f'디스크 공간 주의: {disk_usage:.1f}%',
                'description': f'디스크 사용률이 {disk_usage:.1f}%입니다. 정리가 필요합니다.',
                'action': '불필요한 파일을 정리해주세요.',
                'metadata': {'disk_usage': disk_usage, 'threshold': disk_warning, 'alert_type': 'disk'}
            }, notification_type='server_check')
            return 'warning'

    return None


def main():
    """메인 헬스체크 실행"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] HealthCheck 시작...")

    # 1. 시스템 메트릭 수집
    cpu, ram, disk, connections = collect_system_metrics()
    print(f"  CPU: {cpu:.1f}%, RAM: {ram:.1f}%, Disk: {disk:.1f}%, Connections: {connections}")

    # 2. DB에 저장
    saved = save_metrics(cpu, ram, disk, connections)
    if saved:
        print(f"  ✓ 메트릭 저장 완료")
    else:
        print(f"  ⚠️ 메트릭 저장 실패 (DB 연결 확인 필요)")

    # 3. Alert 체크 및 알림
    alerts = []

    cpu_alert = check_and_alert_cpu(cpu)
    if cpu_alert:
        alerts.append(f"CPU {cpu_alert}")

    ram_alert = check_and_alert_ram(ram)
    if ram_alert:
        alerts.append(f"RAM {ram_alert}")

    disk_alert = check_and_alert_disk(disk)
    if disk_alert:
        alerts.append(f"Disk {disk_alert}")

    if alerts:
        print(f"  🚨 Alert 발생: {', '.join(alerts)}")
    else:
        print(f"  ✓ 모든 시스템 정상")

    # 4. 오래된 Alert 기록 정리 (24시간 이상)
    cleared = alert_deduplicator.clear_old_alerts(hours=24)
    if cleared > 0:
        print(f"  ✓ {cleared}개 오래된 Alert 기록 정리")

    print(f"[{timestamp}] HealthCheck 완료\n")


if __name__ == '__main__':
    main()
