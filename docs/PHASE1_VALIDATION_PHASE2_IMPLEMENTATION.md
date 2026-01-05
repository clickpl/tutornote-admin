# TutorNote Master Admin - Phase 1 검증 & Phase 2 구현

## 🎯 전체 개요

이 프롬프트는 2개 파트로 구성됩니다:

**Part 1: Phase 1 검증** (3시간)
- Phase 1 구현 완료 후 통합 테스트
- 데이터 정합성 확인
- 버그 수정

**Part 2: Phase 2 구현** (69시간, 9일)
- 12개 핵심 지표 카드 구현
- 3개 테이블 섹션 구현
- 빠른 액션 버튼 4개
- 통합 테스트

---

# 📦 PART 1: Phase 1 검증 (3시간)

## 🎯 목표

Phase 1에서 구현한 기능들이 실제로 정상 동작하는지 검증하고 버그를 수정합니다.

---

## ✅ 검증 작업 목록

### 작업 1.1: DB 스키마 검증 (30분)

**목표**: 6개 테이블이 정확히 생성되었는지 확인

#### 1.1.1 테이블 존재 확인

```bash
mysql -u root -p tutornote << EOF
-- 신규 테이블 확인
SHOW TABLES LIKE '%logs%';
SHOW TABLES LIKE '%report_views%';
SHOW TABLES LIKE '%operational_costs%';

-- 각 테이블 구조 확인
DESCRIBE activity_logs;
DESCRIBE report_views;
DESCRIBE api_usage_logs;
DESCRIBE operational_costs;
DESCRIBE system_health_logs;
DESCRIBE api_health_checks;

-- progress_records 컬럼 추가 확인
DESCRIBE progress_records;
EOF
```

**확인 항목**:
- [ ] 6개 테이블 모두 존재
- [ ] `progress_records`에 4개 컬럼 추가 확인
  - `ai_generated`
  - `generation_time_seconds`
  - `edit_count`
  - `card_news_generated`
- [ ] INDEX가 정확히 생성되었는지 확인

#### 1.1.2 샘플 데이터 삽입 테스트

```bash
# 테스트 스크립트 작성
cat > /home/tutornote/backend/test_db_schema.py << 'EOF'
#!/usr/bin/env python3
import sys
sys.path.append('/home/tutornote/backend')

from db import get_db_connection
from datetime import datetime

def test_insert_all_tables():
    """모든 테이블에 샘플 데이터 삽입 테스트"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. activity_logs
        cursor.execute("""
            INSERT INTO activity_logs (academy_id, action_type, action_detail)
            VALUES (1, 'test_action', '{"test": true}')
        """)
        print("✅ activity_logs 삽입 성공")
        
        # 2. report_views (report_id가 있다고 가정)
        cursor.execute("""
            INSERT INTO report_views (report_id, share_token, viewer_type)
            VALUES (1, 'test_token', 'parent')
        """)
        print("✅ report_views 삽입 성공")
        
        # 3. api_usage_logs
        cursor.execute("""
            INSERT INTO api_usage_logs (api_name, academy_id, request_tokens, response_tokens, total_cost)
            VALUES ('claude', 1, 100, 200, 0.0045)
        """)
        print("✅ api_usage_logs 삽입 성공")
        
        # 4. operational_costs
        cursor.execute("""
            INSERT INTO operational_costs (cost_type, amount, billing_month)
            VALUES ('claude_api', 14200, DATE_FORMAT(NOW(), '%Y-%m-01'))
        """)
        print("✅ operational_costs 삽입 성공")
        
        # 5. system_health_logs
        cursor.execute("""
            INSERT INTO system_health_logs (cpu_usage, ram_usage, disk_usage)
            VALUES (45.2, 60.1, 75.8)
        """)
        print("✅ system_health_logs 삽입 성공")
        
        # 6. api_health_checks
        cursor.execute("""
            INSERT INTO api_health_checks (api_name, status, response_time_ms)
            VALUES ('claude', 'success', 120)
        """)
        print("✅ api_health_checks 삽입 성공")
        
        conn.commit()
        print("\n🎉 모든 테이블 삽입 테스트 통과!")
        
        # 삽입된 데이터 확인
        cursor.execute("SELECT COUNT(*) FROM activity_logs WHERE action_type = 'test_action'")
        count = cursor.fetchone()[0]
        print(f"activity_logs 테스트 데이터: {count}건")
        
    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    test_insert_all_tables()
EOF

chmod +x /home/tutornote/backend/test_db_schema.py
python3 /home/tutornote/backend/test_db_schema.py
```

**완료 조건**:
- [ ] 모든 테이블에 데이터 삽입 성공
- [ ] 외래키 제약 조건 정상 동작
- [ ] INDEX 정상 동작 (쿼리 성능 확인)

---

### 작업 1.2: Claude API 추적 검증 (30분)

**목표**: Claude API 호출 시 사용량이 정확히 로깅되는지 확인

#### 1.2.1 리포트 생성 테스트

```bash
# TutorNote 앱에서 리포트 생성
# 1. 로그인
# 2. 학생 선택
# 3. 리포트 생성 (AI 피드백 사용)
```

#### 1.2.2 API 로그 확인

```sql
-- 가장 최근 Claude API 사용 로그 확인
SELECT 
  api_name,
  academy_id,
  request_tokens,
  response_tokens,
  total_cost,
  response_time_ms,
  status,
  created_at
FROM api_usage_logs
WHERE api_name = 'claude'
ORDER BY created_at DESC
LIMIT 5;

-- 오늘 총 사용량 집계
SELECT 
  COUNT(*) as total_calls,
  SUM(request_tokens) as total_input_tokens,
  SUM(response_tokens) as total_output_tokens,
  SUM(total_cost) as total_cost
FROM api_usage_logs
WHERE api_name = 'claude'
AND DATE(created_at) = CURDATE();
```

#### 1.2.3 비용 계산 정확성 검증

