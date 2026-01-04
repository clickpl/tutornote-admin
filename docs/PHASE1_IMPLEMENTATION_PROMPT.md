# TutorNote Master Admin 대시보드 개선 - Phase 1 구현 요청

## 🎯 역할 및 목적

당신은 TutorNote Master Admin 대시보드 개선 프로젝트의 **Phase 1: 긴급 수정** 단계를 구현하는 풀스택 개발자입니다.

**Phase 1 목표**: 데이터 정합성 확보 및 Critical Alerts 추가로 운영 리스크 최소화

**선행 작업**: Pre-work (Alert 중복 방지, Config, 텔레그램 알림) 완료 상태

---

## 📄 필수 참고 문서

구현 전 반드시 아래 기획서를 읽고 이해해야 합니다:

- **파일 경로**: `DASHBOARD_REDESIGN_SPEC.md` (이 프롬프트와 같은 디렉토리)
- **주요 섹션**:
  - **섹션 8.1**: Phase 1 전체 작업 목록 및 완료 기준 ⭐ (가장 중요)
  - **섹션 6.1**: 신규 DB 스키마 (5개 테이블 + 컬럼 추가) ⭐
  - **섹션 6.2**: 데이터 수집 구현 (코드 예시 포함) ⭐
  - **섹션 7**: 구현 전략 및 운영 계획 (배포 전략, 데이터 백필)

**읽는 방법**:
```bash
# 전체 문서 훑어보기
cat DASHBOARD_REDESIGN_SPEC.md

# Phase 1 관련 섹션만 집중 읽기
sed -n '989,1520p' DASHBOARD_REDESIGN_SPEC.md  # 섹션 6
sed -n '2078,2200p' DASHBOARD_REDESIGN_SPEC.md  # 섹션 8.1
```

---

## ✅ Phase 1 작업 목록

아래 7개 작업을 순서대로 완료해주세요:

### 작업 1: DB 스키마 설계 및 생성 (3시간)

**목표**: 데이터 수집을 위한 5개 신규 테이블 생성 + 1개 테이블 수정

#### 1.1 신규 테이블 생성 (5개)

**파일**: `backend/migrations/001_create_tracking_tables.sql`

**테이블 목록**:
1. `activity_logs` - 사용자 활동 로그 (로그인, 리포트 생성, 카톡 공유 등)
2. `report_views` - 학부모 리포트 열람 추적
3. `api_usage_logs` - API 사용량 추적 (Claude, Gemini, Kakao)
4. `operational_costs` - 운영 비용 추적 (알림톡, Claude API, 서버 등)
5. `system_health_logs` - 시스템 헬스체크 (CPU, RAM, Disk)
6. `api_health_checks` - API 헬스체크 (Claude, Kakao, Gemini)

**참고**: 기획서 섹션 6.1.1에 전체 SQL 있음 (복사 가능)

**마이그레이션 스크립트 예시**:
```sql
-- 001_create_tracking_tables.sql

-- 1. activity_logs 테이블
CREATE TABLE activity_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  academy_id INT NOT NULL,
  user_id INT,
  action_type VARCHAR(50) NOT NULL COMMENT 'login, create_report, share_kakaotalk, etc.',
  action_detail JSON COMMENT '액션 상세 정보',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_academy_id (academy_id),
  INDEX idx_created_at (created_at),
  INDEX idx_action_type (action_type),
  INDEX idx_academy_created (academy_id, created_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (나머지 4개 테이블도 기획서에서 복사)
```

#### 1.2 기존 테이블 수정

**파일**: `backend/migrations/002_alter_progress_records.sql`

**수정 테이블**: `progress_records`

**추가 컬럼** (4개):
```sql
ALTER TABLE progress_records 
ADD COLUMN ai_generated BOOLEAN DEFAULT 0 COMMENT 'AI로 생성되었는지 여부',
ADD COLUMN generation_time_seconds INT COMMENT '리포트 생성 소요 시간',
ADD COLUMN edit_count INT DEFAULT 0 COMMENT '수정 횟수 (AI 품질 지표)',
ADD COLUMN card_news_generated BOOLEAN DEFAULT 0 COMMENT '카드뉴스 생성 여부';
```

**참고**: 기획서 섹션 6.1.2

#### 1.3 마이그레이션 실행 스크립트

**파일**: `backend/migrations/run_migrations.sh`

```bash
#!/bin/bash
# 마이그레이션 실행 스크립트

echo "🔵 Phase 1 마이그레이션 시작..."

# DB 백업
mysqldump -u root -p tutornote > backup_before_phase1_$(date +%Y%m%d_%H%M%S).sql

# 마이그레이션 실행
mysql -u root -p tutornote < 001_create_tracking_tables.sql
mysql -u root -p tutornote < 002_alter_progress_records.sql

echo "✅ 마이그레이션 완료!"
echo ""
echo "테이블 확인:"
mysql -u root -p tutornote -e "SHOW TABLES LIKE '%logs%';"
mysql -u root -p tutornote -e "SHOW TABLES LIKE '%report_views%';"
mysql -u root -p tutornote -e "DESCRIBE progress_records;"
```

