# Phase 3: AI Intelligence Layer 기획서

> **TutorNote Master Admin - AI 기반 운영 자동화 시스템**
> 
> 작성일: 2026-01-05
> 버전: 1.3
> 작성자: Claude PM
> 선행 문서: `DASHBOARD_REDESIGN_SPEC.md` (Phase 2)
> 상태: ✅ **착수 승인 완료**

---

## 📑 목차

1. [개요](#1-개요)
2. [Phase 2와의 연결성](#2-phase-2와의-연결성)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [AI 컴포넌트 상세 설계](#5-ai-컴포넌트-상세-설계)
6. [자동 실행 설정 (Cron)](#6-자동-실행-설정-cron)
7. [API 엔드포인트](#7-api-엔드포인트)
8. [대시보드 UI 통합](#8-대시보드-ui-통합)
9. [비용 시뮬레이션](#9-비용-시뮬레이션)
10. [구현 체크리스트](#10-구현-체크리스트)
11. [향후 로드맵 연계](#11-향후-로드맵-연계)

---

## 1. 개요

### 1.1 배경

Phase 2에서 구축된 **Master Admin 대시보드**는 Critical Alerts, 핵심 지표 카드, 이탈 위험 학원 섹션을 통해 **"무엇이 일어나고 있는지"**를 보여줍니다. 

Phase 3는 여기에 **AI Intelligence Layer**를 추가하여:
- **"왜 이런 일이 일어났는지"** 분석하고
- **"어떻게 대응해야 하는지"** 전략을 제안하며
- **"무엇을 말해야 하는지"** 메시지를 생성합니다.

### 1.2 목적

TutorNote 운영을 **"수동 모니터링"**에서 **"AI 기반 인텔리전스"**로 진화시켜, 위기 신호를 자동 감지하고 즉각적인 대응 전략을 제안하는 시스템 구축

### 1.3 핵심 가치

| 가치 | 설명 | 측정 지표 |
|------|------|----------|
| **시간 절약** | 매일 30분+ 운영 분석 → 1분 (AI 리포트 확인) | 운영 분석 시간 90% 단축 |
| **조기 경보** | 이탈 신호를 7일 전에 감지 | 이탈 예측 정확도 80%+ |
| **자동화 대응** | AI가 Playbook + 메시지 초안 생성 | 대응 메시지 작성 시간 95% 단축 |
| **데이터 기반** | 감이 아닌 데이터로 의사결정 | 의사결정 속도 50% 향상 |

### 1.4 기술 결정사항

| 항목 | 결정 | 근거 |
|------|------|------|
| AI 모델 | **Gemini 2.5 Flash-Lite** | 무료 티어 사용, 기존 인프라 활용 |
| API 키 | 기존 `GOOGLE_API_KEY` 사용 | 이미 TutorNote에서 사용 중 ✅ |
| 라이브러리 | `google-generativeai` | 이미 설치됨 ✅ |
| 예상 월 비용 | **₩0** (무료 티어) | 1,500 req/day 충분 |
| 구현 소요 | 4일 (Day 17-20) | Quick Win 범위 |
| 알림 채널 | 텔레그램 봇 | Phase 2에서 이미 설정 완료 |

> **💡 비용 절감 효과**: Claude Haiku 대비 100% 절감 (₩130 → ₩0)

---

## 2. Phase 2와의 연결성

### 2.1 Phase 2 산출물 활용

Phase 2에서 구축된 인프라를 **그대로 활용**합니다:

| Phase 2 산출물 | Phase 3 활용 |
|---------------|-------------|
| `reports` 테이블 | AI Analyst 데이터 소스 (리포트 생성 패턴 분석) |
| `share_logs` 테이블 | AI Analyst 데이터 소스 (카톡 공유 패턴 분석) |
| `gemini_usage_logs` 테이블 | AI 비용 추적 (purpose 컬럼 추가만 필요) |
| `server_metrics` 테이블 | 시스템 상태 모니터링 |
| Critical Alerts 섹션 | AI Intelligence 알림 통합 표시 |
| 이탈 위험 학원 섹션 | AI 분석 결과 + 권장 액션 표시 |
| 텔레그램 봇 설정 | 일일 인텔리전스 발송 채널 (환경변수 설정 필요) |

> ⚠️ **텔레그램 환경변수 필요**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### 2.2 데이터 흐름

```
Phase 2 (Data Layer)                    Phase 3 (AI Layer)
────────────────────                    ──────────────────
┌─────────────────┐                     ┌─────────────────┐
│ reports         │ ──────────────────► │ AI Analyst      │
│ - 리포트 생성   │                     │ - 패턴 분석     │
│ share_logs      │                     │ - 이상 감지     │
│ - 카톡 공유     │                     └────────┬────────┘
└─────────────────┘                              │
                                                 ▼
┌─────────────────┐                     ┌─────────────────┐
│ (Phase 3 신규)  │ ◄────────────────── │ AI Strategist   │
│ ai_intelligence │     (Playbook       │ - 대응 전략     │
│ _logs           │      자동 생성)     │ - 4단계 시나리오│
└─────────────────┘                     └────────┬────────┘
                                                 │
┌─────────────────┐                              ▼
│ 대시보드 UI     │                     ┌─────────────────┐
│ - AI Intel      │ ◄────────────────── │ AI Executor     │
│   Panel 섹션    │     (메시지 초안    │ - 메시지 생성   │
│ - 이탈 위험     │      + 승인 요청)   │ - 승인 워크플로우│
│   학원 섹션     │                     └─────────────────┘
└─────────────────┘
```

### 2.3 Phase 2 Alert Rule과의 통합

Phase 2에서 정의한 **Alert Rule**을 AI Strategist의 트리거로 사용:

| Phase 2 Alert | 임계값 | Phase 3 AI 액션 |
|---------------|--------|-----------------|
| 무활동 학원 7일 | 🟢 정상 | 모니터링만 |
| 무활동 학원 14일 | 🟡 주의 | AI Analyst 분석 시작 |
| 무활동 학원 21일 | 🟠 경고 | AI Strategist Playbook 생성 |
| 무활동 학원 30일 | 🔴 이탈 | AI Executor 메시지 생성 + 승인 요청 |
| 학부모 열람률 < 30% | 🟡 주의 | 개선 팁 자동 생성 |
| 학부모 열람률 < 20% | 🔴 긴급 | 긴급 Playbook 생성 |
| 헤비유저 감지 | 💰 기회 | 감사 메시지 + 업그레이드 제안 |

### 2.4 기존 Cron 작업과의 통합

Phase 2 Crontab 설정에 Phase 3 작업 추가:

```bash
# Phase 2 기존 작업
*/5 * * * * /usr/bin/python3 /home/tutornote/scripts/health_check.py
0 2 * * * /usr/bin/python3 /home/tutornote/scripts/daily_aggregation.py
0 3 1 * * /usr/bin/python3 /home/tutornote/scripts/monthly_aggregation.py
0 4 * * * /usr/local/bin/backup_db.sh

# Phase 3 추가 작업
0 9 * * * /usr/bin/python3 /home/tutornote/scripts/daily_intelligence.py  # 매일 오전 9시 AI 인텔리전스
```

---

## 3. 시스템 아키텍처

### 3.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Master Admin Dashboard (Phase 2)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🚨 Critical Alerts (상단 고정)                                      │  │
│  │   - 시스템 문제 (Phase 2)                                          │  │
│  │   - 비즈니스 주의 (Phase 2)                                        │  │
│  │   - AI 인사이트 (Phase 3 추가) ← NEW                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📊 핵심 지표 카드 (4x3 Grid) - Phase 2                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 AI Intelligence Panel (Phase 3 추가) ← NEW                      │  │
│  │   - 오늘의 인사이트                                                │  │
│  │   - 권장 액션                                                      │  │
│  │   - Playbook 바로가기                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 📋 이탈 위험 학원 (Phase 2)                                        │  │
│  │   + AI 분석 결과 표시 (Phase 3 확장) ← ENHANCED                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ 텔레그램 알림
┌─────────────────────────────┼───────────────────────────────────────────┐
│                    AI Intelligence Layer (Phase 3)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────────┐ │
│  │ AI Analyst   │ │ AI Strategist│ │ AI Executor                      │ │
│  │ (분석가)      │ │ (전략가)     │ │ (실행자)                         │ │
│  │              │ │              │ │                                  │ │
│  │ - 일일 리포트 │ │ - Playbook   │ │ - 메시지 생성                    │ │
│  │ - 패턴 분석  │ │ - 대응 전략  │ │ - 발송 승인 요청                 │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────────────┘ │
│                              ▲                                           │
│                              │ Gemini 2.5 Flash-Lite (무료 티어)         │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────┐
│                       Data Layer (Phase 2 구축 완료)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────────┐ │
│  │ academies    │ │ reports      │ │ gemini_usage_logs                │ │
│  │ students     │ │ share_logs   │ │   + purpose 컬럼 (Phase 3 추가)  │ │
│  │ attendance   │ │ share_views  │ │ server_metrics                   │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Phase 3 신규 테이블                                                │   │
│  │ - ai_intelligence_logs (AI 생성 로그)                              │   │
│  │ - customer_health_scores (고객 건강도)                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 파일 구조
```
backend/
├── services/
│   └── ai_intelligence/
│       ├── __init__.py
│       ├── analyst.py          # AI Analyst 클래스
│       ├── strategist.py       # AI Strategist 클래스
│       ├── executor.py         # AI Executor 클래스
│       ├── prompts.py          # 모든 프롬프트 관리
│       ├── usage_tracker.py    # 사용량 추적
│       └── utils.py            # 공통 유틸리티
├── scripts/
│   └── daily_intelligence.py   # Cron 실행 스크립트
└── routes/
    └── admin/
        └── ai_intelligence.py  # API 엔드포인트
```

---

## 4. 데이터베이스 스키마

### 4.1 Phase 2 기존 테이블 활용

Phase 2에서 구축된 테이블을 **그대로 활용**합니다:

```sql
-- Phase 2에서 이미 생성된 테이블들 (변경 없음)
-- reports: 리포트 생성 기록
-- share_logs: 카톡 공유 기록
-- share_views: 카톡 공유 조회
-- server_metrics: 서버 상태 기록

-- Phase 2에서 생성된 gemini_usage_logs 구조 확인
DESCRIBE gemini_usage_logs;
-- id, academy_id, model, input_tokens, output_tokens, cost_usd, cost_krw, created_at
```

### 4.2 gemini_usage_logs 테이블 확장

```sql
-- 기존 테이블에 purpose 컬럼 추가
ALTER TABLE gemini_usage_logs 
ADD COLUMN purpose VARCHAR(50) DEFAULT 'report-generation' AFTER model;

-- 인덱스 추가 (비용 조회 최적화)
CREATE INDEX idx_gemini_usage_purpose ON gemini_usage_logs(purpose, created_at);

-- purpose 값 정의:
-- 'report-generation': AI 피드백 리포트 생성 (기존)
-- 'daily-intelligence': 일일 인텔리전스 생성
-- 'playbook-generation': Playbook 대응 전략 생성
-- 'message-generation': 개인화 메시지 생성
```

### 4.3 ai_intelligence_logs 테이블 (신규)

```sql
CREATE TABLE ai_intelligence_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- 분류
    type ENUM('daily', 'alert', 'playbook', 'message') NOT NULL,
    
    -- 대상
    academy_id INT NULL,
    
    -- 내용
    input_data JSON NOT NULL COMMENT '입력 데이터',
    output_content TEXT NOT NULL COMMENT 'AI 생성 결과',
    
    -- 메타데이터
    model VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash-lite',
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_krw DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '무료 티어 사용 시 0',
    
    -- 액션 추적
    action_taken BOOLEAN DEFAULT FALSE,
    action_note TEXT NULL,
    action_at DATETIME NULL,
    
    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_type_created (type, created_at),
    INDEX idx_academy (academy_id),
    
    FOREIGN KEY (academy_id) REFERENCES academies(id)
);
```

### 4.4 customer_health_scores 테이블 (신규)

```sql
CREATE TABLE customer_health_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academy_id INT NOT NULL,
    
    -- 점수 (각 100점 만점)
    total_score DECIMAL(5,2) NOT NULL,
    activity_score DECIMAL(5,2) NOT NULL COMMENT '활동성 (30%)',
    engagement_score DECIMAL(5,2) NOT NULL COMMENT '참여도 (30%)',
    performance_score DECIMAL(5,2) NOT NULL COMMENT '성과 (20%)',
    growth_score DECIMAL(5,2) NOT NULL COMMENT '성장성 (20%)',
    
    -- 상태
    status ENUM('champion', 'healthy', 'at_risk', 'critical') NOT NULL,
    
    -- 변화 추적
    previous_score DECIMAL(5,2) NULL,
    score_change DECIMAL(5,2) NULL,
    
    -- 타임스탬프
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_academy_date (academy_id, calculated_at),
    INDEX idx_status (status),
    
    FOREIGN KEY (academy_id) REFERENCES academies(id)
);
```

---

## 5. AI 컴포넌트 상세 설계

### 5.1 AI Analyst (분석가)

#### 5.1.1 역할
- 매일 오전 9시 **일일 인텔리전스 리포트** 생성
- 위기/기회/패턴 신호 감지 및 해석
- 실행 가능한 액션 아이템 우선순위 제안

#### 5.1.2 구현 코드

```python
# backend/services/ai_intelligence/analyst.py

import os
import json
from datetime import datetime, timedelta
import google.generativeai as genai
from ..database import get_db_connection
from .prompts import ANALYST_SYSTEM_PROMPT, ANALYST_USER_PROMPT
from .usage_tracker import AIUsageTracker

class AIAnalyst:
    """AI 기반 일일 인텔리전스 생성"""
    
    def __init__(self):
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-lite",
            system_instruction=ANALYST_SYSTEM_PROMPT
        )
        self.usage_tracker = AIUsageTracker()
    
    async def generate_daily_intelligence(self):
        """일일 인텔리전스 리포트 생성"""
        
        # 1. 데이터 수집
        data = await self._collect_data()
        
        # 2. AI 분석 요청
        user_prompt = ANALYST_USER_PROMPT.format(
            data=json.dumps(data, ensure_ascii=False, indent=2),
            today=datetime.now().strftime('%Y-%m-%d')
        )
        
        response = self.model.generate_content(user_prompt)
        
        # 3. 사용량 추적 (무료 티어이므로 토큰만 기록)
        usage_metadata = response.usage_metadata
        await self.usage_tracker.track(
            purpose="daily-intelligence",
            model="gemini-2.5-flash-lite",
            input_tokens=usage_metadata.prompt_token_count,
            output_tokens=usage_metadata.candidates_token_count
        )
        
        # 4. 로그 저장
        await self._save_log(
            type="daily",
            input_data=data,
            output_content=response.text,
            usage=usage_metadata
        )
        
        return response.text
    
    async def _collect_data(self):
        """분석에 필요한 데이터 수집"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        data = {
            "critical_alerts": await self._get_critical_alerts(cursor),
            "warning_signals": await self._get_warning_signals(cursor),
            "opportunities": await self._get_opportunities(cursor),
            "yesterday_stats": await self._get_yesterday_stats(cursor),
            "academy_health": await self._get_academy_health(cursor),
            "cost_summary": await self._get_cost_summary(cursor)
        }
        
        cursor.close()
        conn.close()
        
        return data
    
    async def _get_critical_alerts(self, cursor):
        """긴급 알림 조회 (7일 무활동 등)"""
        cursor.execute("""
            SELECT 
                a.id,
                a.name,
                a.owner_name,
                DATEDIFF(NOW(), COALESCE(
                    GREATEST(
                        COALESCE((SELECT MAX(r.created_at) FROM reports r WHERE r.academy_id = a.id), '2000-01-01'),
                        COALESCE((SELECT MAX(sl.created_at) FROM share_logs sl WHERE sl.academy_id = a.id), '2000-01-01')
                    ),
                    a.created_at
                )) as days_inactive,
                (SELECT COUNT(*) FROM students s WHERE s.academy_id = a.id AND s.is_deleted = 0) as student_count
            FROM academies a
            WHERE a.is_deleted = 0
            HAVING days_inactive >= 7
            ORDER BY days_inactive DESC
        """)
        
        return cursor.fetchall()
    
    async def _get_warning_signals(self, cursor):
        """주의 신호 조회 (열람률 저조 등)"""
        cursor.execute("""
            SELECT 
                a.id,
                a.name,
                COUNT(r.id) as report_count,
                COUNT(sv.id) as view_count,
                ROUND(COUNT(sv.id) / NULLIF(COUNT(r.id), 0) * 100, 1) as view_rate
            FROM academies a
            LEFT JOIN reports r ON a.id = r.academy_id 
                AND r.created_at >= NOW() - INTERVAL 30 DAY
            LEFT JOIN share_views sv ON r.share_token = sv.share_token
            WHERE a.is_deleted = 0
            GROUP BY a.id
            HAVING report_count > 0 AND view_rate < 30
        """)
        
        return cursor.fetchall()
    
    async def _get_opportunities(self, cursor):
        """기회 신호 조회 (헤비유저 등)"""
        cursor.execute("""
            SELECT 
                a.id,
                a.name,
                COUNT(r.id) as monthly_reports,
                ROUND(COUNT(sv.id) / NULLIF(COUNT(r.id), 0) * 100, 1) as view_rate
            FROM academies a
            LEFT JOIN reports r ON a.id = r.academy_id 
                AND r.created_at >= NOW() - INTERVAL 30 DAY
            LEFT JOIN share_views sv ON r.share_token = sv.share_token
            WHERE a.is_deleted = 0
            GROUP BY a.id
            HAVING monthly_reports >= 20 OR view_rate >= 70
        """)
        
        return cursor.fetchall()
    
    async def _get_yesterday_stats(self, cursor):
        """어제 전체 통계"""
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        
        cursor.execute("""
            SELECT 
                (SELECT COUNT(DISTINCT academy_id) FROM reports 
                 WHERE DATE(created_at) = %s) as active_academies,
                (SELECT COUNT(*) FROM reports 
                 WHERE DATE(created_at) = %s) as reports_created,
                (SELECT COUNT(*) FROM share_views 
                 WHERE DATE(viewed_at) = %s) as share_views,
                (SELECT SUM(cost_krw) FROM gemini_usage_logs 
                 WHERE DATE(created_at) = %s) as api_cost
        """, (yesterday, yesterday, yesterday, yesterday))
        
        return cursor.fetchone()
    
    async def _get_academy_health(self, cursor):
        """학원별 건강도 요약"""
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM customer_health_scores chs
            INNER JOIN (
                SELECT academy_id, MAX(calculated_at) as latest
                FROM customer_health_scores
                GROUP BY academy_id
            ) latest ON chs.academy_id = latest.academy_id 
                AND chs.calculated_at = latest.latest
            GROUP BY status
        """)
        
        return cursor.fetchall()
    
    async def _get_cost_summary(self, cursor):
        """이번 달 비용 요약"""
        cursor.execute("""
            SELECT 
                purpose,
                SUM(cost_krw) as total_cost,
                COUNT(*) as request_count
            FROM gemini_usage_logs
            WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
            GROUP BY purpose
        """)
        
        return cursor.fetchall()
    
    async def _save_log(self, type, input_data, output_content, usage):
        """인텔리전스 로그 저장"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cost = self._calculate_cost(usage.input_tokens, usage.output_tokens)
        
        cursor.execute("""
            INSERT INTO ai_intelligence_logs 
            (type, input_data, output_content, model, input_tokens, output_tokens, cost_krw)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            type,
            json.dumps(input_data, ensure_ascii=False),
            output_content,
            self.model,
            usage.input_tokens,
            usage.output_tokens,
            cost
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
    
    def _calculate_cost(self, input_tokens, output_tokens):
        """Gemini 2.5 Flash-Lite 무료 티어 - 비용 없음"""
        # 무료 티어 사용 중이므로 비용 0
        # 토큰 사용량만 기록용으로 추적
        return 0.0
```

#### 5.1.3 프롬프트 설계

```python
# backend/services/ai_intelligence/prompts.py

ANALYST_SYSTEM_PROMPT = """당신은 TutorNote 서비스의 운영 분석가입니다.

# 역할
- 서비스 운영 데이터를 분석하고 실행 가능한 인사이트를 제공합니다.
- 위기 신호를 조기에 감지하고 대응 우선순위를 제안합니다.
- 기회 신호를 발견하고 활용 방안을 제시합니다.

# 분석 원칙
1. 단순히 숫자를 나열하지 말고 "왜 이런 현상이 일어났는지" 해석하세요.
2. 각 상황에 대한 "구체적인 액션"을 제안하세요.
3. 우선순위를 명확히 표시하세요 (긴급/중요/보통).
4. 대표님이 오늘 해야 할 일을 3가지로 압축하세요.

# 출력 형식
텔레그램에서 읽기 쉬운 형식으로 작성하세요.
- 이모지 활용
- 구조화된 섹션
- 명확한 액션 아이템
- 전체 길이: 1000자 내외

# 건강도 기준
- 🟢 Champion (90-100점): 적극 사용, 추천 요청 타이밍
- 🔵 Healthy (70-89점): 정상 사용, 업그레이드 제안
- 🟡 At Risk (50-69점): 주의 필요, 체크인 권장
- 🔴 Critical (0-49점): 위험, 즉시 개입 필요
"""

ANALYST_USER_PROMPT = """오늘 ({today}) TutorNote 운영 현황을 분석해주세요.

# 수집된 데이터
{data}

# 요청사항
1. 🔴 긴급 주의 사항 (Critical Alerts)
   - 즉시 조치가 필요한 학원
   - 원인 분석과 권장 조치

2. 🟡 주의 사항 (Warning Signals)
   - 모니터링이 필요한 학원
   - 개선 방안 제안

3. 🟢 긍정 신호 (Opportunities)
   - 헤비유저 또는 추천 가능성
   - 활용 방안

4. 📊 어제 전체 통계 요약
   - 핵심 지표 변화
   - 비용 현황

5. 🎯 오늘의 우선순위 Top 3
   - 가장 먼저 해야 할 액션
   - 예상 소요 시간

텔레그램 메시지 형식으로 작성해주세요."""
```

---

### 5.2 AI Strategist (전략가)

#### 5.2.1 역할
- 위기 상황 발생 시 **대응 Playbook** 자동 생성
- 4단계 (D+7, D+10, D+14, D+21) 대응 시나리오 제안
- 상황별 맞춤 전략 및 메시지 톤 조절

#### 5.2.2 구현 코드

```python
# backend/services/ai_intelligence/strategist.py

import os
import json
import google.generativeai as genai
from .prompts import STRATEGIST_SYSTEM_PROMPT, STRATEGIST_USER_PROMPT
from .usage_tracker import AIUsageTracker
from ..database import get_db_connection

class AIStrategist:
    """AI 기반 대응 전략 생성"""
    
    def __init__(self):
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-lite",
            system_instruction=STRATEGIST_SYSTEM_PROMPT
        )
        self.usage_tracker = AIUsageTracker()
    
    async def generate_playbook(self, situation_type: str, academy_data: dict):
        """상황별 대응 Playbook 생성"""
        
        # 1. 상황 데이터 보강
        enriched_data = await self._enrich_academy_data(academy_data)
        
        # 2. AI 전략 생성
        user_prompt = STRATEGIST_USER_PROMPT.format(
            situation_type=situation_type,
            academy_data=json.dumps(enriched_data, ensure_ascii=False, indent=2)
        )
        
        response = self.model.generate_content(user_prompt)
        
        # 3. 사용량 추적 (무료 티어이므로 토큰만 기록)
        usage_metadata = response.usage_metadata
        await self.usage_tracker.track(
            purpose="playbook-generation",
            model="gemini-2.5-flash-lite",
            input_tokens=usage_metadata.prompt_token_count,
            output_tokens=usage_metadata.candidates_token_count
        )
        
        # 4. 로그 저장
        await self._save_log(
            type="playbook",
            academy_id=academy_data.get('id'),
            input_data={"situation": situation_type, "academy": enriched_data},
            output_content=response.text,
            usage=usage_metadata
        )
        
        return response.text
    
    async def _enrich_academy_data(self, academy_data: dict):
        """학원 데이터에 추가 컨텍스트 보강"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        academy_id = academy_data.get('id')
        
        # 최근 활동 패턴 (reports + share_logs 조합)
        cursor.execute("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as activity_count,
                'report' as action_type
            FROM reports
            WHERE academy_id = %s
            AND created_at >= NOW() - INTERVAL 30 DAY
            GROUP BY DATE(created_at)
            
            UNION ALL
            
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as activity_count,
                'share' as action_type
            FROM share_logs
            WHERE academy_id = %s
            AND created_at >= NOW() - INTERVAL 30 DAY
            GROUP BY DATE(created_at)
            
            ORDER BY date DESC
            LIMIT 14
        """, (academy_id, academy_id))
        
        academy_data['recent_activity'] = cursor.fetchall()
        
        # 리포트 생성 이력
        cursor.execute("""
            SELECT 
                COUNT(*) as total_reports,
                COUNT(CASE WHEN share_token IS NOT NULL THEN 1 END) as shared_reports,
                AVG(CHAR_LENGTH(feedback_content)) as avg_feedback_length
            FROM reports
            WHERE academy_id = %s
            AND created_at >= NOW() - INTERVAL 30 DAY
        """, (academy_id,))
        
        academy_data['report_stats'] = cursor.fetchone()
        
        # 이전 건강도 점수
        cursor.execute("""
            SELECT total_score, status, calculated_at
            FROM customer_health_scores
            WHERE academy_id = %s
            ORDER BY calculated_at DESC
            LIMIT 5
        """, (academy_id,))
        
        academy_data['health_history'] = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return academy_data
    
    async def _save_log(self, type, academy_id, input_data, output_content, usage):
        """Playbook 로그 저장"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cost = self._calculate_cost(usage.input_tokens, usage.output_tokens)
        
        cursor.execute("""
            INSERT INTO ai_intelligence_logs 
            (type, academy_id, input_data, output_content, model, input_tokens, output_tokens, cost_krw)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            type,
            academy_id,
            json.dumps(input_data, ensure_ascii=False),
            output_content,
            self.model,
            usage.input_tokens,
            usage.output_tokens,
            cost
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
    
    def _calculate_cost(self, input_tokens, output_tokens):
        """비용 계산"""
        input_cost = (input_tokens / 1_000_000) * 0.25
        output_cost = (output_tokens / 1_000_000) * 1.25
        total_usd = input_cost + output_cost
        return round(total_usd * 1350, 2)
```

#### 5.2.3 프롬프트 설계

```python
# backend/services/ai_intelligence/prompts.py (계속)

STRATEGIST_SYSTEM_PROMPT = """당신은 SaaS 비즈니스의 고객 성공(Customer Success) 전문가입니다.

# 역할
- 위기 상황에 대한 체계적인 대응 전략을 수립합니다.
- 단계별 Playbook을 작성합니다.
- 고객 심리를 이해하고 효과적인 커뮤니케이션 방안을 제안합니다.

# 상황 유형별 대응 원칙

## 7일 무활동 (inactivity_7d)
- 원인: 기술 문제, 불만족, 휴가, 바쁨
- 접근: 걱정 프레임, 도움 제안, 비난 없이
- 목표: 원인 파악 및 재활성화

## 열람률 저조 (low_engagement)
- 원인: 공유 방법 모름, 학부모 미반응, 시간대 문제
- 접근: 성공 팁 공유, 기능 재안내
- 목표: 열람률 개선으로 가치 체감

## 헤비유저 (heavy_user)
- 상태: 서비스 가치 충분히 체감
- 접근: 감사, 사례 연구, 유료 전환 소프트 제안
- 목표: Champion 유지 및 추천 유도

# 제약사항
- TutorNote는 1인 운영 서비스입니다.
- 시간이 제한적이므로 효율적인 접근이 필요합니다.
- 원장님과의 신뢰 관계 유지가 최우선입니다.

# 출력 형식
각 단계별로 다음을 포함하세요:
- 타이밍 (D+7, D+10 등)
- 채널 (카카오톡, 전화 등)
- 어조 설명
- 메시지 초안 또는 스크립트
- 예상 결과 및 대안
"""

STRATEGIST_USER_PROMPT = """아래 상황에 대한 대응 Playbook을 작성해주세요.

# 상황 유형
{situation_type}

# 학원 정보
{academy_data}

# 요청사항
1. 🔹 1단계: 첫 번째 접촉 (즉시 ~ D+7)
   - 채널, 타이밍, 어조
   - 메시지 초안 (실제 발송 가능한 수준)
   - 예상 반응 및 성공률

2. 🔹 2단계: 후속 조치 (D+10)
   - 1단계 무응답 시 대응
   - 통화 스크립트 (있다면)

3. 🔹 3단계: 가치 재확인 (D+14)
   - 서비스 가치 리마인드
   - 사용 이력 기반 메시지

4. 🔹 4단계: 최종 대응 (D+21)
   - 마지막 제안 또는 우아한 종료
   - 피드백 수집

5. 💡 전략 요약
   - 핵심 접근 방식
   - 성공 가능성 및 리스크

텔레그램으로 전달받을 형식으로 작성해주세요."""
```

---

### 5.3 AI Executor (실행자)

#### 5.3.1 역할
- **개인화된 메시지 초안** 자동 생성
- 학원별 컨텍스트 반영 (이름, 사용 이력, 패턴)
- 발송 전 **승인 요청** (텔레그램)

#### 5.3.2 구현 코드

```python
# backend/services/ai_intelligence/executor.py

import os
import json
import google.generativeai as genai
from .prompts import EXECUTOR_SYSTEM_PROMPT, EXECUTOR_MESSAGE_PROMPT
from .usage_tracker import AIUsageTracker
from ..database import get_db_connection
from ..telegram_notifier import TelegramNotifier

class AIExecutor:
    """AI 기반 자동 실행 (메시지 생성 및 승인 요청)"""
    
    def __init__(self):
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-lite",
            system_instruction=EXECUTOR_SYSTEM_PROMPT
        )
        self.usage_tracker = AIUsageTracker()
        self.telegram = TelegramNotifier()
    
    async def generate_message(self, message_type: str, academy_data: dict):
        """개인화된 메시지 생성"""
        
        # 1. 학원 정보 조회
        enriched_data = await self._get_academy_context(academy_data['id'])
        
        # 2. AI 메시지 생성
        user_prompt = EXECUTOR_MESSAGE_PROMPT.format(
            message_type=message_type,
            academy_name=enriched_data['name'],
            owner_name=enriched_data['owner_name'],
            usage_summary=json.dumps(enriched_data['usage'], ensure_ascii=False)
        )
        
        response = self.model.generate_content(user_prompt)
        
        # 3. 사용량 추적 (무료 티어이므로 토큰만 기록)
        usage_metadata = response.usage_metadata
        await self.usage_tracker.track(
            purpose="message-generation",
            model="gemini-2.5-flash-lite",
            input_tokens=usage_metadata.prompt_token_count,
            output_tokens=usage_metadata.candidates_token_count
        )
        
        message = response.text
        
        # 4. 로그 저장
        await self._save_log(
            type="message",
            academy_id=academy_data['id'],
            input_data={"type": message_type, "academy": enriched_data},
            output_content=message,
            usage=response.usage
        )
        
        return message
    
    async def send_approval_request(self, academy_data: dict, message: str, message_type: str):
        """텔레그램으로 발송 승인 요청"""
        
        approval_message = f"""
🤖 AI 생성 메시지 발송 승인 요청

📋 대상: {academy_data['name']} ({academy_data['owner_name']} 원장님)
📝 유형: {self._get_message_type_label(message_type)}

━━━━━━━━━━━━━━━━━━━━━━
💬 메시지 내용:
{message}
━━━━━━━━━━━━━━━━━━━━━━

이 메시지를 발송하시겠습니까?

/approve_{academy_data['id']} - 승인
/edit_{academy_data['id']} - 수정 후 발송
/reject_{academy_data['id']} - 거절
"""
        
        await self.telegram.send_message(approval_message)
    
    async def _get_academy_context(self, academy_id: int):
        """학원 컨텍스트 조회"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 기본 정보
        cursor.execute("""
            SELECT id, name, owner_name, created_at
            FROM academies
            WHERE id = %s
        """, (academy_id,))
        
        academy = cursor.fetchone()
        
        # 사용 요약
        cursor.execute("""
            SELECT 
                COUNT(r.id) as total_reports,
                COUNT(DISTINCT DATE(r.created_at)) as active_days,
                MAX(r.created_at) as last_report
            FROM reports r
            WHERE r.academy_id = %s
        """, (academy_id,))
        
        academy['usage'] = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return academy
    
    def _get_message_type_label(self, message_type: str):
        """메시지 유형 라벨"""
        labels = {
            'check_in': '체크인 (무활동 학원)',
            'engagement_tips': '열람률 개선 팁',
            'thank_you': '감사 메시지 (헤비유저)',
            'upgrade_soft': 'Pro 플랜 소프트 제안'
        }
        return labels.get(message_type, message_type)
    
    async def _save_log(self, type, academy_id, input_data, output_content, usage):
        """로그 저장"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Gemini 무료 티어 사용 시 비용 0
        cost = self._calculate_cost(usage.prompt_token_count, usage.candidates_token_count)
        
        cursor.execute("""
            INSERT INTO ai_intelligence_logs 
            (type, academy_id, input_data, output_content, model, input_tokens, output_tokens, cost_krw)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            type,
            academy_id,
            json.dumps(input_data, ensure_ascii=False),
            output_content,
            "gemini-2.5-flash-lite",
            usage.prompt_token_count,
            usage.candidates_token_count,
            cost
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
    
    def _calculate_cost(self, input_tokens, output_tokens):
        """비용 계산 - Gemini 2.5 Flash-Lite 무료 티어 사용"""
        # 무료 티어 사용 중이므로 비용 0원
        # 참고: 유료 전환 시 $0.10/1M input, $0.40/1M output
        return 0.0
```

#### 5.3.3 프롬프트 설계

```python
# backend/services/ai_intelligence/prompts.py (계속)

EXECUTOR_SYSTEM_PROMPT = """당신은 TutorNote 고객 소통 담당자입니다.

# 역할
- 원장님께 보낼 개인화된 메시지를 작성합니다.
- 학원명, 원장님 성함, 사용 이력을 자연스럽게 반영합니다.

# 메시지 원칙
1. 간결하게: 3-4문장 이내
2. 친근하게: 존칭 사용, 따뜻한 어조
3. 행동 유도: 명확한 다음 액션 제시
4. 비난 금지: 문제를 지적하지 않고 도움 제안

# 어조
- 친근하지만 프로페셔널
- 이모지 적절히 활용 (1-2개)
- 카카오톡 대화체
"""

EXECUTOR_MESSAGE_PROMPT = """아래 정보를 바탕으로 {message_type} 메시지를 작성해주세요.

# 학원 정보
- 학원명: {academy_name}
- 원장님: {owner_name}
- 사용 요약: {usage_summary}

# 요청
메시지 유형에 맞는 카카오톡 메시지를 작성해주세요.
- 메시지만 출력 (설명 불필요)
- 카카오톡에서 바로 복사-붙여넣기 가능하도록"""
```

---

## 6. 자동 실행 설정 (Cron)

### 6.1 일일 인텔리전스 스크립트

```python
# backend/scripts/daily_intelligence.py

import asyncio
import sys
import os

# 프로젝트 루트 경로 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ai_intelligence.analyst import AIAnalyst
from services.ai_intelligence.strategist import AIStrategist
from services.ai_intelligence.executor import AIExecutor
from services.telegram_notifier import TelegramNotifier

async def run_daily_intelligence():
    """매일 오전 9시 실행되는 일일 인텔리전스"""
    
    print(f"[{datetime.now()}] Daily Intelligence 시작...")
    
    telegram = TelegramNotifier()
    analyst = AIAnalyst()
    strategist = AIStrategist()
    executor = AIExecutor()
    
    try:
        # 1. 일일 인텔리전스 생성
        print("1. AI Analyst 실행 중...")
        report = await analyst.generate_daily_intelligence()
        
        # 2. 텔레그램 발송
        print("2. 텔레그램 발송 중...")
        await telegram.send_message(f"📊 TutorNote 일일 인텔리전스\n\n{report}")
        
        # 3. Critical Alert 있으면 Playbook 자동 생성
        critical_alerts = await analyst._get_critical_alerts(
            get_db_connection().cursor(dictionary=True)
        )
        
        if critical_alerts:
            print(f"3. Critical Alert {len(critical_alerts)}건 - Playbook 생성 중...")
            
            for alert in critical_alerts[:3]:  # 최대 3개까지만
                playbook = await strategist.generate_playbook(
                    situation_type="inactivity_7d",
                    academy_data=alert
                )
                
                # 메시지 초안 생성 및 승인 요청
                message = await executor.generate_message(
                    message_type="check_in",
                    academy_data=alert
                )
                
                await executor.send_approval_request(
                    academy_data=alert,
                    message=message,
                    message_type="check_in"
                )
        
        print(f"[{datetime.now()}] Daily Intelligence 완료!")
        
    except Exception as e:
        error_msg = f"🚨 Daily Intelligence 오류\n\n{str(e)}"
        print(error_msg)
        await telegram.send_message(error_msg)

if __name__ == "__main__":
    asyncio.run(run_daily_intelligence())
```

### 6.2 Phase 2 + Phase 3 통합 Crontab 설정

```bash
# crontab -e

# ===== Phase 2 기존 작업 =====
# 5분마다 시스템 헬스체크
*/5 * * * * /usr/bin/python3 /home/tutornote/scripts/health_check.py >> /var/log/tutornote/health_check.log 2>&1

# 매일 새벽 2시 일일 집계
0 2 * * * /usr/bin/python3 /home/tutornote/scripts/daily_aggregation.py >> /var/log/tutornote/daily_aggregation.log 2>&1

# 매월 1일 새벽 3시 월간 집계
0 3 1 * * /usr/bin/python3 /home/tutornote/scripts/monthly_aggregation.py >> /var/log/tutornote/monthly_aggregation.log 2>&1

# 매일 새벽 4시 DB 백업
0 4 * * * /usr/local/bin/backup_db.sh >> /var/log/tutornote/backup.log 2>&1

# ===== Phase 3 신규 작업 =====
# 매일 오전 9시 AI 일일 인텔리전스
0 9 * * * /usr/bin/python3 /home/tutornote/scripts/daily_intelligence.py >> /var/log/tutornote/daily_intelligence.log 2>&1

# 매시간 고객 건강도 점수 업데이트 (선택적)
0 * * * * /usr/bin/python3 /home/tutornote/scripts/update_health_scores.py >> /var/log/tutornote/health_scores.log 2>&1
```

---

## 7. API 엔드포인트

### 7.1 Phase 2 기존 API와의 관계

Phase 3 API는 Phase 2에서 구축된 `/api/admin/` 경로 아래에 추가됩니다:

```
/api/admin/
├── dashboard/              # Phase 2 (기존)
│   ├── overview
│   ├── alerts
│   └── churn-risk-academies
├── academies/              # Phase 2 (기존)
├── legal/                  # Phase 2 (기존)
├── system/                 # Phase 2 (기존)
└── ai/                     # Phase 3 (신규) ← NEW
    ├── daily-intelligence
    ├── playbook
    ├── message
    ├── logs
    └── cost-summary
```

### 7.2 Master Admin AI Intelligence API

```python
# backend/routes/admin/ai_intelligence.py

from flask import Blueprint, jsonify, request
from services.ai_intelligence.analyst import AIAnalyst
from services.ai_intelligence.strategist import AIStrategist
from services.ai_intelligence.executor import AIExecutor
from middleware.admin_auth import admin_required

ai_bp = Blueprint('ai_intelligence', __name__)

@ai_bp.route('/api/admin/ai/daily-intelligence', methods=['POST'])
@admin_required
async def generate_daily_intelligence():
    """일일 인텔리전스 수동 생성"""
    analyst = AIAnalyst()
    report = await analyst.generate_daily_intelligence()
    
    return jsonify({
        "success": True,
        "report": report
    })

@ai_bp.route('/api/admin/ai/playbook', methods=['POST'])
@admin_required
async def generate_playbook():
    """Playbook 생성"""
    data = request.json
    
    strategist = AIStrategist()
    playbook = await strategist.generate_playbook(
        situation_type=data['situation_type'],
        academy_data=data['academy']
    )
    
    return jsonify({
        "success": True,
        "playbook": playbook
    })

@ai_bp.route('/api/admin/ai/message', methods=['POST'])
@admin_required
async def generate_message():
    """메시지 초안 생성"""
    data = request.json
    
    executor = AIExecutor()
    message = await executor.generate_message(
        message_type=data['message_type'],
        academy_data=data['academy']
    )
    
    return jsonify({
        "success": True,
        "message": message
    })

@ai_bp.route('/api/admin/ai/logs', methods=['GET'])
@admin_required
def get_ai_logs():
    """AI Intelligence 로그 조회"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    type_filter = request.args.get('type', None)
    
    query = """
        SELECT 
            ail.*,
            a.name as academy_name
        FROM ai_intelligence_logs ail
        LEFT JOIN academies a ON ail.academy_id = a.id
    """
    
    params = []
    if type_filter:
        query += " WHERE ail.type = %s"
        params.append(type_filter)
    
    query += " ORDER BY ail.created_at DESC LIMIT %s OFFSET %s"
    params.extend([per_page, (page - 1) * per_page])
    
    cursor.execute(query, params)
    logs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "success": True,
        "logs": logs
    })

@ai_bp.route('/api/admin/ai/cost-summary', methods=['GET'])
@admin_required
def get_cost_summary():
    """AI 비용 요약"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 이번 달 용도별 비용
    cursor.execute("""
        SELECT 
            purpose,
            COUNT(*) as request_count,
            SUM(input_tokens) as total_input_tokens,
            SUM(output_tokens) as total_output_tokens,
            SUM(cost_krw) as total_cost
        FROM gemini_usage_logs
        WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        GROUP BY purpose
    """)
    
    by_purpose = cursor.fetchall()
    
    # 일별 추이
    cursor.execute("""
        SELECT 
            DATE(created_at) as date,
            SUM(cost_krw) as daily_cost
        FROM gemini_usage_logs
        WHERE created_at >= NOW() - INTERVAL 30 DAY
        GROUP BY DATE(created_at)
        ORDER BY date
    """)
    
    daily_trend = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "success": True,
        "by_purpose": by_purpose,
        "daily_trend": daily_trend
    })
```

---

## 8. 대시보드 UI 통합

### 8.1 Phase 2 대시보드에 AI 섹션 추가

Phase 2의 대시보드 레이아웃에 **AI Intelligence Panel**을 추가합니다:

```
┌────────────────────────────────────────────────────────────────┐
│ 🚨 Critical Alerts (Phase 2)                                    │
│   + AI 인사이트 알림 추가 (Phase 3)                              │
├────────────────────────────────────────────────────────────────┤
│ 📊 핵심 지표 카드 4x3 Grid (Phase 2)                            │
├────────────────────────────────────────────────────────────────┤
│ 🤖 AI Intelligence Panel (Phase 3 신규)                         │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 📋 오늘의 인사이트                           [전체 보기 →] │   │
│ │ • 🔴 긴급: 음악학원 23일 무활동 - Playbook 생성됨           │   │
│ │ • 🟡 주의: 열람률 25% 학원 2곳 - 개선 팁 준비됨             │   │
│ │ • 🟢 기회: 헤비유저 1곳 - 감사 메시지 발송 권장             │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ ⚡ 권장 액션 (AI 생성)                                      │   │
│ │ 1. 음악학원 원장님께 체크인 메시지 발송 [메시지 확인 →]     │   │
│ │ 2. 열람률 개선 팁 카카오톡 공유 [팁 보기 →]                 │   │
│ └──────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────┤
│ 📋 이탈 위험 학원 (Phase 2)                                     │
│   + AI 분석 결과 및 Playbook 링크 추가 (Phase 3)                │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 이탈 위험 학원 섹션 확장

Phase 2의 이탈 위험 학원 테이블에 AI 분석 컬럼 추가:

| 학원명 | 마지막 활동 | 무활동 일수 | 상태 | AI 분석 | 액션 |
|--------|------------|------------|------|---------|------|
| 음악학원 | 12/13 | 23일 | 🔴 이탈위험 | Playbook 준비됨 | [Playbook →] [메시지 발송 →] |
| 최종테스트 | 12/25 | 11일 | 🟡 주의 | 모니터링 중 | [상세 →] |

### 8.3 Critical Alerts 확장

Phase 2의 Critical Alerts에 AI 인사이트 유형 추가:

```typescript
// Phase 2 기존 Alert 유형
type AlertCategory = 'system' | 'business';

// Phase 3 확장
type AlertCategory = 'system' | 'business' | 'ai_insight';

interface CriticalAlert {
  id: string;
  category: AlertCategory;
  severity: 'critical' | 'warning' | 'info' | 'opportunity';  // opportunity 추가
  title: string;
  description: string;
  timestamp: Date;
  aiGenerated?: boolean;  // Phase 3 추가
  playbookId?: string;    // Phase 3 추가
  actionButtons: {
    label: string;
    action: string;
    link?: string;
  }[];
}
```

### 8.4 프론트엔드 컴포넌트 구조

```
frontend/
├── app/
│   └── dashboard/
│       └── page.tsx              # Phase 2 기존
├── components/
│   ├── dashboard/
│   │   ├── CriticalAlerts.tsx    # Phase 2 기존 (확장)
│   │   ├── MetricCards.tsx       # Phase 2 기존
│   │   ├── ChurnRiskTable.tsx    # Phase 2 기존 (확장)
│   │   └── AIIntelligencePanel.tsx  # Phase 3 신규 ← NEW
│   └── ai/
│       ├── PlaybookModal.tsx     # Phase 3 신규
│       ├── MessagePreview.tsx    # Phase 3 신규
│       └── InsightCard.tsx       # Phase 3 신규
```

### 8.5 AIIntelligencePanel 컴포넌트

```tsx
// frontend/components/dashboard/AIIntelligencePanel.tsx

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, AlertTriangle, TrendingUp, MessageSquare } from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'critical' | 'warning' | 'opportunity';
  title: string;
  description: string;
  academyId?: number;
  playbookId?: string;
  messageReady?: boolean;
}

export function AIIntelligencePanel() {
  const { data: insights, isLoading } = useSWR('/api/admin/ai/today-insights');
  
  if (isLoading) return <Skeleton />;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Intelligence
        </CardTitle>
        <Button variant="ghost" size="sm">
          전체 보기 →
        </Button>
      </CardHeader>
      <CardContent>
        {/* 오늘의 인사이트 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            오늘의 인사이트
          </h4>
          {insights?.map((insight: AIInsight) => (
            <InsightRow key={insight.id} insight={insight} />
          ))}
        </div>
        
        {/* 권장 액션 */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            ⚡ 권장 액션
          </h4>
          {insights?.filter(i => i.messageReady).map((insight: AIInsight) => (
            <ActionRow key={insight.id} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 9. 비용 시뮬레이션

### 9.1 Gemini 2.5 Flash-Lite 무료 티어 활용

| 항목 | 내용 |
|------|------|
| 모델 | Gemini 2.5 Flash-Lite |
| 가격 | **무료** (Free Tier) |
| Rate Limit | 1,500 requests/day |
| API 키 | 기존 `GOOGLE_API_KEY` 사용 |

### 9.2 예상 사용량 (5개 학원 기준)

| 컴포넌트 | 빈도 | Input/회 | Output/회 | 월 비용 |
|----------|------|----------|-----------|---------|
| AI Analyst | 30회/월 | 2,000 | 1,500 | **₩0** |
| AI Strategist | 8회/월 | 2,500 | 2,000 | **₩0** |
| AI Executor | 20회/월 | 500 | 300 | **₩0** |
| **합계** | 58회/월 | - | - | **₩0** |

> 💡 일일 최대 약 2회 요청 → 1,500 req/day 한도 대비 **0.13% 사용**

### 9.3 확장 시나리오 (무료 티어 내)

| 학원 수 | 월 예상 요청 | 일일 요청 | 무료 티어 커버리지 |
|---------|-------------|----------|-------------------|
| 5개 | 58회 | ~2회 | ✅ 여유 |
| 10개 | 116회 | ~4회 | ✅ 여유 |
| 30개 | 350회 | ~12회 | ✅ 여유 |
| 50개 | 580회 | ~19회 | ✅ 여유 |
| 100개 | 1,160회 | ~39회 | ✅ 여유 |
| **한도** | - | **1,500회** | - |

> 📊 **100개 학원까지 무료 티어 내에서 운영 가능!**

### 9.4 비용 비교 (기존 계획 vs 변경 후)

| 모델 | 월 비용 (5개 학원) | 월 비용 (100개 학원) |
|------|-------------------|---------------------|
| Claude Haiku 4.5 | ₩130 | ₩2,200 |
| **Gemini Flash-Lite** | **₩0** | **₩0** |
| **절감 효과** | **100%** | **100%** |

### 9.5 ROI 분석

```
AI Intelligence 연간 비용: ₩0 (무료 티어)

학원 1개 이탈 방지 가치:
━━━━━━━━━━━━━━━━━━━━━━
월 구독료: ₩24,900
연간 수익: ₩298,800

ROI = 298,800 / 0 = ∞ (무한대)

→ 비용 없이 순수익만 발생!
→ 1개 학원만 이탈 방지해도 연간 ₩298,800 순이익
```

---

## 10. 구현 체크리스트

### 10.1 Day 17: 기반 구축 (Phase 2 완료 후)

**선행 조건**: Phase 2 배포 완료 ✅

| 태스크 | 상세 | 예상 시간 |
|--------|------|----------|
| DB 마이그레이션 | `gemini_usage_logs`에 `purpose` 컬럼 추가 | 15분 |
| 테이블 생성 | `ai_intelligence_logs` 테이블 생성 | 15분 |
| 테이블 생성 | `customer_health_scores` 테이블 생성 | 15분 |
| 디렉토리 구조 | `backend/services/ai_intelligence/` 생성 | 10분 |
| 모듈 구현 | `usage_tracker.py` 구현 | 30분 |
| 모듈 구현 | `prompts.py` 구현 | 1시간 |

### 10.2 Day 18: AI 컴포넌트 구현

| 태스크 | 상세 | 예상 시간 |
|--------|------|----------|
| AI Analyst | `analyst.py` 구현 | 2시간 |
| AI Strategist | `strategist.py` 구현 | 2시간 |
| AI Executor | `executor.py` 구현 | 1.5시간 |
| 단위 테스트 | 각 컴포넌트 테스트 | 1시간 |

### 10.3 Day 19: 통합 및 API

| 태스크 | 상세 | 예상 시간 |
|--------|------|----------|
| 스크립트 | `daily_intelligence.py` 구현 | 1시간 |
| API 엔드포인트 | `routes/admin/ai_intelligence.py` 구현 | 2시간 |
| Crontab 설정 | 매일 오전 9시 실행 설정 | 15분 |
| 텔레그램 연동 | 환경변수 설정 및 연동 테스트 | 30분 |
| 프론트엔드 | `AIIntelligencePanel.tsx` 구현 | 2시간 |

### 10.4 Day 20: 테스트 및 배포

| 태스크 | 상세 | 예상 시간 |
|--------|------|----------|
| 전체 플로우 테스트 | Analyst → Strategist → Executor 흐름 | 1시간 |
| 비용 추적 확인 | `gemini_usage_logs.purpose` 분리 확인 | 30분 |
| 대시보드 통합 | Phase 2 대시보드에 AI 패널 추가 | 1시간 |
| Production 배포 | PM2 재시작, Cron 활성화 | 30분 |
| 첫 인텔리전스 | 수동 실행으로 첫 리포트 확인 | 30분 |

### 10.5 전체 체크리스트

```
Phase 3 구현 체크리스트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[선행 조건]
□ Phase 2 대시보드 배포 완료
□ Phase 2 Metrics/Tables API 테스트 통과 (12/12)
□ Phase 2 reports/share_logs 데이터 쌓이고 있음 확인
□ 텔레그램 봇 환경변수 설정 (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)

[Day 17: 기반 구축]
□ gemini_usage_logs 테이블에 purpose 컬럼 추가
□ ai_intelligence_logs 테이블 생성
□ customer_health_scores 테이블 생성
□ backend/services/ai_intelligence/ 디렉토리 구조 생성
□ usage_tracker.py 구현
□ prompts.py 구현

[Day 18: AI 컴포넌트]
□ analyst.py 구현
□ strategist.py 구현
□ executor.py 구현
□ 단위 테스트 통과

[Day 19: 통합 및 API]
□ daily_intelligence.py 스크립트 구현
□ API 엔드포인트 구현 (routes/admin/ai_intelligence.py)
□ Crontab 설정 (매일 오전 9시)
□ 텔레그램 환경변수 설정 및 연동 테스트
□ AIIntelligencePanel.tsx 구현

[Day 20: 테스트 및 배포]
□ 전체 플로우 테스트
□ 비용 추적 확인 (purpose별 분리)
□ Phase 2 대시보드에 AI 패널 통합
□ Production 배포
□ 첫 일일 인텔리전스 발송 확인
```

---

## 11. 완료 기준 및 성공 지표

### 11.1 Phase 3 완료 기준

```
✅ 필수 완료 항목
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 매일 오전 9시 일일 인텔리전스 텔레그램 발송
□ Critical Alert 발생 시 Playbook 자동 생성
□ 메시지 초안 생성 및 승인 요청 기능
□ 용도별 비용 분리 추적 (gemini_usage_logs.purpose)
□ Master Admin 대시보드에 AI Intelligence Panel 표시
□ AI 로그 조회 API 동작
□ 월 비용 ₩0 유지 (무료 티어)
```

### 11.2 성공 지표 (Phase 2 기획서 연계)

Phase 2 기획서의 **"11. 성공 지표"** 섹션과 연계:

| 지표 | Phase 2 목표 | Phase 3 추가 목표 |
|------|-------------|------------------|
| 대시보드 확인 소요 시간 | ~5분 → ~1분 | ~1분 → ~30초 (AI 요약) |
| Critical Issue 인지 시간 | ~30초 → ~3초 | ~3초 + AI 대응 전략 즉시 제공 |
| 의사결정 속도 | 50% 향상 | AI 권장 액션으로 추가 30% 향상 |
| 문제 대응 시간 | 70% 단축 | Playbook으로 추가 50% 단축 |
| 이탈 학원 재활성화 | 20% 증가 | AI 메시지로 추가 15% 증가 |

### 11.3 비즈니스 영향 지표

| 지표 | 현재 | Phase 3 후 목표 | 측정 방법 |
|------|------|----------------|----------|
| 이탈 학원 조기 감지 | 수동 확인 | 7일 전 자동 감지 | ai_intelligence_logs |
| 대응 메시지 작성 시간 | 15분/건 | 1분/건 (AI 초안) | 운영 로그 |
| 월 운영 시간 | 10시간 | 3시간 | 시간 추적 |
| AI 비용 | ₩0 | ₩0 (무료 티어) | gemini_usage_logs |

---

## 12. 향후 로드맵 연계

### 12.1 Phase 2 기획서의 향후 로드맵

Phase 2 기획서 **"13. 향후 로드맵"** 섹션에서 정의된 계획:

```
Phase 4: 머신러닝 예측 (Q2 2026)
Phase 5: 고급 분석 (Q3 2026)
Phase 6: 자동화 (Q4 2026)
```

### 12.2 Phase 3 → Phase 4 연결

Phase 3에서 구축된 AI Infrastructure는 Phase 4의 기반이 됩니다:

| Phase 3 산출물 | Phase 4 활용 |
|---------------|-------------|
| `customer_health_scores` 테이블 | ML 모델 학습 데이터 |
| `ai_intelligence_logs` 테이블 | 예측 정확도 검증 데이터 |
| AI Analyst 패턴 분석 | ML 모델 Feature Engineering |
| Playbook 효과 추적 | 모델 성능 평가 지표 |

### 12.3 Phase 4 미리보기: Student Intelligence

Phase 3 완료 후 구현 예정인 **Student Intelligence** (학생 이탈 예측):

```
Phase 4: Student Intelligence (Q2 2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

목표: 학생 이탈 7일 전 예측

핵심 기능:
├─ 학생별 건강도 점수 (100점 만점)
│   ├─ 출석 점수 (30점)
│   ├─ 진도 점수 (25점)
│   ├─ 연습 충실도 (20점)
│   ├─ 학부모 참여도 (15점)
│   └─ 성장 추세 (10점)
│
├─ 이탈 패턴 라이브러리
│   ├─ 흥미 상실형
│   ├─ 실력 정체형
│   ├─ 환경 변화형
│   ├─ 가격 민감형
│   └─ 목표 상실형
│
└─ 원장님 대시보드
    ├─ 🔴 즉시 주의 (이탈 위험 80%+)
    ├─ 🟡 모니터링 (주의 50%+)
    ├─ 🟢 건강 (정상)
    └─ 🌟 우수 (추천 가능성 85%+)

비즈니스 임팩트:
- 학생 1명 이탈 방지 = 월 10만원 × 12개월 = 120만원
- 평균 2-3명 이탈 방지 시 연간 300-500만원 수익 보호
- ROI: 560%
```

### 12.4 전체 로드맵 타임라인

```
2026년 TutorNote Master Admin 로드맵
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q1 2026 (현재)
├─ [완료] Phase 1: 운영 안정화 및 법적 준수
├─ [진행중] Phase 2: 대시보드 리디자인 (Day 1-12)
└─ [예정] Phase 3: AI Intelligence (Day 13-20)

Q2 2026
└─ Phase 4: Student Intelligence (학생 이탈 예측)
   - 학생 건강도 점수
   - 이탈 패턴 라이브러리
   - 상담 스크립트 자동 생성

Q3 2026
└─ Phase 5: 고급 분석
   - 코호트 분석 (가입 시기별 리텐션)
   - RFM 분석 (Recency, Frequency, Monetary)
   - 커스텀 리포트 빌더

Q4 2026
└─ Phase 6: 완전 자동화
   - 이탈 학원 자동 케어 플로우
   - 스마트 알림 시스템
   - 자동 비용 최적화 제안
```

---

## 13. 참고 자료

### 13.1 관련 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| Phase 2 기획서 | `DASHBOARD_REDESIGN_SPEC.md` | 대시보드 리디자인 상세 스펙 |
| 전체 로드맵 | `/mnt/project/ROADMAP.md` | TutorNote 전체 로드맵 |
| AI 피드백 프롬프트 | `/mnt/project/프롬프트_어조_개선.md` | AI 피드백 톤 설계 |
| 비즈니스 전략 | `/mnt/project/TutorNote_2026_전략_보고서.pdf` | 2026년 전략 |

### 13.2 기술 문서

- [Google AI Gemini API](https://ai.google.dev/gemini-api/docs)
- [Gemini 2.5 Flash-Lite 가격](https://ai.google.dev/gemini-api/docs/pricing) (무료 티어)
- [google-generativeai Python SDK](https://pypi.org/project/google-generativeai/)
- [Python-Telegram-Bot](https://python-telegram-bot.org/)

---

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-05 | 최초 작성 |
| 1.1 | 2026-01-05 | Phase 2 연결성 추가, 목차 구조화, 대시보드 UI 통합 섹션 추가, 향후 로드맵 연계 섹션 추가 |
| 1.2 | 2026-01-05 | AI 모델 변경: Claude Haiku → Gemini 2.5 Flash-Lite (무료 티어), 월 비용 ₩130 → ₩0 |
| **1.3** | **2026-01-05** | **실제 테이블 구조 반영: activity_logs→reports/share_logs, api_usage_logs→gemini_usage_logs, 텔레그램 환경변수 안내 추가** |

---

**작성자**: Claude PM
**선행 문서**: `DASHBOARD_REDESIGN_SPEC.md` (Phase 2)
**검토자**: ✅ 대표님 승인 완료 (2026-01-05)
**다음 단계**: Claude Code에게 전달 → 구현 시작 (Day 17)
