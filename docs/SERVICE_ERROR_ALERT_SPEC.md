# 서비스 에러/장애 즉시 알림 시스템 스펙

> 사용자가 서비스 이용 중 발생하는 에러를 실시간으로 텔레그램에 알림

## 1. 기능 개요

### 목적
- 사용자 경험에 영향을 주는 에러를 즉시 감지
- 빠른 대응으로 서비스 안정성 향상
- 에러 패턴 분석을 통한 품질 개선

### 기존 서버 점검 알림과의 차이

| 구분 | 서버 점검 알림 | 서비스 에러 알림 |
|------|---------------|-----------------|
| 대상 | 서버 리소스 (CPU, RAM, Disk) | 사용자 액션 중 발생한 에러 |
| 트리거 | 5분 주기 Cron | 에러 발생 즉시 |
| 출처 | 서버 모니터링 스크립트 | 프론트엔드/백엔드 애플리케이션 |

---

## 2. 에러 유형 분류

### 2.1 심각도 (Severity)

| 레벨 | 설명 | 예시 | 즉시 알림 |
|------|------|------|----------|
| **critical** | 서비스 이용 불가 | API 서버 다운, DB 연결 실패 | ✅ |
| **error** | 핵심 기능 실패 | 리포트 생성 실패, 로그인 실패 | ✅ |
| **warning** | 부분 기능 실패 | 이미지 업로드 실패, 알림톡 발송 실패 | ⚠️ 집계 후 |

### 2.2 에러 카테고리

| 카테고리 | 코드 | 설명 |
|----------|------|------|
| **ai_generation** | AI_001 ~ | AI 리포트/카드뉴스 생성 관련 |
| **authentication** | AUTH_001 ~ | 로그인/인증 관련 |
| **data_operation** | DATA_001 ~ | CRUD 작업 실패 |
| **external_api** | EXT_001 ~ | 외부 API 호출 실패 (카카오, Claude 등) |
| **file_upload** | FILE_001 ~ | 파일 업로드/처리 실패 |
| **network** | NET_001 ~ | 네트워크/연결 오류 |
| **unknown** | UNK_001 ~ | 분류되지 않은 에러 |

### 2.3 주요 에러 코드 정의

```
# AI 생성 관련
AI_001: Claude API 타임아웃
AI_002: Claude API 응답 파싱 실패
AI_003: 카드뉴스 이미지 생성 실패
AI_004: AI 크레딧 부족

# 인증 관련
AUTH_001: 토큰 만료
AUTH_002: 권한 없음
AUTH_003: 계정 잠금

# 데이터 관련
DATA_001: 저장 실패
DATA_002: 조회 실패
DATA_003: 삭제 실패
DATA_004: 유효성 검증 실패

# 외부 API 관련
EXT_001: 카카오 API 실패
EXT_002: Claude API 실패
EXT_003: 이미지 서버 실패

# 카카오 알림톡 관련 (즉시 알림 필수)
KAKAO_001: 알림톡 발송 실패 - 템플릿 불일치
KAKAO_002: 알림톡 발송 실패 - 수신자 없음
KAKAO_003: 알림톡 발송 실패 - 잔액 부족
KAKAO_004: 알림톡 발송 실패 - 채널 차단
KAKAO_005: 알림톡 발송 실패 - API 인증 실패
KAKAO_006: 알림톡 발송 실패 - 서버 오류
KAKAO_007: 카카오 API 연결 실패
KAKAO_008: 카카오 API 타임아웃

# 파일 관련
FILE_001: 업로드 실패
FILE_002: 파일 크기 초과
FILE_003: 지원하지 않는 형식

# 네트워크 관련
NET_001: 연결 타임아웃
NET_002: 서버 응답 없음
NET_003: CORS 에러
```

### 2.4 즉시 알림 필수 에러 (중복 방지 제외)

> 아래 에러는 비즈니스에 직접적인 영향을 주므로 **무조건 즉시 알림**

| 에러 코드 | 설명 | 이유 |
|----------|------|------|
| KAKAO_001 ~ KAKAO_008 | 카카오 알림톡 발송 실패 | 학부모 알림 전달 실패 |
| AI_004 | AI 크레딧 부족 | 서비스 이용 불가 |
| DATA_001 | 저장 실패 | 데이터 유실 가능 |

---

## 3. 수집 정보