**완료 조건**:
- [ ] 5개 신규 테이블 생성 완료
- [ ] `progress_records` 테이블 4개 컬럼 추가 완료
- [ ] 마이그레이션 스크립트 실행 성공
- [ ] DB 백업 파일 생성됨

---

### 작업 2: Claude API 사용량 추적 로직 구현 (4시간)

**목표**: 기존 Claude API 호출 코드에 토큰/비용 로깅 추가

#### 2.1 Claude API 래퍼 함수 작성

**파일**: `backend/utils/claude_api_tracker.py`

**핵심 기능**:
- Claude API 호출 전후로 시간 측정
- 토큰 사용량 (input_tokens, output_tokens) 추출
- 비용 계산 (Claude Sonnet 4 가격: Input $3/1M, Output $15/1M)
- `api_usage_logs` 테이블에 저장
- 에러 발생 시에도 로그 저장

**참고**: 기획서 섹션 6.2.3에 전체 코드 있음 (복사 가능)

**함수 시그니처**:
```python
def generate_feedback_with_tracking(
    prompt: str, 
    academy_id: int,
    model: str = "claude-sonnet-4-20250514"
) -> str:
    """
    Claude API 호출 + 사용량 추적
    
    Args:
        prompt: AI에게 전달할 프롬프트
        academy_id: 학원 ID
        model: Claude 모델명
    
    Returns:
        str: AI 생성 피드백 텍스트
    """
    # 기획서 코드 참고
    pass
```

#### 2.2 기존 코드 수정

**수정 대상**: 기존 Claude API 호출하는 모든 엔드포인트

**예시**:
```python
# ❌ 수정 전
from anthropic import Anthropic
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
response = client.messages.create(...)

# ✅ 수정 후
from utils.claude_api_tracker import generate_feedback_with_tracking
feedback = generate_feedback_with_tracking(prompt, academy_id)
```

**완료 조건**:
- [ ] `claude_api_tracker.py` 작성 완료
- [ ] 기존 Claude API 호출 코드 모두 수정
- [ ] 테스트 리포트 생성 시 `api_usage_logs`에 데이터 저장 확인
- [ ] 에러 발생 시에도 로그 저장 확인

---

### 작업 3: 활동 로그 Middleware 구현 (3시간)

**목표**: 주요 사용자 액션을 자동으로 로깅하는 middleware 구현

#### 3.1 활동 로그 함수 작성

**파일**: `backend/middleware/activity_logger.py`

**핵심 기능**:
- `log_activity(action_type, action_detail=None)` 함수
- Flask `g` 객체에서 academy_id, user_id 추출
- `activity_logs` 테이블에 저장
- IP, User-Agent 자동 수집

**참고**: 기획서 섹션 6.2.1에 전체 코드 있음 (복사 가능)

#### 3.2 주요 엔드포인트에 로그 추가

**적용 대상** (최소 5개):
- `/api/auth/login` → `log_activity('login')`
- `/api/reports` (POST) → `log_activity('create_report', {'report_id': X, 'ai_generated': True})`
- `/api/reports/share` → `log_activity('share_kakaotalk', {'report_id': X})`
- `/api/students` (POST) → `log_activity('create_student', {'student_id': X})`
- `/api/attendance/check-in` → `log_activity('check_in', {'student_id': X})`

**예시**:
```python
@app.route('/api/reports', methods=['POST'])
@login_required
def create_report():
    # ... 리포트 생성 로직 ...
    
    log_activity('create_report', {
        'report_id': report_id,
        'student_id': student_id,
        'ai_generated': True
    })
    
    return jsonify({'success': True, 'report_id': report_id})
```

**완료 조건**:
- [ ] `activity_logger.py` 작성 완료
- [ ] 최소 5개 주요 엔드포인트에 로그 추가
- [ ] 로그인 시 `activity_logs` 테이블에 데이터 저장 확인
- [ ] action_detail JSON 형식 확인

---

### 작업 4: 시스템 헬스체크 Cron Job 구현 (2시간)

**목표**: 5분마다 시스템 상태 수집 + Critical Alert 체크

#### 4.1 헬스체크 스크립트 작성

**파일**: `backend/scripts/health_check.py`

**핵심 기능**:
- `psutil` 라이브러리 사용 (CPU, RAM, Disk 측정)
- `system_health_logs` 테이블에 저장
- Critical Alert 체크 (임계값은 `config/alert_thresholds.py` 참조)
- Alert 발생 시 `alert_deduplicator` 사용하여 중복 방지
- Alert 발생 시 `telegram_notifier` 사용하여 텔레그램 알림

**참고**: 기획서 섹션 9.5.1 참고

