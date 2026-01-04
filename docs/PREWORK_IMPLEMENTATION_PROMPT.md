# TutorNote Master Admin 대시보드 개선 - Pre-work 구현 요청

## 🎯 역할 및 목적

당신은 TutorNote Master Admin 대시보드 개선 프로젝트의 Pre-work 단계를 구현하는 백엔드 개발자입니다.

**목적**: Phase 1 구현 시작 전에 필요한 기반 코드와 설정을 완성하여 안정적인 개발 기반을 마련합니다.

---

## 📄 필수 참고 문서

구현 전 반드시 아래 기획서를 읽고 이해해야 합니다:

- **파일 경로**: `DASHBOARD_REDESIGN_SPEC.md` (이 프롬프트와 같은 디렉토리)
- **주요 섹션**:
  - **섹션 7.1**: Pre-work 전체 설명 및 구현 가이드 ⭐ (가장 중요)
  - **섹션 9.5**: 텔레그램 알림 구현 (참고용)
  - **섹션 8**: 구현 단계별 계획 (전체 맥락 이해용)

**읽는 방법**:
```bash
# 전체 문서 훑어보기
cat DASHBOARD_REDESIGN_SPEC.md

# 섹션 7.1만 집중해서 읽기 (라인 1518~2077)
sed -n '1518,2077p' DASHBOARD_REDESIGN_SPEC.md
```

---

## ✅ Pre-work 작업 목록

아래 4개 작업을 순서대로 완료해주세요:

### 1. Alert 중복 방지 로직 구현

**파일**: `backend/utils/alert_deduplicator.py`

**요구사항**:
- `AlertDeduplicator` 클래스 구현
  - `should_send_alert(alert_key: str, cooldown_minutes: int = 60) -> bool`: 발송 가능 여부 체크
  - `reset_alert(alert_key: str)`: 특정 알림 강제 리셋
  - `clear_old_alerts(hours: int = 24)`: 24시간 이상 오래된 알림 기록 삭제
- 싱글톤 패턴으로 `alert_deduplicator` 인스턴스 export
- Docstring 및 타입 힌트 필수

**참고**: 기획서 섹션 7.1.1에 전체 코드 있음 (그대로 복사 가능)

**테스트 코드**: `backend/tests/test_alert_deduplicator.py`
- 같은 알림 60분 내 재발송 방지 확인
- Cooldown 시간 커스터마이즈 확인
- `reset_alert()` 동작 확인

---

### 2. Alert 임계값 Config 파일 구현

**파일**: `backend/config/alert_thresholds.py`

**요구사항**:
- `SYSTEM_THRESHOLDS` 딕셔너리 (CPU, RAM, Disk, Backend 재시작 임계값)
- `BUSINESS_THRESHOLDS` 딕셔너리 (무활동 일수, 학부모 열람률 등)
- `ALERT_COOLDOWN` 딕셔너리 (Alert별 재발송 방지 시간)
- `TELEGRAM_NOTIFICATION` 딕셔너리 (텔레그램 알림 설정)
- `get_threshold(category: str, metric: str, level: str) -> int` 함수
- `get_cooldown(alert_type: str) -> int` 함수
- Docstring 및 사용 예시 필수

**참고**: 기획서 섹션 7.1.2에 전체 코드 있음 (그대로 복사 가능)

**임계값 기본값** (기획서 참고):
- CPU Critical: 90%
- Backend 재시작 Critical: 100회
- 무활동 학원 Warning: 14일, Critical: 30일
- CPU Critical Alert Cooldown: 60분

---

### 3. 텔레그램 배포 알림 기능 구현

**파일**: `backend/utils/deployment_notifier.py`

**요구사항**:
- `DeploymentNotifier` 클래스 (static 메서드만 사용)
  - `notify_phase_complete(phase: str, completed_tasks: List[str])`: Phase 완료 알림
  - `notify_deployment_start(environment: str, version: str)`: 배포 시작 알림
  - `notify_deployment_complete(environment: str, version: str, changes: List[str], dashboard_url: str)`: 배포 완료 알림
  - `notify_deployment_failed(environment: str, version: str, error: str)`: 배포 실패 알림
- 싱글톤 패턴으로 `deployment_notifier` 인스턴스 export
- 기존 `telegram_notifier` 모듈 import 및 사용 (`from utils.telegram_notifier import telegram_notifier`)

**참고**: 기획서 섹션 7.1.3에 전체 코드 있음 (그대로 복사 가능)