### 3.1 필수 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| error_code | string | 에러 코드 (AI_001 등) |
| severity | enum | critical, error, warning |
| message | string | 에러 메시지 |
| timestamp | datetime | 발생 시간 (KST) |

### 3.2 컨텍스트 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| academy_id | int | 학원 ID (nullable) |
| academy_name | string | 학원명 (nullable) |
| user_id | int | 사용자 ID (nullable) |
| user_email | string | 사용자 이메일 (nullable) |
| page_url | string | 발생 페이지 URL |
| action | string | 수행 중이던 작업 |

### 3.3 기술 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| stack_trace | text | 스택 트레이스 (백엔드) |
| browser | string | 브라우저 정보 |
| os | string | OS 정보 |
| app_version | string | 앱 버전 |
| request_id | string | 요청 추적 ID |

---

## 4. 텔레그램 메시지 포맷

### 4.1 Critical/Error 알림 (즉시 발송)

```
🚨 [서비스 에러] AI_001

━━━━━━━━━━━━━━━━━━━━━
📍 발생 위치
• 학원: 피아노포레 (ID: 123)
• 사용자: kim@example.com
• 페이지: /reports/create

━━━━━━━━━━━━━━━━━━━━━
❌ 에러 내용
• 코드: AI_001
• 메시지: Claude API 타임아웃
• 작업: 레슨 리포트 AI 생성

━━━━━━━━━━━━━━━━━━━━━
🔧 기술 정보
• 시간: 2026-01-23 13:30:25 KST
• Request ID: req_abc123
• 브라우저: Chrome 120

━━━━━━━━━━━━━━━━━━━━━
💡 권장 조치
• Claude API 상태 확인
• 재시도 로직 점검
```

### 4.2 Warning 집계 알림 (1시간마다)

```
⚠️ [Warning 집계] 지난 1시간

총 12건 발생

• FILE_001 (업로드 실패): 5건
• EXT_001 (카카오 API): 4건
• NET_001 (타임아웃): 3건

상세 로그: https://admin.tutornote.kr/logs
```

---

## 5. 중복 방지 로직

### 5.1 기본 규칙

```
┌─────────────────────────────────────────────────────────────┐
│  동일 에러 발생 시 처리 흐름                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  에러 발생 ──▶ 5분 이내 동일 에러? ──▶ YES ──▶ 카운트 증가   │
│                       │                         │           │
│                       ▼ NO                      ▼           │
│                  즉시 알림 발송            5건 이상? ──▶ YES │
│                                               │      │      │
│                                               ▼ NO   ▼      │
│                                            DB 기록만  요약 알림│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Deduplication 규칙

| 규칙 | 설명 |
|------|------|
| **5분 쿨다운** | 동일 에러는 5분 이내 재발송 금지 |
| **카운트 집계** | 5분 내 동일 에러 발생 횟수 카운트 |
| **5건 이상 시** | 즉시 요약 알림 1회 발송 |
| **예외** | 카카오 알림톡 실패는 항상 즉시 알림 (사유 포함) |

### 5.3 구현 로직

```python
class ErrorAlertManager:
    def __init__(self):
        self.error_counts = {}  # {error_key: {'count': n, 'first_at': datetime}}
        self.last_alert_time = {}  # {error_key: datetime}

    def should_send_alert(self, error_code: str, academy_id: int = None) -> dict:
        """
        알림 발송 여부 결정
        Returns: {'send': bool, 'type': 'immediate'|'summary'|'skip', 'count': int}
        """
        error_key = f"{error_code}_{academy_id or 'global'}"
        now = datetime.now()

        # 1. 카카오 알림톡 에러는 항상 즉시 발송
        if error_code.startswith('KAKAO_'):
            return {'send': True, 'type': 'immediate', 'count': 1}

        # 2. 5분 이내 동일 에러 체크
        if error_key in self.last_alert_time:
            elapsed = (now - self.last_alert_time[error_key]).seconds
            if elapsed < 300:  # 5분 = 300초
                # 카운트 증가
                self._increment_count(error_key)
                count = self.error_counts[error_key]['count']

                # 5건 이상이면 요약 알림
                if count == 5:
                    return {'send': True, 'type': 'summary', 'count': count}
                else:
                    return {'send': False, 'type': 'skip', 'count': count}

        # 3. 첫 발생 또는 5분 경과 - 즉시 알림
        self.last_alert_time[error_key] = now
        self._reset_count(error_key)
        return {'send': True, 'type': 'immediate', 'count': 1}

    def _increment_count(self, error_key: str):
        if error_key not in self.error_counts:
            self.error_counts[error_key] = {'count': 0, 'first_at': datetime.now()}
        self.error_counts[error_key]['count'] += 1

    def _reset_count(self, error_key: str):
        self.error_counts[error_key] = {'count': 1, 'first_at': datetime.now()}