**스크립트 구조**:
```python
#!/usr/bin/env python3
import psutil
import sys
sys.path.append('/home/tutornote/backend')

from config.alert_thresholds import get_threshold, get_cooldown
from utils.alert_deduplicator import alert_deduplicator
from utils.telegram_notifier import telegram_notifier
from db import get_db_connection

def collect_system_metrics():
    """시스템 메트릭 수집 및 저장"""
    cpu_usage = psutil.cpu_percent(interval=1)
    ram_usage = psutil.virtual_memory().percent
    disk_usage = psutil.disk_usage('/').percent
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO system_health_logs (cpu_usage, ram_usage, disk_usage)
        VALUES (%s, %s, %s)
    """, (cpu_usage, ram_usage, disk_usage))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return cpu_usage, ram_usage, disk_usage

def check_critical_alerts(cpu, ram, disk):
    """Critical Alert 체크 및 텔레그램 알림"""
    cpu_critical = get_threshold('system', 'cpu', 'critical')
    ram_critical = get_threshold('system', 'ram', 'critical')
    disk_critical = get_threshold('system', 'disk', 'critical')
    
    # CPU Critical
    if cpu > cpu_critical:
        alert_key = f"cpu_critical_{cpu:.1f}"
        cooldown = get_cooldown('cpu_critical')
        
        if alert_deduplicator.should_send_alert(alert_key, cooldown):
            telegram_notifier.send_critical_alert({
                'severity': 'critical',
                'title': f'CPU 사용률 위험: {cpu}%',
                'description': f'현재 CPU 사용률이 {cpu}%로 매우 높습니다.',
                'action': 'Backend 재시작 또는 프로세스 확인이 필요합니다.'
            })
    
    # RAM, Disk도 동일하게 구현
    # ...

if __name__ == '__main__':
    cpu, ram, disk = collect_system_metrics()
    check_critical_alerts(cpu, ram, disk)
    print(f"✅ Health Check Complete: CPU {cpu}%, RAM {ram}%, Disk {disk}%")
```

#### 4.2 Crontab 설정

**파일**: `backend/scripts/setup_cron.sh`

```bash
#!/bin/bash
# Crontab 설정 스크립트

echo "⏰ Crontab 설정 중..."

# 5분마다 헬스체크 실행
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/bin/python3 /home/tutornote/backend/scripts/health_check.py >> /home/tutornote/logs/health_check.log 2>&1") | crontab -

echo "✅ Crontab 설정 완료!"
echo ""
echo "현재 Crontab:"
crontab -l
```

**완료 조건**:
- [ ] `health_check.py` 작성 완료
- [ ] psutil 설치 (`pip install psutil --break-system-packages`)
- [ ] 스크립트 수동 실행 성공
- [ ] `system_health_logs`에 데이터 저장 확인
- [ ] Crontab 설정 완료
- [ ] (선택) CPU 90% 초과 시 텔레그램 알림 수신 확인

---

### 작업 5: Critical Alerts 섹션 UI 구현 (6시간)

**목표**: 대시보드 최상단에 Critical Alerts 섹션 추가

#### 5.1 Backend API 구현

**파일**: `backend/routes/admin/alerts.py`

**엔드포인트**: `GET /api/admin/dashboard/alerts`

**응답 형식**:
```json
{
  "alerts": [
    {
      "id": "cpu_critical_92_4",
      "severity": "critical",  // "critical" | "warning"
      "type": "cpu_usage",
      "title": "CPU 사용률 위험: 92.4%",
      "description": "현재 CPU 사용률이 92.4%로 매우 높습니다. 시스템 성능 저하 위험.",
      "action": "Backend 재시작 또는 프로세스 확인이 필요합니다.",
      "value": 92.4,
      "threshold": 90,
      "created_at": "2026-01-05 14:30:15"
    },
    {
      "id": "backend_restart_102",
      "severity": "critical",
      "type": "backend_restart",
      "title": "Backend 재시작 빈도 이상: 102회",
      "description": "최근 24시간 동안 Backend가 102회 재시작되었습니다.",
      "action": "에러 로그 확인 및 안정성 점검이 필요합니다.",
      "value": 102,
      "threshold": 100,
      "created_at": "2026-01-05 14:25:00"
    }
  ],
  "total_count": 2
}
```

**Alert 체크 로직**:
```python
from config.alert_thresholds import get_threshold
from datetime import datetime, timedelta

def get_current_alerts():
    """현재 Critical/Warning Alert 목록 조회"""
    alerts = []
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. CPU Alert 체크 (최근 5분 평균)
    cursor.execute("""
        SELECT AVG(cpu_usage) as avg_cpu
        FROM system_health_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    """)
    result = cursor.fetchone()
    avg_cpu = result['avg_cpu'] if result else 0
    
    cpu_critical = get_threshold('system', 'cpu', 'critical')
    if avg_cpu > cpu_critical:
        alerts.append({
            'id': f"cpu_critical_{avg_cpu:.1f}",
            'severity': 'critical',
            'type': 'cpu_usage',
            'title': f'CPU 사용률 위험: {avg_cpu:.1f}%',
            'description': f'현재 CPU 사용률이 {avg_cpu:.1f}%로 매우 높습니다.',
            'action': 'Backend 재시작 또는 프로세스 확인이 필요합니다.',
            'value': avg_cpu,
            'threshold': cpu_critical,
            'created_at': datetime.now().isoformat()
        })
    
    # 2. Backend 재시작 횟수 체크
    # PM2 또는 로그 파일에서 재시작 횟수 집계
    # ...
    
    # 3. 무활동 학원 체크
    # ...
    
    cursor.close()
    conn.close()
    
    return alerts
```