```python
# backend/test_claude_cost_calculation.py
#!/usr/bin/env python3
import sys
sys.path.append('/home/tutornote/backend')

from db import get_db_connection
from decimal import Decimal

def verify_cost_calculation():
    """Claude API 비용 계산 정확성 검증"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            request_tokens,
            response_tokens,
            total_cost
        FROM api_usage_logs
        WHERE api_name = 'claude'
        ORDER BY created_at DESC
        LIMIT 10
    """)
    
    results = cursor.fetchall()
    
    print("🔍 Claude API 비용 계산 검증\n")
    
    for i, row in enumerate(results, 1):
        input_tokens = row['request_tokens']
        output_tokens = row['response_tokens']
        logged_cost = Decimal(str(row['total_cost']))
        
        # 예상 비용 계산
        # Input: $3 per 1M tokens, Output: $15 per 1M tokens
        expected_input_cost = Decimal(input_tokens) * Decimal('3') / Decimal('1000000')
        expected_output_cost = Decimal(output_tokens) * Decimal('15') / Decimal('1000000')
        expected_total = expected_input_cost + expected_output_cost
        
        # 오차 허용 범위 (1%)
        diff = abs(logged_cost - expected_total)
        diff_percent = (diff / expected_total * 100) if expected_total > 0 else 0
        
        status = "✅" if diff_percent < 1 else "❌"
        
        print(f"{status} 로그 #{i}")
        print(f"   Input: {input_tokens} tokens → ${expected_input_cost:.6f}")
        print(f"   Output: {output_tokens} tokens → ${expected_output_cost:.6f}")
        print(f"   예상 비용: ${expected_total:.6f}")
        print(f"   기록 비용: ${logged_cost:.6f}")
        print(f"   오차: {diff_percent:.2f}%\n")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    verify_cost_calculation()
```

**완료 조건**:
- [ ] 리포트 생성 시 `api_usage_logs`에 데이터 저장됨
- [ ] 토큰 사용량 (input, output) 정확히 기록
- [ ] 비용 계산 오차 < 1%
- [ ] 에러 발생 시에도 로그 저장 확인

---

### 작업 1.3: 활동 로그 검증 (30분)

**목표**: 사용자 액션이 정확히 로깅되는지 확인

#### 1.3.1 주요 액션 테스트

```bash
# TutorNote 앱에서 다음 액션 수행:
# 1. 로그인
# 2. 리포트 생성
# 3. 카카오톡 공유
# 4. 학생 등록
# 5. 출석 체크인
```

#### 1.3.2 로그 확인

```sql
-- 최근 활동 로그 확인
SELECT 
  academy_id,
  action_type,
  action_detail,
  ip_address,
  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
FROM activity_logs
ORDER BY created_at DESC
LIMIT 20;

-- action_type별 집계
SELECT 
  action_type,
  COUNT(*) as count,
  COUNT(DISTINCT academy_id) as unique_academies
FROM activity_logs
WHERE DATE(created_at) = CURDATE()
GROUP BY action_type
ORDER BY count DESC;
```

#### 1.3.3 action_detail JSON 형식 검증

```python
# backend/test_activity_logs.py
#!/usr/bin/env python3
import sys
sys.path.append('/home/tutornote/backend')

import json
from db import get_db_connection

def verify_action_detail_json():
    """action_detail JSON 형식 검증"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT action_type, action_detail
        FROM activity_logs
        WHERE action_detail IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
    """)
    
    results = cursor.fetchall()
    
    print("🔍 action_detail JSON 검증\n")
    
    for row in results:
        action_type = row['action_type']
        action_detail = row['action_detail']
        
        try:
            parsed = json.loads(action_detail)
            print(f"✅ {action_type}: {json.dumps(parsed, indent=2)}")
        except json.JSONDecodeError as e:
            print(f"❌ {action_type}: JSON 파싱 실패 - {e}")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    verify_action_detail_json()
```

**완료 조건**:
- [ ] 5개 주요 액션 모두 로그 저장 확인
- [ ] `action_detail` JSON 형식 정확
- [ ] `academy_id`, `user_id` 올바르게 기록
- [ ] IP, User-Agent 정상 수집

---

### 작업 1.4: 시스템 헬스체크 검증 (30분)

**목표**: Cron Job이 5분마다 정상 실행되는지 확인

#### 1.4.1 Cron 설정 확인

```bash
# Crontab 확인
crontab -l | grep health_check

# 로그 파일 확인
tail -f /home/tutornote/logs/health_check.log

# 수동 실행 테스트
python3 /home/tutornote/backend/scripts/health_check.py
```

#### 1.4.2 헬스 로그 데이터 확인

```sql
-- 최근 10개 헬스체크 로그
SELECT 
  cpu_usage,
  ram_usage,
  disk_usage,
  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
FROM system_health_logs
ORDER BY created_at DESC
LIMIT 10;

-- 5분 간격으로 로그가 쌓이는지 확인
SELECT 
  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as minute,
  COUNT(*) as count
FROM system_health_logs
WHERE created_at >= NOW() - INTERVAL 1 HOUR
GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:%i')
ORDER BY minute DESC;
```

#### 1.4.3 Alert 체크 테스트

```bash
# CPU를 인위적으로 높여서 Alert 발생 테스트
# (선택적 - 프로덕션에서는 주의)

# 1. CPU 부하 생성 (테스트용)
yes > /dev/null &
PID=$!

# 2. 헬스체크 실행
python3 /home/tutornote/backend/scripts/health_check.py

# 3. Alert 발생 확인 (텔레그램 또는 로그)

# 4. CPU 부하 종료
kill $PID
```

**완료 조건**:
- [ ] Cron Job이 5분마다 자동 실행
- [ ] `system_health_logs`에 데이터 5분마다 쌓임
- [ ] CPU, RAM, Disk 값이 정확
- [ ] (선택) CPU > 90% 시 텔레그램 알림 수신

---

### 작업 1.5: Critical Alerts UI 검증 (30분)

**목표**: 대시보드에 Critical Alerts가 정상 표시되는지 확인

#### 1.5.1 Backend API 테스트