```

### 5.4 Rate Limiting

```
- 분당 최대 발송: 10건
- 시간당 최대 발송: 100건
- 초과 시: 집계하여 1시간 뒤 요약 발송
```

### 5.5 요약 알림 메시지 포맷

```
⚠️ [반복 에러 감지] AI_001

━━━━━━━━━━━━━━━━━━━━━
🔄 5분 내 5건 이상 발생

• 에러: Claude API 타임아웃
• 발생 횟수: 7건
• 최초 발생: 13:25:00
• 최근 발생: 13:29:45

━━━━━━━━━━━━━━━━━━━━━
🤖 AI 분석 (Gemini)
• 긴급도: 높음
• 원인 추정: Claude API 서버 과부하
• 권장 조치: API 재시도 간격 증가, 폴백 로직 활성화

━━━━━━━━━━━━━━━━━━━━━
📊 영향 범위
• 영향받은 학원: 3개
• 영향받은 사용자: 5명
```

---

## 6. Gemini AI 에러 분석

> 에러 발생 시 Gemini API로 자동 분석하여 긴급도 판단 및 조치 방법 가이드

### 6.1 분석 목적

| 항목 | 설명 |
|------|------|
| **긴급도 분석** | 에러의 심각성을 AI가 판단 (critical/high/medium/low) |
| **원인 추정** | 에러 메시지와 스택 트레이스 기반 원인 분석 |
| **조치 가이드** | 구체적인 해결 방법 제안 |
| **영향 범위 예측** | 사용자/서비스에 미치는 영향 예측 |

### 6.2 분석에 사용되는 데이터

> 정확한 분석을 위해 현재 에러 + 과거 에러 로그를 함께 분석

| 데이터 | 설명 | 용도 |
|--------|------|------|
| **현재 에러** | 방금 발생한 에러 정보 | 즉각적인 원인 파악 |
| **스택 트레이스** | 에러 발생 경로 | 코드 레벨 원인 분석 |
| **최근 유사 에러** | 24시간 내 동일 error_code | 패턴 분석, 재발 여부 |
| **연관 에러** | 같은 시간대 다른 에러들 | 연쇄 장애 파악 |
| **과거 해결 이력** | 이전에 같은 에러 해결 방법 | 검증된 조치 방법 제안 |

### 6.3 Gemini API 호출

```python
def analyze_error_with_gemini(error_data: dict, error_logs: list) -> dict:
    """
    Gemini API로 에러 분석 (에러 로그 포함)
    """
    # 1. 최근 24시간 유사 에러 조회
    recent_similar = get_recent_errors(
        error_code=error_data['error_code'],
        hours=24,
        limit=10
    )

    # 2. 같은 시간대(±5분) 다른 에러 조회
    related_errors = get_related_errors(
        timestamp=error_data['timestamp'],
        minutes=5,
        limit=5
    )

    # 3. 과거 해결 이력 조회
    resolution_history = get_resolution_history(
        error_code=error_data['error_code'],
        limit=3
    )

    prompt = f"""
    다음 서비스 에러를 분석해주세요.

    [현재 에러]
    - 코드: {error_data['error_code']}
    - 메시지: {error_data['message']}
    - 발생 위치: {error_data['page_url']}
    - 작업: {error_data['action']}
    - 스택 트레이스:
    {error_data.get('stack_trace', 'N/A')}

    [최근 24시간 유사 에러 ({len(recent_similar)}건)]
    {format_error_list(recent_similar)}

    [같은 시간대 연관 에러]
    {format_error_list(related_errors)}

    [과거 해결 이력]
    {format_resolution_history(resolution_history)}

    위 정보를 종합하여 다음 형식으로 분석해주세요:
    1. 긴급도: [critical/high/medium/low]
    2. 원인 추정: [스택 트레이스와 패턴 기반 분석]
    3. 재발 여부: [과거 에러와 비교하여 재발인지, 신규인지]
    4. 권장 조치: [과거 해결 이력 참고하여 구체적인 조치 방법]
    5. 영향 범위: [연관 에러 고려한 영향 범위]
    6. 근본 원인: [연쇄 장애 가능성 분석]
    """

    response = gemini_client.generate_content(prompt)

    return parse_gemini_response(response)