#### 5.2 Frontend UI 컴포넌트

**파일**: `frontend/components/dashboard/CriticalAlerts.tsx`

**UI 요구사항**:
- 최상단 고정 (대시보드 맨 위)
- Alert 없으면 숨김 (또는 "✅ 모든 시스템 정상" 표시)
- Critical = 빨간색, Warning = 노란색
- 각 Alert에 "조치하기" 버튼 (예: Backend 재시작, 학원 상세 보기)

**컴포넌트 구조**:
```tsx
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  severity: 'critical' | 'warning';
  type: string;
  title: string;
  description: string;
  action: string;
  value: number;
  threshold: number;
  created_at: string;
}

export function CriticalAlerts() {
  const { data, error } = useSWR('/api/admin/dashboard/alerts', fetcher, {
    refreshInterval: 60000  // 1분마다 갱신
  });
  
  if (error) return <div>Alert 로딩 실패</div>;
  if (!data || data.alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">✅ 모든 시스템 정상</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6 space-y-3">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <AlertCircle className="w-6 h-6 text-red-600" />
        Critical Alerts ({data.total_count})
      </h2>
      
      {data.alerts.map((alert: Alert) => (
        <div 
          key={alert.id}
          className={`
            border-l-4 rounded-lg p-4
            ${alert.severity === 'critical' 
              ? 'bg-red-50 border-red-500' 
              : 'bg-yellow-50 border-yellow-500'}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {alert.severity === 'critical' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
                <h3 className={`font-bold ${
                  alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {alert.title}
                </h3>
              </div>
              <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
              <p className="text-xs text-gray-600">
                📌 <strong>권장 조치:</strong> {alert.action}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ⏰ {new Date(alert.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            
            <button className={`
              px-4 py-2 rounded text-sm font-medium
              ${alert.severity === 'critical'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'}
            `}>
              조치하기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**완료 조건**:
- [ ] Backend API 엔드포인트 구현 완료
- [ ] Alert 체크 로직 (CPU, Backend 재시작 최소 2개) 구현
- [ ] Frontend 컴포넌트 작성 완료
- [ ] 대시보드 최상단에 배치 확인
- [ ] Alert 없을 때 "모든 시스템 정상" 표시 확인
- [ ] CPU > 90% 시 빨간색 Alert 표시 확인

---

### 작업 6: Alert Rule 로직 구현 (4시간)

**목표**: Alert 체크 규칙을 모듈화하여 재사용 가능하게 구현

#### 6.1 Alert Checker 유틸리티

**파일**: `backend/utils/alert_checker.py`

**핵심 기능**:
- 각 Alert 타입별로 체크 함수 작성
- `check_all_alerts()` 함수로 모든 Alert 한번에 체크
- 임계값은 `config/alert_thresholds.py`에서 가져옴

**Alert 타입** (최소 4개 구현):
1. **CPU 사용률** (`check_cpu_alert`)
2. **RAM 사용률** (`check_ram_alert`)
3. **Disk 사용률** (`check_disk_alert`)
4. **Backend 재시작 빈도** (`check_backend_restart_alert`)
5. **무활동 학원** (`check_inactive_academy_alert`)
6. **학부모 열람률 저조** (`check_parent_view_rate_alert`)

**구현 예시**:
```python
from config.alert_thresholds import get_threshold
from datetime import datetime, timedelta
from db import get_db_connection

def check_cpu_alert():
    """CPU 사용률 Alert 체크"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 최근 5분 평균
    cursor.execute("""
        SELECT AVG(cpu_usage) as avg_cpu
        FROM system_health_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    """)
    result = cursor.fetchone()
    avg_cpu = result['avg_cpu'] if result else 0
    
    cursor.close()
    conn.close()
    
    cpu_warning = get_threshold('system', 'cpu', 'warning')
    cpu_critical = get_threshold('system', 'cpu', 'critical')
    
    if avg_cpu > cpu_critical:
        return {
            'severity': 'critical',
            'type': 'cpu_usage',
            'value': avg_cpu,
            'threshold': cpu_critical
        }
    elif avg_cpu > cpu_warning:
        return {
            'severity': 'warning',
            'type': 'cpu_usage',
            'value': avg_cpu,
            'threshold': cpu_warning
        }
    
    return None

def check_backend_restart_alert():
    """Backend 재시작 빈도 Alert 체크"""
    # PM2 로그 파일 또는 system_health_logs에서 재시작 횟수 집계
    # 24시간 내 100회 초과 시 Critical
    
    restart_count = get_backend_restart_count_24h()  # 구현 필요
    threshold = get_threshold('system', 'backend_restart', 'critical')
    
    if restart_count > threshold:
        return {
            'severity': 'critical',
            'type': 'backend_restart',
            'value': restart_count,
            'threshold': threshold
        }
    
    return None

def check_inactive_academy_alert():
    """무활동 학원 Alert 체크"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    inactive_days_critical = get_threshold('business', 'inactive_days', 'critical')
    
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM academies a
        LEFT JOIN activity_logs al ON a.id = al.academy_id
        WHERE al.created_at IS NULL 
           OR al.created_at < DATE_SUB(NOW(), INTERVAL %s DAY)
    """, (inactive_days_critical,))
    
    result = cursor.fetchone()
    inactive_count = result['count'] if result else 0
    
    cursor.close()
    conn.close()
    
    if inactive_count > 0:
        return {
            'severity': 'critical',
            'type': 'inactive_academy',
            'value': inactive_count,
            'threshold': inactive_days_critical
        }
    
    return None

def check_all_alerts():
    """모든 Alert 체크"""
    alerts = []
    
    # 각 Alert 체크 함수 실행
    cpu_alert = check_cpu_alert()
    if cpu_alert:
        alerts.append(cpu_alert)
    
    ram_alert = check_ram_alert()
    if ram_alert:
        alerts.append(ram_alert)
    
    disk_alert = check_disk_alert()
    if disk_alert:
        alerts.append(disk_alert)
    
    backend_restart_alert = check_backend_restart_alert()
    if backend_restart_alert:
        alerts.append(backend_restart_alert)
    
    inactive_academy_alert = check_inactive_academy_alert()
    if inactive_academy_alert:
        alerts.append(inactive_academy_alert)
    
    return alerts
```

#### 6.2 API 엔드포인트 수정

**파일**: `backend/routes/admin/alerts.py`

```python
from utils.alert_checker import check_all_alerts

@app.route('/api/admin/dashboard/alerts', methods=['GET'])
@admin_required
def get_alerts():
    """Critical Alerts 조회"""
    alerts_data = check_all_alerts()
    
    # Alert 메시지 포맷팅
    formatted_alerts = []
    for alert in alerts_data:
        formatted_alerts.append(format_alert_message(alert))
    
    return jsonify({
        'alerts': formatted_alerts,
        'total_count': len(formatted_alerts)
    })

def format_alert_message(alert):
    """Alert 데이터를 UI용 메시지로 변환"""
    type_messages = {
        'cpu_usage': {
            'title': f"CPU 사용률 {alert['severity'].upper()}: {alert['value']:.1f}%",
            'description': f"현재 CPU 사용률이 {alert['value']:.1f}%입니다.",
            'action': "Backend 재시작 또는 프로세스 확인이 필요합니다."
        },
        # 다른 타입도 추가...
    }
    
    msg = type_messages.get(alert['type'], {})
    
    return {
        'id': f"{alert['type']}_{alert['value']:.1f}",
        'severity': alert['severity'],
        'type': alert['type'],
        'title': msg.get('title', '알 수 없는 Alert'),
        'description': msg.get('description', ''),
        'action': msg.get('action', '확인이 필요합니다.'),
        'value': alert['value'],
        'threshold': alert['threshold'],
        'created_at': datetime.now().isoformat()
    }
```

**완료 조건**:
- [ ] `alert_checker.py` 작성 완료
- [ ] 최소 4개 Alert 타입 구현 (CPU, RAM, Disk, Backend 재시작)
- [ ] `check_all_alerts()` 함수 정상 동작
- [ ] API 엔드포인트에서 Alert 목록 반환 확인

---

### 작업 7: 기존 "인사이트 지표" 메뉴 숨김 처리 (1시간)

**목표**: Phase 2 완료 전까지 임시로 "인사이트 지표" 메뉴 숨김

#### 7.1 Frontend 사이드바 수정

**파일**: `frontend/components/layout/AdminLayout.tsx` (또는 사이드바 컴포넌트)

**수정 방법**:
```tsx
// ❌ 수정 전
const menuItems = [
  { label: '대시보드', href: '/dashboard', icon: Home },
  { label: '인사이트 지표', href: '/metrics', icon: BarChart },  // 제거 대상
  { label: '학원 관리', href: '/academies', icon: School },
  { label: '시스템', href: '/system', icon: Settings },
];

// ✅ 수정 후 (임시 숨김)
const menuItems = [
  { label: '대시보드', href: '/dashboard', icon: Home },
  // { label: '인사이트 지표', href: '/metrics', icon: BarChart },  // Phase 2 완료 시 제거
  { label: '학원 관리', href: '/academies', icon: School },
  { label: '법무 관리', href: '/legal', icon: Shield },
  { label: '시스템', href: '/system', icon: Settings },
];
```

**또는 조건부 렌더링**:
```tsx
const ENABLE_METRICS_PAGE = false;  // Phase 2 완료 시 true 또는 제거

const menuItems = [
  { label: '대시보드', href: '/dashboard', icon: Home },
  ...(ENABLE_METRICS_PAGE ? [{ label: '인사이트 지표', href: '/metrics', icon: BarChart }] : []),
  { label: '학원 관리', href: '/academies', icon: School },
];
```

#### 7.2 "/metrics" 페이지 접근 제한 (선택적)

**파일**: `frontend/pages/metrics/index.tsx`

```tsx
// 페이지 접근 시 대시보드로 리다이렉트
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MetricsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Phase 2 완료 전까지 대시보드로 리다이렉트
    router.replace('/dashboard');
  }, []);
  
  return null;
}
```

**완료 조건**:
- [ ] 사이드바에서 "인사이트 지표" 메뉴 제거 또는 주석 처리
- [ ] (선택) `/metrics` 페이지 접근 시 리다이렉트
- [ ] 다른 메뉴들은 정상 동작 확인

---

## 📁 예상 파일 구조

Phase 1 완료 후 다음 파일들이 생성/수정됩니다:

```
backend/
├── migrations/
│   ├── 001_create_tracking_tables.sql      # ✅ 작업 1
│   ├── 002_alter_progress_records.sql      # ✅ 작업 1
│   └── run_migrations.sh                    # ✅ 작업 1
├── utils/
│   ├── claude_api_tracker.py                # ✅ 작업 2
│   ├── alert_checker.py                     # ✅ 작업 6
│   ├── alert_deduplicator.py                # (Pre-work)
│   └── telegram_notifier.py                 # (기존)
├── middleware/
│   └── activity_logger.py                   # ✅ 작업 3
├── routes/admin/
│   └── alerts.py                            # ✅ 작업 5
├── scripts/
│   ├── health_check.py                      # ✅ 작업 4
│   └── setup_cron.sh                        # ✅ 작업 4
└── config/
    └── alert_thresholds.py                  # (Pre-work)

frontend/
├── components/dashboard/
│   └── CriticalAlerts.tsx                   # ✅ 작업 5
└── components/layout/
    └── AdminLayout.tsx                      # ✅ 작업 7 (수정)
```

---

## 🧪 완료 조건 (Definition of Done)

Phase 1 완료 시 아래 모든 조건을 만족해야 합니다:

### 필수 조건

#### 1. DB 스키마
- [ ] 5개 신규 테이블 생성 완료
  - [ ] `activity_logs`
  - [ ] `report_views`
  - [ ] `api_usage_logs`
  - [ ] `operational_costs`
  - [ ] `system_health_logs`
  - [ ] `api_health_checks`
- [ ] `progress_records` 테이블 4개 컬럼 추가
- [ ] 마이그레이션 스크립트 실행 성공
- [ ] DB 백업 파일 존재

#### 2. 데이터 수집
- [ ] Claude API 사용량 추적 정상 동작
  - [ ] 리포트 생성 시 `api_usage_logs`에 데이터 저장 확인
  - [ ] 토큰 사용량 (input, output) 정확히 기록
  - [ ] 비용 계산 정확성 확인
- [ ] 활동 로그 추적 정상 동작
  - [ ] 로그인 시 `activity_logs`에 데이터 저장 확인
  - [ ] 리포트 생성 시 로그 저장 확인
  - [ ] action_detail JSON 형식 확인

#### 3. 시스템 헬스체크
- [ ] `health_check.py` 스크립트 정상 실행
- [ ] `system_health_logs`에 데이터 저장 확인
- [ ] Crontab 설정 완료 (5분마다 실행)
- [ ] (선택) CPU > 90% 시 텔레그램 알림 수신

#### 4. Critical Alerts
- [ ] Backend API 엔드포인트 정상 동작
  - [ ] `GET /api/admin/dashboard/alerts` 응답 확인
  - [ ] Alert 없을 때 빈 배열 반환
  - [ ] Alert 있을 때 정확한 데이터 반환
- [ ] Frontend UI 정상 표시
  - [ ] 대시보드 최상단에 배치
  - [ ] Alert 없을 때 "모든 시스템 정상" 표시
  - [ ] Critical Alert (빨간색) 정상 표시
  - [ ] Warning Alert (노란색) 정상 표시

#### 5. 메뉴 정리
- [ ] "인사이트 지표" 메뉴 숨김 처리 완료
- [ ] 다른 메뉴들은 정상 동작 확인

### 통합 테스트

#### 시나리오 1: 리포트 생성 플로우
```
1. 학원 원장으로 로그인
2. 새 리포트 생성
3. 확인:
   - activity_logs에 'login' 로그 저장됨
   - activity_logs에 'create_report' 로그 저장됨
   - api_usage_logs에 Claude API 사용 로그 저장됨
   - progress_records에 ai_generated=1로 저장됨
```

#### 시나리오 2: Critical Alert 표시
```
1. health_check.py 스크립트 수동 실행 (CPU 시뮬레이션)
2. Master Admin 대시보드 접속
3. 확인:
   - Critical Alerts 섹션에 CPU Alert 표시됨
   - 빨간색 배경, AlertCircle 아이콘 표시
   - "조치하기" 버튼 표시
```

#### 시나리오 3: 데이터 정합성
```
1. Master Admin 대시보드에서 "Claude API 사용량" 확인
2. api_usage_logs 테이블 직접 조회
3. 확인:
   - 대시보드 표시 값과 DB 실제 값 일치
   - 비용 계산 정확성 확인 (Input $3/1M, Output $15/1M)
```

---

## 🚨 주의사항

### 1. 기존 코드 영향 최소화

- 기존 동작 중인 기능을 절대 건드리지 마세요
- Claude API 래퍼 함수 추가 시 기존 호출 코드만 수정
- 활동 로그는 에러 발생 시에도 메인 로직에 영향 없도록 try-catch

### 2. 데이터 백업

- 마이그레이션 실행 전 **반드시 DB 백업**
- 백업 파일명: `backup_before_phase1_YYYYMMDD_HHMMSS.sql`

### 3. 성능 고려

- `activity_logs` 테이블은 빠르게 커질 수 있음 → INDEX 필수
- `system_health_logs`는 5분마다 쌓임 → 추후 파티셔닝 고려
- Alert 체크 로직은 최대한 가볍게 (복잡한 JOIN 회피)

### 4. Alert 중복 방지

- Pre-work에서 만든 `alert_deduplicator` 반드시 사용
- 같은 Alert가 5분마다 발송되지 않도록 주의

---

## 📝 구현 가이드

### Step 1: 기획서 읽기 (30분)

```bash
# 작업 디렉토리로 이동
cd /home/tutornote

# 기획서 섹션 6, 8.1 집중 읽기
cat DASHBOARD_REDESIGN_SPEC.md | grep -A 500 "## 6. 데이터 수집"
cat DASHBOARD_REDESIGN_SPEC.md | grep -A 200 "### 8.1 Phase 1"
```

### Step 2: 작업 1 - DB 스키마 생성 (3시간)

```bash
# 1. 마이그레이션 디렉토리 생성
mkdir -p backend/migrations

# 2. 기획서에서 SQL 복사하여 파일 생성
# 001_create_tracking_tables.sql
# 002_alter_progress_records.sql

# 3. DB 백업
mysqldump -u root -p tutornote > backup_before_phase1_$(date +%Y%m%d_%H%M%S).sql

# 4. 마이그레이션 실행
mysql -u root -p tutornote < backend/migrations/001_create_tracking_tables.sql
mysql -u root -p tutornote < backend/migrations/002_alter_progress_records.sql

# 5. 테이블 확인
mysql -u root -p tutornote -e "SHOW TABLES;"
mysql -u root -p tutornote -e "DESCRIBE activity_logs;"
```

### Step 3: 작업 2 - Claude API 추적 (4시간)

```bash
# 1. claude_api_tracker.py 작성 (기획서 복사)
vi backend/utils/claude_api_tracker.py

# 2. 기존 코드에서 Claude API 호출 부분 찾기
grep -r "anthropic.Anthropic" backend/

# 3. 기존 코드 수정 (import 변경)
# from anthropic import Anthropic
# → from utils.claude_api_tracker import generate_feedback_with_tracking

# 4. 테스트
python3 backend/test_claude_api_tracker.py
```

### Step 4: 작업 3 - 활동 로그 (3시간)

```bash
# 1. activity_logger.py 작성 (기획서 복사)
mkdir -p backend/middleware
vi backend/middleware/activity_logger.py

# 2. 주요 엔드포인트에 로그 추가
# /api/auth/login, /api/reports, /api/students 등

# 3. 테스트 (로그인 해보기)
curl -X POST http://localhost:3003/api/auth/login -d '{...}'

# 4. DB 확인
mysql -u root -p tutornote -e "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;"
```

### Step 5: 작업 4 - 헬스체크 Cron (2시간)

```bash
# 1. psutil 설치
pip install psutil --break-system-packages

# 2. health_check.py 작성
vi backend/scripts/health_check.py

# 3. 스크립트 실행 권한
chmod +x backend/scripts/health_check.py

# 4. 수동 실행 테스트
python3 backend/scripts/health_check.py

# 5. Crontab 설정
crontab -e
# */5 * * * * /usr/bin/python3 /home/tutornote/backend/scripts/health_check.py
```

### Step 6: 작업 5 - Critical Alerts UI (6시간)

```bash
# 1. Backend API 구현
mkdir -p backend/routes/admin
vi backend/routes/admin/alerts.py

# 2. Frontend 컴포넌트 작성
mkdir -p frontend/components/dashboard
vi frontend/components/dashboard/CriticalAlerts.tsx

# 3. 대시보드에 컴포넌트 추가
vi frontend/pages/dashboard/index.tsx

# 4. 테스트 (브라우저)
# http://localhost:3001/dashboard
```

### Step 7: 작업 6 - Alert Rule 로직 (4시간)

```bash
# 1. alert_checker.py 작성
vi backend/utils/alert_checker.py

# 2. 각 Alert 타입별 체크 함수 구현
# check_cpu_alert(), check_ram_alert() 등

# 3. check_all_alerts() 함수 구현

# 4. 테스트
python3 backend/test_alert_checker.py
```

### Step 8: 작업 7 - 메뉴 숨김 (1시간)

```bash
# 1. 사이드바 컴포넌트 수정
vi frontend/components/layout/AdminLayout.tsx

# 2. "인사이트 지표" 메뉴 주석 처리 또는 제거

# 3. 브라우저 확인
# 사이드바에 "인사이트 지표" 메뉴가 안 보이는지 확인
```

### Step 9: 통합 테스트 (2시간)

```bash
# 1. 전체 플로우 테스트
# - 로그인
# - 리포트 생성
# - 대시보드 확인

# 2. 데이터 정합성 확인
mysql -u root -p tutornote -e "SELECT COUNT(*) FROM activity_logs;"
mysql -u root -p tutornote -e "SELECT COUNT(*) FROM api_usage_logs;"
mysql -u root -p tutornote -e "SELECT * FROM system_health_logs ORDER BY created_at DESC LIMIT 5;"

# 3. Critical Alerts 확인
curl http://localhost:3003/api/admin/dashboard/alerts
```

### Step 10: 완료 보고 (텔레그램 알림)

```python
# 완료 보고 스크립트 실행
from utils.deployment_notifier import deployment_notifier

deployment_notifier.notify_phase_complete(
    "Phase 1: 긴급 수정",
    [
        "DB 스키마 5개 테이블 생성 ✅",
        "progress_records 테이블 4개 컬럼 추가 ✅",
        "Claude API 사용량 추적 로직 구현 ✅",
        "활동 로그 middleware 구현 ✅",
        "시스템 헬스체크 Cron 설정 ✅",
        "Critical Alerts UI 구현 ✅",
        "Alert Rule 로직 구현 ✅",
        "인사이트 지표 메뉴 숨김 처리 ✅"
    ]
)
```

---

## ✅ 최종 체크리스트

Phase 1 구현 완료 후 아래 모든 항목을 확인해주세요:

### DB 스키마
- [ ] `activity_logs` 테이블 생성
- [ ] `report_views` 테이블 생성
- [ ] `api_usage_logs` 테이블 생성
- [ ] `operational_costs` 테이블 생성
- [ ] `system_health_logs` 테이블 생성
- [ ] `api_health_checks` 테이블 생성
- [ ] `progress_records` 테이블 컬럼 추가 (4개)
- [ ] DB 백업 파일 존재

### 데이터 수집
- [ ] `claude_api_tracker.py` 구현 완료
- [ ] 기존 Claude API 호출 코드 수정 완료
- [ ] 리포트 생성 시 `api_usage_logs`에 저장 확인
- [ ] `activity_logger.py` 구현 완료
- [ ] 5개 주요 엔드포인트에 로그 추가
- [ ] 로그인 시 `activity_logs`에 저장 확인

### 헬스체크
- [ ] `health_check.py` 스크립트 작성 완료
- [ ] psutil 설치 완료
- [ ] 스크립트 수동 실행 성공
- [ ] `system_health_logs`에 데이터 저장 확인
- [ ] Crontab 설정 완료 (5분마다)

### Critical Alerts
- [ ] `alerts.py` Backend API 구현 완료
- [ ] `alert_checker.py` 구현 완료 (4개 이상 Alert 타입)
- [ ] `CriticalAlerts.tsx` Frontend 컴포넌트 구현 완료
- [ ] 대시보드 최상단 배치 확인
- [ ] Alert 없을 때 "모든 시스템 정상" 표시
- [ ] CPU > 90% 시 빨간색 Alert 표시

### 메뉴 정리
- [ ] "인사이트 지표" 메뉴 숨김 처리 완료
- [ ] 다른 메뉴 정상 동작 확인

### 통합 테스트
- [ ] 리포트 생성 플로우 정상
- [ ] Claude API 사용량 기록 정상
- [ ] 활동 로그 기록 정상
- [ ] Critical Alerts 표시 정상
- [ ] 데이터 정합성 확인 완료

### 완료 보고
- [ ] 텔레그램으로 "Phase 1 완료" 알림 발송

**모든 체크리스트 완료 시 → Staging 배포 또는 Phase 2 시작 가능!** 🚀

---

## 💬 질문/이슈 발생 시

1. **기획서 내용 불명확**: 기획서 해당 섹션 다시 읽기 (`DASHBOARD_REDESIGN_SPEC.md`)
2. **SQL 에러**: 마이그레이션 파일 확인, 외래키 제약 조건 확인
3. **Import 에러**: `sys.path`에 `backend/` 디렉토리 추가
4. **Cron 실행 안됨**: 절대 경로 사용, 로그 파일 확인
5. **Alert 표시 안됨**: Backend API 응답 확인, Frontend 콘솔 에러 확인

---

**구현 시작 시간**: (기록용)  
**구현 완료 예상 시간**: 26시간 (약 3-4일)  
**실제 완료 시간**: (기록용)

**Phase 1 화이팅! 🚀**