**메시지 포맷 예시** (기획서 참고):
```
✅ **Phase 1: 긴급 수정 구현 완료!**

**완료된 작업**:
  1. ✓ DB 스키마 생성
  2. ✓ Claude API 추적
  ...

⏰ 2026-01-05 14:30:00

🚀 다음 단계로 진행 가능합니다.
```

---

### 4. Staging 환경 셋업 스크립트 (선택적)

**파일**: `scripts/setup_staging.sh`

**요구사항**:
- Staging DB 생성 (tutornote_staging)
- 프로덕션 DB 데이터 복사
- `.env.staging` 파일 생성 (템플릿 제공)
- Staging 서버 실행 명령어 출력

**참고**: 기획서 섹션 7.1.4 참고

**스크립트 예시**:
```bash
#!/bin/bash
# Staging 환경 셋업 스크립트

echo "🔵 Staging 환경 셋업 시작..."

# 1. Staging DB 생성
echo "📦 Staging DB 생성 중..."
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tutornote_staging;"

# 2. 프로덕션 데이터 복사
echo "📋 프로덕션 데이터 복사 중..."
mysqldump -u root -p tutornote > /tmp/tutornote_backup.sql
mysql -u root -p tutornote_staging < /tmp/tutornote_backup.sql
rm /tmp/tutornote_backup.sql

# 3. .env.staging 파일 생성
cat > .env.staging << EOF
NODE_ENV=staging
DATABASE_URL=mysql://user:pass@localhost:3306/tutornote_staging
TELEGRAM_CHAT_ID=staging_test_chat_id
MASTER_ADMIN_URL=http://localhost:3005
EOF

echo "✅ Staging 환경 셋업 완료!"
echo ""
echo "🚀 Staging 서버 실행 명령어:"
echo "   cd frontend && npm run build && pm2 start npm --name tutornote-admin-staging -- start -- -p 3005"
```

---

## 📁 예상 파일 구조

Pre-work 완료 후 다음 파일들이 생성됩니다:

```
backend/
├── utils/
│   ├── alert_deduplicator.py          # ✅ 작업 1
│   ├── deployment_notifier.py         # ✅ 작업 3
│   └── telegram_notifier.py           # (기존 파일, 참고용)
├── config/
│   └── alert_thresholds.py            # ✅ 작업 2
└── tests/
    └── test_alert_deduplicator.py     # ✅ 작업 1 테스트

scripts/
└── setup_staging.sh                    # ✅ 작업 4 (선택적)

.env.staging                            # ✅ 작업 4에서 생성
```

---

## 🧪 완료 조건 (Definition of Done)

모든 작업이 완료되면 아래 조건을 만족해야 합니다:

### 필수 조건

1. **파일 생성 완료**
   - [ ] `backend/utils/alert_deduplicator.py` 존재
   - [ ] `backend/config/alert_thresholds.py` 존재
   - [ ] `backend/utils/deployment_notifier.py` 존재
   - [ ] `backend/tests/test_alert_deduplicator.py` 존재

2. **코드 품질**
   - [ ] 모든 함수에 Docstring 작성됨
   - [ ] 타입 힌트 사용 (`from typing import Dict, List, Optional` 등)
   - [ ] 기획서의 코드 예시와 일치 (복사 가능)

3. **테스트 통과**
   - [ ] `pytest backend/tests/test_alert_deduplicator.py -v` 통과
   - [ ] 테스트 커버리지 > 80%

4. **통합 테스트**
   - [ ] 아래 Python 스크립트가 정상 실행됨:
     ```python
     # test_prework.py
     from utils.alert_deduplicator import alert_deduplicator
     from config.alert_thresholds import get_threshold, get_cooldown
     from utils.deployment_notifier import deployment_notifier
     
     # Alert 중복 방지 테스트
     assert alert_deduplicator.should_send_alert("test_alert") == True
     assert alert_deduplicator.should_send_alert("test_alert") == False
     
     # Config 테스트
     assert get_threshold('system', 'cpu', 'critical') == 90
     assert get_cooldown('cpu_critical') == 60
     
     # 배포 알림 테스트 (실제 텔레그램 발송 안함, dry-run)
     print("✅ Pre-work 모든 테스트 통과!")
     ```

### 선택적 조건

5. **Staging 환경**
   - [ ] `scripts/setup_staging.sh` 실행 가능
   - [ ] `.env.staging` 파일 생성됨
   - [ ] Staging DB (tutornote_staging) 생성됨

---

## 🚨 주의사항

### 1. 기존 코드 충돌 방지