def get_recent_errors(error_code: str, hours: int, limit: int) -> list:
    """최근 N시간 내 동일 에러 코드 조회"""
    return db.query("""
        SELECT error_code, message, stack_trace, created_at,
               academy_name, page_url, action
        FROM error_logs
        WHERE error_code = %s
        AND created_at >= NOW() - INTERVAL %s HOUR
        ORDER BY created_at DESC
        LIMIT %s
    """, (error_code, hours, limit))


def get_related_errors(timestamp: datetime, minutes: int, limit: int) -> list:
    """같은 시간대 다른 에러 조회 (연쇄 장애 파악)"""
    return db.query("""
        SELECT error_code, message, severity, created_at
        FROM error_logs
        WHERE created_at BETWEEN %s - INTERVAL %s MINUTE
                            AND %s + INTERVAL %s MINUTE
        ORDER BY created_at DESC
        LIMIT %s
    """, (timestamp, minutes, timestamp, minutes, limit))


def get_resolution_history(error_code: str, limit: int) -> list:
    """과거 동일 에러 해결 이력 조회"""
    return db.query("""
        SELECT error_code, message, resolution_note, resolved_at
        FROM error_logs
        WHERE error_code = %s
        AND resolution_note IS NOT NULL
        ORDER BY resolved_at DESC
        LIMIT %s
    """, (error_code, limit))
```

### 6.4 분석 결과 구조

```python
{
    "urgency": "high",  # critical, high, medium, low
    "urgency_reason": "사용자가 핵심 기능을 사용할 수 없음",

    "estimated_cause": "Claude API 서버의 일시적 과부하로 인한 타임아웃",
    "stack_analysis": "timeout 발생 지점: claude_client.py:142 generate_content()",

    "is_recurring": True,  # 재발 여부
    "recurrence_info": {
        "first_occurred": "2026-01-20 14:30:00",
        "occurrence_count": 5,
        "pattern": "주로 오후 2-4시 사이 발생 (트래픽 피크 시간)"
    },

    "root_cause": {  # 근본 원인 분석
        "analysis": "Claude API 동시 요청 제한 초과 가능성",
        "related_errors": ["NET_001 타임아웃 2건 동시 발생"],
        "chain_failure": False  # 연쇄 장애 여부
    },

    "recommended_actions": [
        "Claude API 상태 페이지 확인 (status.anthropic.com)",
        "재시도 로직의 타임아웃 값 증가 (30초 → 60초)",
        "요청 큐잉 및 Rate Limiting 적용 검토"
    ],

    "past_resolution": {  # 과거 해결 이력 참고
        "similar_case": "2026-01-15 동일 에러",
        "resolution": "Claude API 키 갱신으로 해결",
        "applicable": False  # 이번 케이스에 적용 가능 여부
    },

    "impact": {
        "user_impact": "리포트 생성 불가",
        "service_impact": "AI 리포트 기능 일시 중단",
        "affected_academies": 3,
        "affected_users": 5
    }
}
```

### 6.4 긴급도 기준

| 긴급도 | 설명 | 예시 |
|--------|------|------|
| **critical** | 서비스 전체 중단 | DB 연결 실패, 서버 다운 |
| **high** | 핵심 기능 사용 불가 | 리포트 생성 실패, 로그인 불가 |
| **medium** | 부분 기능 영향 | 이미지 업로드 실패, 알림 발송 지연 |
| **low** | 사소한 문제 | UI 깨짐, 로딩 지연 |

### 6.5 텔레그램 메시지에 AI 분석 포함

```
🚨 [서비스 에러] AI_001

━━━━━━━━━━━━━━━━━━━━━
📍 발생 위치
• 학원: 피아노포레 (ID: 123)
• 페이지: /reports/create

━━━━━━━━━━━━━━━━━━━━━
❌ 에러 내용
• 코드: AI_001
• 메시지: Claude API 타임아웃

━━━━━━━━━━━━━━━━━━━━━
🤖 AI 분석 (Gemini)
• 긴급도: 🔴 HIGH
• 원인: Claude API 서버 과부하 추정
• 영향: 리포트 생성 기능 일시 중단