```bash
# API 직접 호출
curl http://localhost:3003/api/admin/dashboard/alerts | jq

# 예상 응답 형식
{
  "alerts": [
    {
      "id": "cpu_critical_92.4",
      "severity": "critical",
      "type": "cpu_usage",
      "title": "CPU 사용률 위험: 92.4%",
      "description": "...",
      "action": "...",
      "value": 92.4,
      "threshold": 90,
      "created_at": "2026-01-05T14:30:15Z"
    }
  ],
  "total_count": 1
}
```

#### 1.5.2 Frontend UI 확인

```bash
# Master Admin 대시보드 접속
# http://localhost:3001/dashboard

# 확인 항목:
# 1. Critical Alerts 섹션이 최상단에 표시되는가?
# 2. Alert 없을 때 "✅ 모든 시스템 정상" 표시되는가?
# 3. Critical Alert (빨간색) 정상 표시되는가?
# 4. Warning Alert (노란색) 정상 표시되는가?
# 5. "조치하기" 버튼이 있는가?
```

#### 1.5.3 Alert 규칙 테스트

```python
# backend/test_alert_rules.py
#!/usr/bin/env python3
import sys
sys.path.append('/home/tutornote/backend')

from utils.alert_checker import check_all_alerts

def test_alert_rules():
    """Alert 규칙 테스트"""
    print("🔍 Alert 규칙 테스트 시작...\n")
    
    alerts = check_all_alerts()
    
    print(f"발견된 Alert: {len(alerts)}개\n")
    
    for alert in alerts:
        print(f"📋 {alert['severity'].upper()}: {alert['type']}")
        print(f"   값: {alert['value']}, 임계값: {alert['threshold']}")
        print()
    
    if len(alerts) == 0:
        print("✅ 모든 시스템 정상 (Alert 없음)")
    else:
        print(f"⚠️ {len(alerts)}개의 Alert 발견")

if __name__ == '__main__':
    test_alert_rules()
```

**완료 조건**:
- [ ] Backend API 정상 응답
- [ ] Alert 없을 때 빈 배열 반환
- [ ] Alert 있을 때 정확한 데이터 반환
- [ ] Frontend에서 Alert 섹션 정상 표시
- [ ] Critical/Warning 색상 구분 정상
- [ ] "조치하기" 버튼 표시

---

### 작업 1.6: 통합 테스트 시나리오 (30분)

**목표**: 전체 플로우가 연결되어 정상 작동하는지 확인

#### 시나리오 1: 리포트 생성 풀 플로우

```
1. Master Admin에서 대시보드 확인
   → Critical Alerts 섹션 확인

2. TutorNote 앱 로그인
   → activity_logs에 'login' 기록 확인

3. 새 리포트 생성 (AI 사용)
   → activity_logs에 'create_report' 기록
   → api_usage_logs에 Claude API 사용 기록
   → progress_records에 ai_generated=1 저장

4. 카카오톡 공유
   → activity_logs에 'share_kakaotalk' 기록

5. Master Admin 대시보드 새로고침
   → 활동 로그 증가 확인
   → Claude API 사용량 증가 확인
```

#### 시나리오 2: Critical Alert 표시

```
1. health_check.py 스크립트 수동 실행
   → system_health_logs에 데이터 저장 확인

2. CPU 사용률 확인
   → 90% 이상이면 Critical Alert 발생

3. Master Admin 대시보드 접속
   → Critical Alerts 섹션에 CPU Alert 표시
   → 빨간색 배경, AlertCircle 아이콘 확인

4. (선택) 텔레그램 알림 수신 확인
```

#### 시나리오 3: 데이터 정합성

```
1. Master Admin 대시보드에서 "Claude API 사용량" 확인
   (현재는 표시 안됨 - Phase 2에서 구현 예정)

2. DB에서 직접 조회
   SELECT SUM(total_cost) FROM api_usage_logs
   WHERE api_name = 'claude'
   AND DATE(created_at) = CURDATE();

3. 값이 일치하는지 확인
```

**완료 조건**:
- [ ] 시나리오 1 전체 플로우 정상
- [ ] 시나리오 2 Alert 표시 정상
- [ ] 시나리오 3 데이터 정합성 확인
- [ ] 모든 로그가 정확히 기록됨

---

### 작업 1.7: 버그 수정 및 개선 (30분)

**목표**: 검증 과정에서 발견된 버그 수정

#### 발견될 가능성 높은 버그들

1. **외래키 에러**
   - `activity_logs.academy_id` → `academies.id`
   - 존재하지 않는 academy_id 입력 시 에러

2. **JSON 파싱 에러**
   - `action_detail` 필드에 잘못된 JSON 저장
   - Python dict를 JSON으로 변환 누락

3. **타임존 이슈**
   - `created_at` 필드가 UTC vs KST 혼용

4. **NULL 값 처리**
   - `academy_id`, `user_id`가 NULL일 때 에러

5. **INDEX 누락**
   - 쿼리 성능 저하

#### 버그 수정 프로세스

```bash
# 1. 버그 발견 시 로그 확인
tail -f /home/tutornote/logs/backend.log

# 2. 에러 메시지 분석

# 3. 코드 수정

# 4. 재테스트

# 5. Git commit
cd /home/tutornote
git add .
git commit -m "fix: Phase 1 버그 수정 - [버그 설명]"
```

**완료 조건**:
- [ ] 검증 과정에서 발견된 모든 버그 수정
- [ ] 재테스트 통과
- [ ] Git commit 완료

---

## 🎉 Phase 1 검증 완료 체크리스트

Phase 1 검증 완료 후 아래 모든 항목을 확인해주세요:

### DB 스키마
- [ ] 6개 테이블 모두 존재
- [ ] `progress_records` 4개 컬럼 추가 확인
- [ ] 모든 테이블에 데이터 삽입 테스트 통과

### 데이터 수집
- [ ] Claude API 사용량 정확히 로깅
- [ ] 비용 계산 오차 < 1%
- [ ] 활동 로그 5개 액션 모두 기록
- [ ] `action_detail` JSON 형식 정확

