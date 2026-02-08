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

# 파일 관련
FILE_001: 업로드 실패
FILE_002: 파일 크기 초과
FILE_003: 지원하지 않는 형식

# 네트워크 관련
NET_001: 연결 타임아웃
NET_002: 서버 응답 없음
NET_003: CORS 에러
```

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

### 5.1 Deduplication 규칙

| 조건 | 쿨다운 |
|------|--------|
| 동일 error_code + 동일 academy_id | 5분 |
| 동일 error_code (전체) | 1분 |
| Critical 에러 | 중복 방지 없음 (모두 발송) |

### 5.2 Rate Limiting

```
- 분당 최대 발송: 10건
- 시간당 최대 발송: 100건
- 초과 시: 집계하여 1시간 뒤 요약 발송
```

### 5.3 Alert Suppression (알림 억제)

```python
# 동일 에러가 짧은 시간 내 대량 발생 시
if same_error_count >= 5 in last_5_minutes:
    send_summary_alert()  # "AI_001 에러 5건 이상 발생 중"
    suppress_individual_alerts(duration=10min)
```

---

## 6. 구현 범위

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

  -- 알림 상태
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at DATETIME NULL,

  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_error_code (error_code),
  INDEX idx_severity (severity),
  INDEX idx_academy_id (academy_id),
  INDEX idx_created_at (created_at)
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

**작성일**: 2026-01-23
**작성자**: Friday (AI Assistant)
**버전**: 1.0