━━━━━━━━━━━━━━━━━━━━━
💡 권장 조치
1. Claude API 상태 페이지 확인
2. 재시도 타임아웃 값 증가 검토
3. 지속 시 폴백 로직 활성화
```

### 6.6 카카오 알림톡 실패 시 AI 분석

```
🚨 [알림톡 발송 실패] KAKAO_001

━━━━━━━━━━━━━━━━━━━━━
📍 발송 정보
• 학원: 피아노포레
• 수신자: 010-****-1234
• 템플릿: 레슨 리포트 알림

━━━━━━━━━━━━━━━━━━━━━
❌ 실패 사유
• 코드: KAKAO_001
• 사유: 템플릿 변수 불일치
• 상세: 변수 'student_name' 누락

━━━━━━━━━━━━━━━━━━━━━
🤖 AI 분석 (Gemini)
• 긴급도: 🟡 MEDIUM
• 원인: 템플릿에 필요한 변수가 전달되지 않음
• 영향: 해당 학부모에게 알림 미전달

━━━━━━━━━━━━━━━━━━━━━
💡 권장 조치
1. 알림톡 발송 로직에서 student_name 변수 확인
2. 해당 학부모에게 수동 알림 발송 필요
3. 템플릿 변수 검증 로직 추가 검토
```

### 6.7 AI 분석 비용 관리

```python
# Gemini API 호출 조건
ANALYZE_CONDITIONS = {
    'critical': True,   # 항상 분석
    'error': True,      # 항상 분석
    'warning': False,   # 집계 시에만 분석
}

# 일일 분석 제한
DAILY_ANALYSIS_LIMIT = 100  # 일 100건 제한
```

---

## 7. 구현 범위

### 6.1 프론트엔드 (TutorNote App)

```typescript
// 글로벌 에러 핸들러
window.onerror = (message, source, lineno, colno, error) => {
  reportError({
    severity: 'error',
    message,
    stack_trace: error?.stack,
    page_url: window.location.href,
    // ...context
  });
};

// API 에러 인터셉터
api.interceptors.response.use(
  response => response,
  error => {
    if (shouldReport(error)) {
      reportError({
        error_code: mapToErrorCode(error),
        severity: getSeverity(error),
        message: error.message,
        // ...context
      });
    }
    return Promise.reject(error);
  }
);

// 수동 에러 리포트
try {
  await generateReport();
} catch (error) {
  reportError({
    error_code: 'AI_001',
    severity: 'error',
    action: 'generate_report',
    // ...
  });
}
```

### 6.2 백엔드 (TutorNote API)

```python
# 에러 리포트 API
@app.route('/api/errors/report', methods=['POST'])
def report_error():
    data = request.json

    # 1. DB에 에러 로그 저장
    save_error_log(data)

    # 2. 중복 체크
    if should_send_alert(data):
        # 3. 텔레그램 발송
        send_error_alert(data)

    return jsonify({'success': True})

# 글로벌 예외 핸들러
@app.errorhandler(Exception)
def handle_exception(e):
    error_data = {
        'error_code': classify_error(e),
        'severity': get_severity(e),
        'message': str(e),
        'stack_trace': traceback.format_exc(),
        # ...
    }

    save_error_log(error_data)

    if is_critical(e):
        send_error_alert(error_data)

    return jsonify({'error': 'Internal Server Error'}), 500
```

---

## 7. API 설계

### 7.1 에러 리포트 API

```
POST /api/errors/report

Request:
{
  "error_code": "AI_001",
  "severity": "error",
  "message": "Claude API 타임아웃",
  "page_url": "/reports/create",
  "action": "generate_report",
  "academy_id": 123,
  "user_id": 456,
  "browser": "Chrome 120",
  "os": "macOS",
  "app_version": "1.2.0",
  "stack_trace": "Error: ...",
  "extra": {
    "student_id": 789,
    "report_type": "lesson"
  }
}

Response:
{
  "success": true,
  "error_id": "err_abc123"
}
```

### 7.2 에러 로그 조회 API (어드민용)

```
GET /api/admin/errors?page=1&severity=error&date_from=2026-01-01