### 헬스체크
- [ ] Cron Job 5분마다 자동 실행
- [ ] `system_health_logs`에 데이터 쌓임
- [ ] CPU, RAM, Disk 값 정확

### Critical Alerts
- [ ] Backend API 정상 응답
- [ ] Frontend UI 정상 표시
- [ ] Alert 없을 때 "모든 시스템 정상" 표시
- [ ] Critical/Warning 색상 구분

### 통합 테스트
- [ ] 리포트 생성 풀 플로우 정상
- [ ] Critical Alert 표시 정상
- [ ] 데이터 정합성 확인 완료

### 버그 수정
- [ ] 발견된 모든 버그 수정 완료
- [ ] Git commit 완료

**✅ 모든 체크리스트 완료 시 → Phase 2 구현 시작!**

---

# 🚀 PART 2: Phase 2 구현 (69시간, 9일)

## 🎯 목표

**비즈니스 중심 지표 카드 구현 및 테이블 추가**

12개 핵심 지표 카드 (4x3 Grid) + 3개 테이블 섹션 + 4개 빠른 액션 버튼

---

## 📄 필수 참고 문서

구현 전 반드시 아래 기획서를 읽고 이해해야 합니다:

- **파일 경로**: `DASHBOARD_REDESIGN_SPEC.md` (이 프롬프트와 같은 디렉토리)
- **주요 섹션**:
  - **섹션 5.2**: 핵심 지표 카드 12개 상세 스펙 (SQL 쿼리 포함) ⭐
  - **섹션 5.3**: 테이블 섹션 3개 상세 스펙 ⭐
  - **섹션 6.2**: 데이터 수집 구현 (학부모 열람 추적 등) ⭐
  - **섹션 8.2**: Phase 2 전체 작업 목록 및 완료 기준

---

## ✅ Phase 2 작업 목록

### 작업 2.1: 학부모 열람 추적 구현 (Frontend + Backend) (3시간)

**목표**: 학부모가 리포트 공유 페이지를 열람할 때 추적

**참고**: Phase 1에서 `report_views` 테이블은 이미 생성됨

#### 2.1.1 Frontend 추적 코드 (TutorNote 앱)

**파일**: `tutornote-frontend/pages/share/[token].tsx`

```typescript
// 학부모 공유 페이지에 열람 추적 코드 추가

import { useEffect } from 'react';

export default function SharePage({ token }: { token: string }) {
  useEffect(() => {
    let startTime = Date.now();
    
    // 페이지 진입 기록
    const trackView = async () => {
      try {
        await fetch('/api/reports/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            share_token: token,
            viewer_type: 'parent'
          })
        });
      } catch (error) {
        console.error('열람 추적 실패:', error);
      }
    };
    
    trackView();
    
    // 페이지 이탈 시 체류 시간 기록
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      // Beacon API로 페이지 이탈 시에도 전송 보장
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/reports/track-duration',
          JSON.stringify({ share_token: token, duration })
        );
      }
    };
  }, [token]);
  
  // ... 기존 리포트 표시 코드 ...
}
```

#### 2.1.2 Backend API 구현

**파일**: `backend/routes/reports.py`

```python
from flask import request, jsonify
from db import get_db_connection

@app.route('/api/reports/track-view', methods=['POST'])
def track_view():
    """학부모 리포트 열람 추적"""
    data = request.json
    share_token = data.get('share_token')
    viewer_type = data.get('viewer_type', 'parent')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 리포트 ID 조회
        cursor.execute("""
            SELECT progress_record_id FROM report_shares
            WHERE share_token = %s AND is_active = 1
        """, (share_token,))
        
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Invalid token'}), 404
        
        report_id = result[0]
        
        # 열람 기록 저장
        cursor.execute("""
            INSERT INTO report_views
            (report_id, share_token, viewer_type, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            report_id,
            share_token,
            viewer_type,
            request.remote_addr,
            request.user_agent.string
        ))
        
        conn.commit()
        return jsonify({'success': True})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/reports/track-duration', methods=['POST'])
def track_duration():
    """학부모 체류 시간 업데이트"""
    data = request.json
    share_token = data.get('share_token')
    duration = data.get('duration')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 최근 열람 기록 업데이트
        cursor.execute("""
            UPDATE report_views
            SET view_duration_seconds = %s
            WHERE share_token = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (duration, share_token))
        
        conn.commit()
        return '', 204  # No Content
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
```

**완료 조건**:
- [ ] TutorNote 앱 공유 페이지에 추적 코드 추가
- [ ] Backend API 2개 엔드포인트 구현
- [ ] 학부모가 공유 페이지 열람 시 `report_views`에 저장
- [ ] 체류 시간 정확히 기록

---

### 작업 2.2: 온보딩 퍼널 데이터 수집 (4시간)

**목표**: 신규 학원의 전환 퍼널 추적 (가입 → 학생 등록 → 첫 리포트 → 카톡 공유)

**참고**: 기존 테이블 활용 (신규 테이블 불필요)

#### 2.2.1 온보딩 단계 추적

현재 필요한 데이터는 이미 수집 중:
- 학원 가입: `academies.created_at`
- 학생 등록: `students.created_at`
- 첫 리포트: `progress_records.created_at`
- 카톡 공유: `report_shares.created_at`, `activity_logs` (action_type='share_kakaotalk')

따라서 **별도 구현 불필요**. API에서 쿼리만 작성하면 됨.

#### 2.2.2 퍼널 분석 API

**파일**: `backend/routes/admin/metrics.py`