- `utils/telegram_notifier.py`는 이미 존재하는 파일입니다. **절대 수정하지 마세요.**
- 새로 만드는 파일들은 기존 파일을 import만 해서 사용합니다.

```python
# ✅ 올바른 방법
from utils.telegram_notifier import telegram_notifier
deployment_notifier.send_message(...)

# ❌ 잘못된 방법 - telegram_notifier.py 파일 수정하지 말 것
```

### 2. Python 버전 및 의존성

- Python 3.9 이상 사용
- 새로운 외부 라이브러리 설치 **금지** (표준 라이브러리만 사용)
- 사용 가능 모듈: `datetime`, `typing`, `json`, `os`

### 3. 환경 변수

텔레그램 관련 환경변수는 이미 설정되어 있다고 가정:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

**새로운 환경변수 추가 필요 없음!**

### 4. 파일 경로

모든 파일 경로는 프로젝트 루트(`/home/tutornote/`)를 기준으로 합니다:
- Backend 파일: `/home/tutornote/backend/`
- 스크립트: `/home/tutornote/scripts/`

---

## 📝 구현 가이드

### Step 1: 기획서 읽기 (10분)

```bash
# 작업 디렉토리로 이동
cd /home/tutornote

# 기획서 읽기 (섹션 7.1 집중)
less DASHBOARD_REDESIGN_SPEC.md
# 또는
cat DASHBOARD_REDESIGN_SPEC.md | grep -A 200 "### 7.1"
```

### Step 2: 디렉토리 생성

```bash
# 필요한 디렉토리 생성
mkdir -p backend/utils
mkdir -p backend/config
mkdir -p backend/tests
```

### Step 3: 파일 작성 (기획서 코드 복사)

**작업 1**: `backend/utils/alert_deduplicator.py` 작성
- 기획서 섹션 7.1.1의 전체 코드 복사
- 주석 및 Docstring 그대로 유지

**작업 2**: `backend/config/alert_thresholds.py` 작성
- 기획서 섹션 7.1.2의 전체 코드 복사
- 임계값 기본값 확인

**작업 3**: `backend/utils/deployment_notifier.py` 작성
- 기획서 섹션 7.1.3의 전체 코드 복사
- `telegram_notifier` import 확인

**작업 4**: `backend/tests/test_alert_deduplicator.py` 작성 (테스트 코드 작성 필요)

### Step 4: 테스트 실행

```bash
# pytest 설치 (없으면)
pip install pytest --break-system-packages

# 테스트 실행
cd /home/tutornote/backend
pytest tests/test_alert_deduplicator.py -v

# 통합 테스트
python test_prework.py
```

### Step 5: 완료 보고 (텔레그램 알림)

```python
# 완료 보고 스크립트 실행
from utils.deployment_notifier import deployment_notifier

deployment_notifier.notify_phase_complete(
    "Pre-work: 구현 준비",
    [
        "Alert 중복 방지 로직 구현",
        "Alert 임계값 Config 파일 작성",
        "텔레그램 배포 알림 기능 구현",
        "Staging 환경 셋업 스크립트 작성",
        "모든 테스트 통과 ✅"
    ]
)
```

---

## ✅ 최종 체크리스트

구현 완료 후 아래 모든 항목을 확인해주세요:

- [ ] 기획서 `DASHBOARD_REDESIGN_SPEC.md` 섹션 7.1 읽음
- [ ] `alert_deduplicator.py` 작성 완료 (기획서 코드 복사)
- [ ] `alert_thresholds.py` 작성 완료 (기획서 코드 복사)
- [ ] `deployment_notifier.py` 작성 완료 (기획서 코드 복사)
- [ ] `test_alert_deduplicator.py` 작성 및 테스트 통과
- [ ] 통합 테스트 스크립트 실행 성공
- [ ] (선택) `setup_staging.sh` 스크립트 작성
- [ ] 텔레그램으로 "Pre-work 완료" 알림 발송

**모든 체크리스트 완료 시 → Phase 1 구현 시작 가능!** 🚀

---

## 💬 질문/이슈 발생 시

1. **기획서 내용 불명확**: 기획서 해당 섹션 다시 읽기 (`DASHBOARD_REDESIGN_SPEC.md`)
2. **파일 경로 에러**: 프로젝트 루트가 `/home/tutornote/`인지 확인
3. **Import 에러**: `sys.path`에 `backend/` 디렉토리 추가
4. **텔레그램 발송 실패**: 환경변수 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 확인

---

**구현 시작 시간**: (기록용)  
**구현 완료 예상 시간**: 2-3시간  
**실제 완료 시간**: (기록용)

**화이팅! 🚀**