Response:
{
  "errors": [...],
  "total": 100,
  "page": 1,
  "total_pages": 10,
  "summary": {
    "critical": 2,
    "error": 45,
    "warning": 53
  }
}
```

---

## 8. 데이터베이스 스키마

### 8.1 error_logs 테이블

```sql
CREATE TABLE error_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_id VARCHAR(50) UNIQUE NOT NULL,  -- err_abc123
  error_code VARCHAR(20) NOT NULL,        -- AI_001
  severity ENUM('critical', 'error', 'warning') NOT NULL,
  message TEXT NOT NULL,

  -- 컨텍스트
  academy_id INT NULL,
  academy_name VARCHAR(100) NULL,
  user_id INT NULL,
  user_email VARCHAR(100) NULL,
  page_url VARCHAR(500) NULL,
  action VARCHAR(100) NULL,

  -- 기술 정보
  stack_trace TEXT NULL,
  browser VARCHAR(100) NULL,
  os VARCHAR(50) NULL,
  app_version VARCHAR(20) NULL,
  request_id VARCHAR(50) NULL,
  extra JSON NULL,

  -- AI 분석 결과
  ai_analysis JSON NULL,              -- Gemini 분석 결과 저장
  ai_urgency ENUM('critical', 'high', 'medium', 'low') NULL,
  ai_analyzed_at DATETIME NULL,

  -- 해결 정보 (과거 해결 이력 참고용)
  is_resolved BOOLEAN DEFAULT FALSE,
  resolution_note TEXT NULL,          -- 해결 방법 기록
  resolved_at DATETIME NULL,
  resolved_by VARCHAR(100) NULL,      -- 해결한 사람

  -- 알림 상태
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at DATETIME NULL,

  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_error_code (error_code),
  INDEX idx_severity (severity),
  INDEX idx_academy_id (academy_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_resolved (is_resolved),
  INDEX idx_ai_urgency (ai_urgency)
);
```

### 8.2 error_alert_history 테이블

```sql
CREATE TABLE error_alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_code VARCHAR(20) NOT NULL,
  academy_id INT NULL,
  alert_type ENUM('individual', 'summary', 'suppressed') NOT NULL,
  message_sent TEXT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_error_academy (error_code, academy_id),
  INDEX idx_created_at (created_at)
);
```

---

## 9. 알림 발송 제외 조건

### 9.1 무시할 에러

```python
IGNORED_ERRORS = [
    # 사용자 의도적 행동
    'AUTH_001',  # 토큰 만료 (자동 갱신됨)

    # 일시적 네트워크 이슈
    'NET_001' if retry_count < 3,

    # 개발/테스트 환경
    if environment == 'development',
    if academy_name.contains('테스트'),
]
```

### 9.2 업무 시간 외 처리

```python
# 새벽 2시 ~ 6시는 Warning 알림 집계만
if 2 <= current_hour < 6:
    if severity == 'warning':
        queue_for_morning_summary()
    else:
        send_immediately()  # critical/error는 즉시
```

---

## 10. 모니터링 대시보드 연동

### 10.1 어드민 페이지 표시 항목

- 오늘 에러 발생 현황 (severity별)
- 최근 24시간 에러 트렌드 그래프
- 가장 많이 발생한 에러 TOP 5
- 가장 영향받은 학원 TOP 5

### 10.2 실시간 알림 배지

```
알림 관리 페이지 헤더에 실시간 에러 카운트 배지 표시
- Critical: 빨간색 배지 (깜빡임)
- Error: 주황색 배지
```

---

## 11. 구현 일정 (예상)

| 단계 | 작업 | 예상 |
|------|------|------|
| 1 | DB 스키마 생성 | - |
| 2 | 백엔드 에러 리포트 API | - |
| 3 | 텔레그램 발송 로직 | - |
| 4 | 프론트엔드 에러 핸들러 | - |
| 5 | 중복 방지 로직 | - |
| 6 | 테스트 및 배포 | - |

---

## 12. 참고 사항

### 기존 텔레그램 설정

```
TELEGRAM_BOT_TOKEN: 환경변수
TELEGRAM_CHAT_ID: 환경변수
발송 유틸: /backend/utils/telegram_notifier.py
```

### 관련 파일

```
/backend/utils/telegram_notifier.py  - 텔레그램 발송
/backend/utils/alert_deduplicator.py - 중복 방지
/backend/config/alert_thresholds.py  - 임계값 설정
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-23 | 초기 스펙 작성 |
| 1.1 | 2026-01-23 | 카카오 알림톡 실패 즉시 알림, Gemini AI 분석, 중복 방지 로직 개선 |
| 1.2 | 2026-01-23 | Gemini 분석 시 에러 로그 포함 (유사 에러, 연관 에러, 해결 이력) |

---

**작성일**: 2026-01-23
**작성자**: Friday (AI Assistant)
**버전**: 1.2