```python
from flask import jsonify
from db import get_db_connection

@app.route('/api/admin/metrics/onboarding-funnel', methods=['GET'])
@admin_required
def get_onboarding_funnel():
    """온보딩 퍼널 분석 (최근 30일)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 신규 학원 전환 퍼널
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT a.id) as total_signups,
            COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN a.id END) as has_students,
            COUNT(DISTINCT CASE WHEN pr.id IS NOT NULL THEN a.id END) as created_report,
            COUNT(DISTINCT CASE WHEN rs.id IS NOT NULL THEN a.id END) as shared_kakaotalk
        FROM academies a
        LEFT JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
        LEFT JOIN progress_records pr ON s.id = pr.student_id AND pr.is_deleted = 0
        LEFT JOIN report_shares rs ON pr.id = rs.progress_record_id
        WHERE a.created_at >= NOW() - INTERVAL 30 DAY
        AND a.is_deleted = 0
    """)
    
    result = cursor.fetchone()
    
    total = result['total_signups']
    has_students = result['has_students']
    created_report = result['created_report']
    shared = result['shared_kakaotalk']
    
    # 전환율 계산
    conversion_rate = (shared / total * 100) if total > 0 else 0
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'funnel': {
            'signups': total,
            'has_students': has_students,
            'created_report': created_report,
            'shared_kakaotalk': shared
        },
        'conversion_rates': {
            'signup_to_student': (has_students / total * 100) if total > 0 else 0,
            'student_to_report': (created_report / has_students * 100) if has_students > 0 else 0,
            'report_to_share': (shared / created_report * 100) if created_report > 0 else 0,
            'overall': conversion_rate
        }
    })
```

**완료 조건**:
- [ ] 온보딩 퍼널 API 구현
- [ ] 4단계 전환율 계산 정확
- [ ] 최근 30일 신규 학원 대상

---

### 작업 2.3: 핵심 지표 API 12개 구현 (16시간)

**목표**: 12개 핵심 지표 카드용 Backend API 구현

#### API 목록 및 엔드포인트

**파일**: `backend/routes/admin/metrics.py`

| 카드 | 엔드포인트 | 설명 |
|------|-----------|------|
| 1-1 | `/api/admin/metrics/academy-status` | 학원 현황 (활성/전체/신규/이탈) |
| 1-2 | `/api/admin/metrics/student-stats` | 학생 현황 (총/전월/평균) |
| 1-3 | `/api/admin/metrics/report-activity` | 리포트 활동 (이번달/전월/평균) |
| 1-4 | `/api/admin/metrics/engagement` | 활성도 지표 (DAU/MAU/고착도) |
| 2-1 | `/api/admin/metrics/content-generation` | 콘텐츠 생성 (카드뉴스) |
| 2-2 | `/api/admin/metrics/parent-reach` | 학부모 도달 (공유/열람/열람률) |
| 2-3 | `/api/admin/metrics/ai-efficiency` | AI 효율성 (리포트/시간절감) |
| 2-4 | `/api/admin/metrics/onboarding-funnel` | 전환 퍼널 (이미 구현) |
| 3-1 | `/api/admin/metrics/monetization` | 수익화 준비 (헤비유저/MRR) |
| 3-2 | `/api/admin/metrics/cost-breakdown` | 비용 현황 (총액/항목별) |
| 3-3 | `/api/admin/metrics/system-health` | 시스템 건강 (CPU/RAM/Disk) |
| 3-4 | `/api/admin/metrics/api-status` | API 상태 (Claude/Kakao) |

#### 구현 예시 (Card 1-1: 학원 현황)

```python
@app.route('/api/admin/metrics/academy-status', methods=['GET'])
@admin_required
def get_academy_status():
    """학원 현황 지표"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 전체 학원 수
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM academies
        WHERE is_deleted = 0
    """)
    total = cursor.fetchone()['total']
    
    # 활성 학원 (최근 7일 내 로그인)
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
    growth_rate = ((growth['current_month'] - growth['last_month']) / growth['last_month'] * 100) if growth['last_month'] > 0 else 0
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'total': total,
        'active': active,
        'new_signups': new_signups,
        'churned': churned,
        'growth_rate': round(growth_rate, 1),
        'trend': 'up' if growth_rate > 0 else ('down' if growth_rate < 0 else 'stable')
    })
```

**나머지 11개 API도 유사한 방식으로 구현**

**참고**: 기획서 섹션 5.2에 각 카드별 SQL 쿼리가 모두 있음 (복사 가능)

**완료 조건**:
- [ ] 12개 API 엔드포인트 모두 구현
- [ ] 각 API가 정확한 데이터 반환
- [ ] 전월 대비 증감율 계산 정확
- [ ] 트렌드 (up/down/stable) 계산 정확

---

### 작업 2.4: 핵심 지표 카드 UI 12개 구현 (12시간)

**목표**: 12개 지표를 4x3 Grid로 표시하는 UI 구현

#### 2.4.1 공통 MetricCard 컴포넌트

**파일**: `frontend/components/dashboard/MetricCard.tsx`

```typescript
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  mainValue: string | number;
  subValues?: { label: string; value: string | number }[];
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    label?: string;
  };
  status?: 'normal' | 'warning' | 'critical';
}

export function MetricCard({
  icon,
  title,
  mainValue,
  subValues,
  trend,
  status = 'normal'
}: MetricCardProps) {
  const statusColors = {
    normal: 'border-gray-200 bg-white',
    warning: 'border-yellow-300 bg-yellow-50',
    critical: 'border-red-300 bg-red-50'
  };
  
  const trendIcons = {
    up: <ArrowUp className="w-4 h-4 text-green-600" />,
    down: <ArrowDown className="w-4 h-4 text-red-600" />,
    stable: <Minus className="w-4 h-4 text-gray-600" />
  };
  
  return (
    <div className={`
      rounded-lg border-2 p-6 transition-all hover:shadow-md
      ${statusColors[status]}
    `}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{icon}</div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      
      {/* Main Value */}
      <div className="text-3xl font-bold text-gray-900 mb-3">
        {mainValue}
      </div>
      
      {/* Sub Values */}
      {subValues && subValues.length > 0 && (
        <div className="space-y-2 mb-3">
          {subValues.map((sub, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600">{sub.label}</span>
              <span className="font-medium text-gray-900">{sub.value}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          {trendIcons[trend.direction]}
          <span className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          {trend.label && (
            <span className="text-xs text-gray-500">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 2.4.2 대시보드 메인 페이지

**파일**: `frontend/app/dashboard/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CriticalAlerts } from '@/components/dashboard/CriticalAlerts';
import { 
  School, Users, FileText, TrendingUp,
  Image, Send, Bot, Target,
  DollarSign, Receipt, Activity, Globe
} from 'lucide-react';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAllMetrics();
  }, []);
  
  const fetchAllMetrics = async () => {
    try {
      // 12개 API를 병렬로 호출
      const [
        academyStatus,
        studentStats,
        reportActivity,
        engagement,
        contentGen,
        parentReach,
        aiEfficiency,
        funnel,
        monetization,
        costs,
        systemHealth,
        apiStatus
      ] = await Promise.all([
        fetch('/api/admin/metrics/academy-status').then(r => r.json()),
        fetch('/api/admin/metrics/student-stats').then(r => r.json()),
        fetch('/api/admin/metrics/report-activity').then(r => r.json()),
        fetch('/api/admin/metrics/engagement').then(r => r.json()),
        fetch('/api/admin/metrics/content-generation').then(r => r.json()),
        fetch('/api/admin/metrics/parent-reach').then(r => r.json()),
        fetch('/api/admin/metrics/ai-efficiency').then(r => r.json()),
        fetch('/api/admin/metrics/onboarding-funnel').then(r => r.json()),
        fetch('/api/admin/metrics/monetization').then(r => r.json()),
        fetch('/api/admin/metrics/cost-breakdown').then(r => r.json()),
        fetch('/api/admin/metrics/system-health').then(r => r.json()),
        fetch('/api/admin/metrics/api-status').then(r => r.json())
      ]);
      
      setMetrics({
        academyStatus,
        studentStats,
        reportActivity,
        engagement,
        contentGen,
        parentReach,
        aiEfficiency,
        funnel,
        monetization,
        costs,
        systemHealth,
        apiStatus
      });
      setLoading(false);
    } catch (error) {
      console.error('메트릭 로딩 실패:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }
  
  return (
    <div className="p-8 space-y-8">
      {/* Critical Alerts */}
      <CriticalAlerts />
      
      {/* 핵심 지표 카드 (4x3 Grid) */}
      <div>
        <h2 className="text-2xl font-bold mb-6">핵심 지표</h2>
        
        {/* Row 1: 비즈니스 건강도 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            icon={<School />}
            title="학원 현황"
            mainValue={`활성: ${metrics.academyStatus.active}개`}
            subValues={[
              { label: '전체', value: `${metrics.academyStatus.total}개` },
              { label: '신규 (30일)', value: `+${metrics.academyStatus.new_signups}개` },
              { label: '이탈', value: `${metrics.academyStatus.churned}개` }
            ]}
            trend={{
              value: metrics.academyStatus.growth_rate,
              direction: metrics.academyStatus.trend,
              label: '전월 대비'
            }}
          />
          
          <MetricCard
            icon={<Users />}
            title="학생 현황"
            mainValue={`${metrics.studentStats.total}명`}
            subValues={[
              { label: '전월 대비', value: `+${metrics.studentStats.monthly_growth}명` },
              { label: '학원당 평균', value: `${metrics.studentStats.avg_per_academy}명` }
            ]}
            trend={{
              value: metrics.studentStats.growth_rate,
              direction: metrics.studentStats.trend
            }}
          />
          
          <MetricCard
            icon={<FileText />}
            title="리포트 활동"
            mainValue={`${metrics.reportActivity.this_month}건`}
            subValues={[
              { label: '전월 대비', value: `+${metrics.reportActivity.monthly_growth}건` },
              { label: '학생당', value: `${metrics.reportActivity.avg_per_student}건` }
            ]}
            trend={{
              value: metrics.reportActivity.growth_rate,
              direction: metrics.reportActivity.trend
            }}
          />
          
          <MetricCard
            icon={<TrendingUp />}
            title="활성도 지표"
            mainValue={`${metrics.engagement.stickiness}%`}
            subValues={[
              { label: 'DAU / MAU', value: `${metrics.engagement.dau} / ${metrics.engagement.mau}` },
              { label: '이탈 위험', value: `${metrics.engagement.at_risk}개` }
            ]}
            status={metrics.engagement.at_risk > 5 ? 'warning' : 'normal'}
          />
        </div>
        
        {/* Row 2: 사용자 참여 & AI 효율 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            icon={<Image />}
            title="콘텐츠 생성"
            mainValue={`${metrics.contentGen.card_news_count}개`}
            subValues={[
              { label: '평균/학원', value: `${metrics.contentGen.avg_per_academy}개` }
            ]}
            trend={{
              value: metrics.contentGen.growth_rate,
              direction: metrics.contentGen.trend
            }}
          />
          
          <MetricCard
            icon={<Send />}
            title="학부모 도달"
            mainValue={`열람률: ${metrics.parentReach.view_rate}%`}
            subValues={[
              { label: '공유', value: `${metrics.parentReach.shares}회` },
              { label: '열람', value: `${metrics.parentReach.views}회` }
            ]}
            status={metrics.parentReach.view_rate < 30 ? 'warning' : 'normal'}
          />
          
          <MetricCard
            icon={<Bot />}
            title="AI 효율성"
            mainValue={`${metrics.aiEfficiency.ai_reports}건`}
            subValues={[
              { label: '시간 절감', value: `${metrics.aiEfficiency.hours_saved}시간` },
              { label: '학원당', value: `${metrics.aiEfficiency.avg_per_academy}건` }
            ]}
          />
          
          <MetricCard
            icon={<Target />}
            title="전환 퍼널"
            mainValue={`전환율: ${metrics.funnel.conversion_rates.overall}%`}
            subValues={[
              { label: '가입', value: `${metrics.funnel.funnel.signups}개` },
              { label: '학생 등록', value: `${metrics.funnel.funnel.has_students}개` },
              { label: '카톡 공유', value: `${metrics.funnel.funnel.shared_kakaotalk}개` }
            ]}
          />
        </div>
        
        {/* Row 3: 수익화 & 시스템 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={<DollarSign />}
            title="수익화 준비"
            mainValue={`₩${metrics.monetization.estimated_mrr.toLocaleString()}`}
            subValues={[
              { label: '헤비유저', value: `${metrics.monetization.heavy_users}개` },
              { label: '비율', value: `${metrics.monetization.heavy_user_rate}%` }
            ]}
          />
          
          <MetricCard
            icon={<Receipt />}
            title="비용 현황"
            mainValue={`₩${metrics.costs.total.toLocaleString()}`}
            subValues={[
              { label: '알림톡', value: `₩${metrics.costs.alimtalk.toLocaleString()}` },
              { label: 'Claude', value: `₩${metrics.costs.claude.toLocaleString()}` },
              { label: '서버', value: `₩${metrics.costs.server.toLocaleString()}` }
            ]}
          />
          
          <MetricCard
            icon={<Activity />}
            title="시스템 건강"
            mainValue={`CPU: ${metrics.systemHealth.cpu}%`}
            subValues={[
              { label: 'RAM', value: `${metrics.systemHealth.ram}%` },
              { label: 'Disk', value: `${metrics.systemHealth.disk}%` }
            ]}
            status={
              metrics.systemHealth.cpu > 90 ? 'critical' :
              metrics.systemHealth.cpu > 80 ? 'warning' : 'normal'
            }
          />
          
          <MetricCard
            icon={<Globe />}
            title="API 상태"
            mainValue="정상"
            subValues={[
              { label: 'Claude', value: metrics.apiStatus.claude.status },
              { label: 'Kakao', value: metrics.apiStatus.kakao.status }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
```

**완료 조건**:
- [ ] MetricCard 컴포넌트 구현 완료
- [ ] 12개 카드 모두 정상 표시
- [ ] 4x3 Grid 레이아웃 반응형
- [ ] 트렌드 표시 (▲▼→) 정상 동작
- [ ] Warning/Critical 색상 구분 정상

---

### 작업 2.5: 이탈 위험 학원 테이블 구현 (4시간)

**목표**: 7일 이상 무활동 학원을 테이블로 표시

#### 2.5.1 Backend API

**파일**: `backend/routes/admin/tables.py`

```python
@app.route('/api/admin/tables/at-risk-academies', methods=['GET'])
@admin_required
def get_at_risk_academies():
    """이탈 위험 학원 목록"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            a.id,
            a.name as academy_name,
            a.owner_name,
            COUNT(DISTINCT s.id) as student_count,
            COUNT(DISTINCT pr.id) as report_count,
            MAX(al.created_at) as last_activity,
            DATEDIFF(NOW(), MAX(al.created_at)) as inactive_days,
            CASE 
                WHEN DATEDIFF(NOW(), MAX(al.created_at)) >= 21 THEN 'critical'
                WHEN DATEDIFF(NOW(), MAX(al.created_at)) >= 14 THEN 'warning'
                WHEN DATEDIFF(NOW(), MAX(al.created_at)) >= 7 THEN 'caution'
            END as risk_level
        FROM academies a
        LEFT JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
        LEFT JOIN progress_records pr ON s.id = pr.student_id AND pr.is_deleted = 0
        LEFT JOIN activity_logs al ON a.id = al.academy_id
        WHERE a.is_deleted = 0
        AND NOT EXISTS (
            SELECT 1 FROM activity_logs al2
            WHERE al2.academy_id = a.id
            AND al2.created_at >= NOW() - INTERVAL 7 DAY
        )
        GROUP BY a.id
        ORDER BY inactive_days DESC
    """)
    
    results = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'academies': results,
        'total_count': len(results)
    })
```

#### 2.5.2 Frontend 테이블 컴포넌트

**파일**: `frontend/components/dashboard/AtRiskAcademiesTable.tsx`

```typescript
import { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, Bell } from 'lucide-react';

export function AtRiskAcademiesTable() {
  const [academies, setAcademies] = useState([]);
  const [expanded, setExpanded] = useState(true);
  
  useEffect(() => {
    fetch('/api/admin/tables/at-risk-academies')
      .then(r => r.json())
      .then(data => setAcademies(data.academies));
  }, []);
  
  const riskColors = {
    critical: 'text-red-600 bg-red-100',
    warning: 'text-yellow-600 bg-yellow-100',
    caution: 'text-orange-600 bg-orange-100'
  };
  
  const riskIcons = {
    critical: '🔴',
    warning: '🟡',
    caution: '🟠'
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold">
            이탈 위험 학원 ({academies.length}개)
          </h3>
        </div>
        <button className="text-sm text-blue-600 hover:underline">
          CSV 다운로드
        </button>
      </div>
      
      {/* Table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">학원명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">원장</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">학생</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">리포트</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">마지막 활동</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">비활성 기간</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {academies.map((academy: any) => (
                <tr key={academy.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {academy.academy_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {academy.owner_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {academy.student_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {academy.report_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(academy.last_activity).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    {academy.inactive_days}일
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskColors[academy.risk_level]}`}>
                      {riskIcons[academy.risk_level]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => window.location.href = `/academies/${academy.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-800"
                        onClick={() => alert('알림 보내기 기능 구현 예정')}
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**완료 조건**:
- [ ] Backend API 구현 완료
- [ ] Frontend 테이블 정상 표시
- [ ] 이탈 위험도별 색상 구분 (🔴🟡🟠)
- [ ] "학원 상세" 링크 정상 동작
- [ ] CSV 다운로드 기능 (선택적)

---

### 작업 2.6: 활성 학원 상세 테이블 (3시간)

**작업 내용**: 2.5와 유사한 방식으로 구현

**참고**: 기획서 섹션 5.3.2 참조

**완료 조건**:
- [ ] Backend API 구현
- [ ] Frontend 테이블 구현
- [ ] 헤비유저 표시 (✅)
- [ ] 예상 플랜 추천 (Free/Standard/Pro)

---

### 작업 2.7: 온보딩 퍼널 분석 테이블 (3시간)

**작업 내용**: 신규 학원 온보딩 단계별 전환율 표시

**참고**: 기획서 섹션 5.3.3 참조

**완료 조건**:
- [ ] Backend API 구현
- [ ] Frontend 테이블 구현
- [ ] 4단계 전환율 시각화

---

### 작업 2.8: 빠른 액션 버튼 4개 구현 (6시간)

**목표**: 대시보드에서 자주 쓰는 작업을 빠르게 수행

#### 빠른 액션 버튼 목록

1. **대리 로그인** (이미 구현됨 - Phase 1)
2. **비용 입력** (operational_costs 테이블에 데이터 추가)
3. **공지사항 작성** (선택적)
4. **시스템 재시작** (선택적)

**참고**: 기획서에는 상세 스펙 없음 (간단히 구현)

---

### 작업 2.9: "인사이트 지표" 메뉴 완전 제거 (30분)

**목표**: Phase 1에서 숨김 처리한 메뉴를 완전히 제거

#### 2.9.1 Frontend 사이드바 수정

```typescript
// ❌ 완전 제거
// { label: '인사이트 지표', href: '/metrics', icon: BarChart },

// ✅ 또는 주석도 삭제
```

#### 2.9.2 `/metrics` 페이지 삭제 또는 대시보드 리다이렉트

```bash
# 파일 삭제
rm frontend/app/metrics/page.tsx

# 또는 리다이렉트 유지
```

**완료 조건**:
- [ ] 사이드바에서 "인사이트 지표" 메뉴 완전 제거
- [ ] `/metrics` 페이지 접근 시 대시보드로 리다이렉트

---

### 작업 2.10: 통합 테스트 및 버그 수정 (8시간)

**목표**: Phase 2 전체 기능이 정상 작동하는지 검증

#### 통합 테스트 시나리오

##### 시나리오 1: 12개 지표 카드 표시

```
1. Master Admin 대시보드 접속
2. 12개 카드 모두 표시 확인
3. 각 카드의 데이터가 정확한지 확인
   - DB 직접 조회와 비교
4. 트렌드 (▲▼→) 정상 표시 확인
5. Warning/Critical 색상 정상 확인
```

##### 시나리오 2: 학부모 열람 추적

```
1. TutorNote 앱에서 리포트 생성
2. 카카오톡 공유
3. 다른 브라우저/시크릿 모드에서 공유 링크 열람
4. report_views 테이블에 데이터 저장 확인
5. Master Admin에서 "학부모 도달" 카드 열람률 업데이트 확인
```

##### 시나리오 3: 이탈 위험 학원

```
1. 테스트 학원 생성
2. 7일 이상 로그인 안 하도록 설정 (또는 activity_logs 날짜 수정)
3. Master Admin 대시보드에서 "이탈 위험 학원" 테이블 확인
4. 해당 학원이 목록에 표시되는지 확인
5. 상태 색상 (🔴🟡🟠) 정확한지 확인
```

**완료 조건**:
- [ ] 3개 시나리오 모두 통과
- [ ] 발견된 버그 모두 수정
- [ ] Git commit 완료

---

## 🎉 Phase 2 완료 체크리스트

Phase 2 구현 완료 후 아래 모든 항목을 확인해주세요:

### 데이터 수집
- [ ] 학부모 열람 추적 정상 동작
- [ ] `report_views` 테이블에 데이터 저장
- [ ] 온보딩 퍼널 데이터 수집 정상

### Backend API
- [ ] 12개 핵심 지표 API 모두 구현
- [ ] 3개 테이블 API 구현
- [ ] 모든 API가 정확한 데이터 반환

### Frontend UI
- [ ] 12개 지표 카드 모두 정상 표시
- [ ] 4x3 Grid 레이아웃 반응형
- [ ] 트렌드 표시 (▲▼→) 정상
- [ ] Warning/Critical 색상 구분
- [ ] 3개 테이블 정상 표시
- [ ] 빠른 액션 버튼 정상 동작

### 통합 테스트
- [ ] 12개 지표 데이터 정합성 확인
- [ ] 학부모 열람률 실시간 업데이트
- [ ] 이탈 위험 학원 테이블 정확
- [ ] 온보딩 퍼널 전환율 정확

### 기타
- [ ] "인사이트 지표" 메뉴 완전 제거
- [ ] 모든 버그 수정 완료
- [ ] Git commit 완료
- [ ] 텔레그램 "Phase 2 완료" 알림 발송

**✅ 모든 체크리스트 완료 시 → Staging 배포 가능!** 🚀

---

## 💬 질문/이슈 발생 시

### 자주 발생하는 문제들

1. **SQL 쿼리 성능 저하**
   - INDEX 추가 확인
   - EXPLAIN으로 쿼리 실행 계획 분석

2. **API 응답 시간 > 1초**
   - 쿼리 최적화
   - N+1 쿼리 문제 확인

3. **Frontend 데이터 페칭 느림**
   - SWR의 `refreshInterval` 조정
   - 병렬 fetch 사용

4. **학부모 열람 추적 안됨**
   - Beacon API 지원 확인
   - CORS 설정 확인

---

## 📝 구현 가이드 요약

### Part 1: Phase 1 검증 (3시간)
1. DB 스키마 검증 (30분)
2. Claude API 추적 검증 (30분)
3. 활동 로그 검증 (30분)
4. 헬스체크 검증 (30분)
5. Critical Alerts UI 검증 (30분)
6. 통합 테스트 (30분)
7. 버그 수정 (30분)

### Part 2: Phase 2 구현 (69시간, 9일)
1. 학부모 열람 추적 (3시간)
2. 온보딩 퍼널 데이터 수집 (4시간)
3. 핵심 지표 API 12개 (16시간) ⭐
4. 핵심 지표 카드 UI 12개 (12시간) ⭐
5. 이탈 위험 학원 테이블 (4시간)
6. 활성 학원 상세 테이블 (3시간)
7. 온보딩 퍼널 테이블 (3시간)
8. 빠른 액션 버튼 (6시간)
9. 메뉴 제거 (30분)
10. 통합 테스트 (8시간)

---

**구현 시작 시간**: (기록용)  
**구현 완료 예상 시간**: 72시간 (약 9일)  
**실제 완료 시간**: (기록용)

**Phase 1 검증 & Phase 2 구현 화이팅! 🚀**
