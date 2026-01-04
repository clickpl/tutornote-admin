# TutorNote Master Admin 대시보드 개선 기획서

**문서 버전**: 1.1  
**작성일**: 2026년 1월 4일  
**최종 수정**: 2026년 1월 5일  
**작성자**: TutorNote Product Team  
**대상 독자**: 개발팀, 경영진, AI Agent (Claude Code)

---

## 📑 목차

1. [개요](#1-개요)
2. [현재 문제점 분석](#2-현재-문제점-분석)
3. [개선 목표](#3-개선-목표)
4. [대시보드 구조 설계](#4-대시보드-구조-설계)
5. [섹션별 상세 스펙](#5-섹션별-상세-스펙)
6. [데이터 수집 방법](#6-데이터-수집-방법)
7. [구현 전략 및 운영 계획](#7-구현-전략-및-운영-계획)
8. [구현 단계별 계획](#8-구현-단계별-계획)
9. [기술 스택 및 구현 가이드](#9-기술-스택-및-구현-가이드)
10. [테스트 계획](#10-테스트-계획)
11. [성공 지표](#11-성공-지표)

---

## 1. 개요

### 1.1 배경

TutorNote Master Admin은 서비스 운영자가 전체 플랫폼의 건강도를 모니터링하고 비즈니스 인사이트를 얻기 위한 관리 도구입니다. 현재 대시보드는 **시스템 상태 모니터링**에 치우쳐 있으며, 정작 **비즈니스 의사결정**에 필요한 지표가 부족합니다.

### 1.2 문서 목적

본 기획서는 대시보드를 **"시스템 모니터링 도구"**에서 **"비즈니스 인사이트 플랫폼"**으로 전환하기 위한 구체적인 설계 및 구현 계획을 제시합니다.

### 1.3 핵심 개선 방향

1. **정보 통합**: 3개로 분산된 페이지(대시보드, 인사이트 지표, 시스템)를 1개의 대시보드로 통합
2. **우선순위 명확화**: Critical Alerts를 최상단에 배치하여 즉시 대응 가능
3. **비즈니스 중심**: 성장, 활성도, 수익화 지표를 핵심으로 배치
4. **데이터 정합성**: API 사용량, 활동 로그 등 데이터 집계 로직 개선

---

## 2. 현재 문제점 분석

### 2.1 구조적 문제

| 문제 | 현상 | 영향 |
|------|------|------|
| **정보 분산** | 대시보드, 인사이트 지표, 시스템 모니터링 3곳에 분산 | 전체 상황 파악을 위해 여러 페이지 이동 필요 |
| **Critical 정보 은폐** | CPU 92.4%, Backend 재시작 102회가 별도 페이지에 | 긴급 상황 인지 지연 |
| **비즈니스 지표 부족** | 시스템 지표 위주, 성장/활성도 지표 부족 | 비즈니스 의사결정 어려움 |

### 2.2 데이터 정합성 문제

| 문제 | 현상 | 원인 추정 |
|------|------|----------|
| **Claude API 비용 $0.00** | 실제 테스트를 많이 했으나 0토큰 표시 | API 사용량 집계 로직 미작동 또는 연동 오류 |
| **실시간 활동 피드 누락** | 오늘 테스트한 활동이 반영 안 됨 | 활동 로그 저장 트리거 오류 또는 시간대 설정 문제 |

### 2.3 사용성 문제

| 문제 | 현상 | 개선 방향 |
|------|------|----------|
| **수동 업데이트 섹션** | "알림톡 상태", "카카오 비즈니스" 수동 업데이트 | 자동화 또는 제거 |
| **낮은 정보 밀도** | 큰 카드에 단순 숫자만 표시 | 트렌드, 비교, 컨텍스트 추가 |
| **액션 불가능** | 문제 발견 후 할 수 있는 액션 없음 | 빠른 액션 버튼 추가 |

---

## 3. 개선 목표

### 3.1 정량적 목표

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **대시보드 확인 소요 시간** | ~5분 (3개 페이지) | ~1분 (1개 페이지) | 사용자 테스트 |
| **Critical Issue 인지 시간** | ~30초 (페이지 이동 필요) | ~3초 (최상단 표시) | 시뮬레이션 |
| **데이터 정합성** | 70% (Claude API, 활동 로그 오류) | 100% | 실제 데이터 검증 |
| **운영자 만족도** | - | 8/10 이상 | 설문 조사 |

### 3.2 정성적 목표

- **Single Source of Truth**: 대시보드 하나로 모든 상황 파악 가능
- **Actionable Insights**: 데이터를 보고 즉시 액션 가능
- **Proactive Monitoring**: 문제가 발생하기 전에 예측 및 알림
- **비즈니스 중심**: 시스템 지표보다 비즈니스 성과 지표 우선

---

## 4. 대시보드 구조 설계

### 4.1 전체 레이아웃

```
┌────────────────────────────────────────────────────────────────┐
│                     🚨 Critical Alerts (상단 고정)                │
├────────────────────────────────────────────────────────────────┤
│                                                                    │
│  📊 핵심 지표 카드 (4x3 Grid)                                      │
│  ┌─────────┬─────────┬─────────┬─────────┐                      │
│  │ 비즈니스 │ 참여도   │ 수익화   │ 시스템   │                      │
│  │ 건강도   │         │ 준비도   │ 건강도   │                      │
│  │ (4개)   │ (4개)   │ (4개)   │ (4개)   │                      │
│  └─────────┴─────────┴─────────┴─────────┘                      │
│                                                                    │
├────────────────────────────────────────────────────────────────┤
│  🔽 접었다 펼치기 섹션                                              │
│  ├─ 📋 이탈 위험 학원 (기본 펼침)                                   │
│  ├─ 📊 활성 학원 상세                                              │
│  ├─ 📈 온보딩 퍼널 분석                                            │
│  └─ 📜 시스템 로그 (기본 접힘)                                      │
│                                                                    │
├────────────────────────────────────────────────────────────────┤
│  ⚡ 빠른 액션 버튼                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 메뉴 구조 변경

#### AS-IS (현재)
```
📊 대시보드
📈 인사이트 지표
🏛️ 학원 관리
🔄 복구/수정 센터
⚖️ 법무 관리
🔔 알림 관리
⚙️ 시스템 모니터링
```

#### TO-BE (개선)
```
📊 대시보드          ← 핵심 지표 모두 통합
🏛️ 학원 관리
🔄 복구/수정 센터
⚖️ 법무 관리
🔔 알림 관리
⚙️ 시스템             ← 기술 상세만 유지 (CPU, PM2, API 헬스체크)
```

**변경 사항**:
- ❌ "인사이트 지표" 메뉴 제거 → 대시보드에 통합
- ✅ "시스템 모니터링" → "시스템"으로 간소화

---

## 5. 섹션별 상세 스펙

### 5.1 Section 1: Critical Alerts

#### 5.1.1 UI 레이아웃

```
┌────────────────────────────────────────────────────────────────┐
│ 🚨 즉시 확인이 필요한 사항                              [최소화 ▼] │
├────────────────────────────────────────────────────────────────┤
│ 🔴 시스템 문제 (2건)                                             │
│   • CPU 사용률 92.4% - 서버 부하 높음, 즉시 확인 필요            │
│     [시스템 페이지로 이동 →]                                      │
│   • tutornote-backend 재시작 102회 - 안정성 문제 의심            │
│     [재시작 →] [로그 확인 →]                                     │
│                                                                    │
│ 🟡 비즈니스 주의 (2건)                                           │
│   • 23일간 무활동 학원 1곳 (음악학원)                             │
│     [학원 상세 →] [알림 보내기 →]                                 │
│   • 11일간 무활동 학원 1곳 (최종레스트학원)                        │
│     [학원 상세 →] [알림 보내기 →]                                 │
│                                                                    │
│ 🟢 정상 작동 중                                                   │
│   • Claude API, 카카오 API, 데이터베이스                          │
└────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Alert Rule (알림 조건)

| 카테고리 | 지표 | 임계값 | 색상 | 우선순위 |
|---------|------|--------|------|---------|
| 시스템 | CPU 사용률 | > 90% | 🔴 빨강 | 긴급 |
| 시스템 | RAM 사용률 | > 85% | 🟡 노랑 | 주의 |
| 시스템 | Disk 사용률 | > 90% | 🔴 빨강 | 긴급 |
| 시스템 | Backend 재시작 횟수 | > 50회/주 | 🟡 노랑 | 주의 |
| 시스템 | Backend 재시작 횟수 | > 100회/주 | 🔴 빨강 | 긴급 |
| 시스템 | API 에러율 | > 5% | 🟡 노랑 | 주의 |
| 시스템 | API 에러율 | > 10% | 🔴 빨강 | 긴급 |
| 비즈니스 | 무활동 학원 | 7일 | 🟢 초록 | 정상 |
| 비즈니스 | 무활동 학원 | 14일 | 🟡 노랑 | 주의 |
| 비즈니스 | 무활동 학원 | 21일 | 🟠 주황 | 경고 |
| 비즈니스 | 무활동 학원 | 30일 | 🔴 빨강 | 이탈 |
| 비즈니스 | 신규 학원 무활동 | 48시간 | 🟡 노랑 | 주의 |
| 비즈니스 | 학부모 열람률 | < 30% | 🟡 노랑 | 주의 |
| 비즈니스 | 학부모 열람률 | < 20% | 🔴 빨강 | 긴급 |

#### 5.1.3 데이터 소스

```typescript
interface CriticalAlert {
  id: string;
  category: 'system' | 'business';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  actionButtons: {
    label: string;
    action: string;
    link?: string;
  }[];
}

// 예시
const alerts: CriticalAlert[] = [
  {
    id: 'sys-cpu-001',
    category: 'system',
    severity: 'critical',
    title: 'CPU 사용률 92.4%',
    description: '서버 부하 높음, 즉시 확인 필요',
    timestamp: new Date(),
    actionButtons: [
      { label: '시스템 페이지로 이동', action: 'navigate', link: '/system' }
    ]
  }
];
```

---

### 5.2 Section 2: 핵심 지표 카드 (4x3 Grid)

#### 5.2.1 Row 1: 비즈니스 건강도

##### Card 1-1: 학원 현황
```
┌──────────────────────┐
│ 🏫 학원 현황          │
├──────────────────────┤
│ 활성: 5개            │
│ 전체: 13개           │
│ 신규: +2개 (30일)    │
│ 이탈: 0개            │
│                      │
│ 📊 성장률: +18%      │
│ [▲ 전월 대비]        │
└──────────────────────┘
```

**데이터 스키마**:
```sql
-- 활성 학원: 최근 7일 내 로그인
SELECT COUNT(*) FROM academies a
JOIN (
  SELECT DISTINCT academy_id 
  FROM activity_logs 
  WHERE created_at >= NOW() - INTERVAL 7 DAY
) al ON a.id = al.academy_id
WHERE a.is_deleted = 0;

-- 신규 학원 (30일)
SELECT COUNT(*) FROM academies
WHERE created_at >= NOW() - INTERVAL 30 DAY
AND is_deleted = 0;

-- 이탈 학원 (30일 이상 무활동)
SELECT COUNT(*) FROM academies a
WHERE a.is_deleted = 0
AND NOT EXISTS (
  SELECT 1 FROM activity_logs al
  WHERE al.academy_id = a.id
  AND al.created_at >= NOW() - INTERVAL 30 DAY
);

-- 성장률 (전월 대비)
SELECT 
  ((current_month - last_month) / last_month * 100) as growth_rate
FROM (
  SELECT 
    COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as current_month,
    COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01') 
               AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as last_month
  FROM academies
  WHERE is_deleted = 0
) counts;
```

##### Card 1-2: 학생 현황
```
┌──────────────────────┐
│ 👥 학생 현황          │
├──────────────────────┤
│ 총 학생: 32명        │
│ 전월 대비: +4명      │
│ (+14%) ▲             │
│                      │
│ 학원당 평균: 2.5명   │
│ 📈 트렌드: ↗         │
└──────────────────────┘
```

**데이터 스키마**:
```sql
-- 총 학생 수
SELECT COUNT(*) FROM students
WHERE is_deleted = 0;

-- 전월 대비 증가
SELECT 
  COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as this_month,
  COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01') 
             AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as last_month
FROM students
WHERE is_deleted = 0;

-- 학원당 평균 학생 수
SELECT 
  COUNT(*) / COUNT(DISTINCT academy_id) as avg_students_per_academy
FROM students
WHERE is_deleted = 0;
```

##### Card 1-3: 리포트 활동
```
┌──────────────────────┐
│ 📝 리포트 활동        │
├──────────────────────┤
│ 이번 달: 59건        │
│ 전월 대비: +12건     │
│ (+25%) ▲             │
│                      │
│ 학생당: 1.8건        │
│ 📊 평균 시간: 8.8시간│
└──────────────────────┘
```

**데이터 스키마**:
```sql
-- 이번 달 리포트 생성 수
SELECT COUNT(*) FROM progress_records
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND is_deleted = 0;

-- 전월 대비
SELECT 
  COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as this_month,
  COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01') 
             AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as last_month
FROM progress_records
WHERE is_deleted = 0;

-- 학생당 평균 리포트 수 (이번 달)
SELECT 
  COUNT(pr.id) / COUNT(DISTINCT pr.student_id) as avg_reports_per_student
FROM progress_records pr
WHERE pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND pr.is_deleted = 0;

-- 평균 리포트 작성 시간 (진도 기록 → 리포트 생성)
-- 가정: 진도 기록부터 리포트 생성까지 소요 시간
SELECT 
  AVG(TIMESTAMPDIFF(SECOND, pr.created_at, pr.updated_at)) / 3600 as avg_hours
FROM progress_records pr
WHERE pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND pr.is_deleted = 0;
```

##### Card 1-4: 활성도 지표
```
┌──────────────────────┐
│ 🔥 활성도 지표        │
├──────────────────────┤
│ DAU / MAU: 2 / 5     │
│ 고착도: 40.0%        │
│ (DAU/MAU 비율)       │
│                      │
│ 🔴 이탈 위험: 7개    │
│ 🎯 목표: 60%         │
└──────────────────────┘
```

**데이터 스키마**:
```sql
-- DAU (Daily Active Users)
SELECT COUNT(DISTINCT academy_id) as dau
FROM activity_logs
WHERE DATE(created_at) = CURDATE();

-- MAU (Monthly Active Users)
SELECT COUNT(DISTINCT academy_id) as mau
FROM activity_logs
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01');

-- 고착도 (Stickiness) = DAU / MAU
SELECT (dau / mau * 100) as stickiness
FROM (
  SELECT 
    COUNT(DISTINCT CASE WHEN DATE(created_at) = CURDATE() THEN academy_id END) as dau,
    COUNT(DISTINCT academy_id) as mau
  FROM activity_logs
  WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
) metrics;

-- 이탈 위험 학원 (7일 이상 무활동)
SELECT COUNT(*) FROM academies a
WHERE a.is_deleted = 0
AND NOT EXISTS (
  SELECT 1 FROM activity_logs al
  WHERE al.academy_id = a.id
  AND al.created_at >= NOW() - INTERVAL 7 DAY
);
```

#### 5.2.2 Row 2: 사용자 참여 & AI 효율

##### Card 2-1: 콘텐츠 생성
```
┌──────────────────────┐
│ 🎨 콘텐츠 생성        │
├──────────────────────┤
│ 카드뉴스: 95개       │
│ (생성된 이미지)      │
│                      │
│ 평균 생성/학원:      │
│ 7.3개                │
│                      │
│ 📊 성장률: +15%      │
└──────────────────────┘
```

**데이터 스키마 (신규 수집 필요)**:
```sql
-- 카드뉴스 테이블이 없다면 리포트 기반으로 추정
-- 또는 별도 card_news 테이블 생성 필요
SELECT COUNT(*) as card_news_count
FROM progress_records
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND card_news_generated = 1;  -- 컬럼 추가 필요

-- 학원당 평균
SELECT 
  COUNT(*) / COUNT(DISTINCT academy_id) as avg_per_academy
FROM progress_records
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND card_news_generated = 1;
```

**필요한 DB 변경**:
```sql
-- progress_records 테이블에 컬럼 추가
ALTER TABLE progress_records 
ADD COLUMN card_news_generated BOOLEAN DEFAULT 0 COMMENT '카드뉴스 생성 여부';
```

##### Card 2-2: 학부모 도달
```
┌──────────────────────┐
│ 📤 학부모 도달        │
├──────────────────────┤
│ 리포트 공유: 54회    │
│ 학부모 열람: 41회    │
│ 열람률: 33.3%        │
│                      │
│ 🔴 목표: 60%         │
│ (현재: 33.3%)        │
└──────────────────────┘
```

**데이터 스키마 (신규 수집 필요)**:
```sql
-- report_shares 테이블 활용
SELECT COUNT(*) as share_count
FROM report_shares
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01');

-- report_views 테이블 (신규 생성 필요)
SELECT COUNT(*) as view_count
FROM report_views
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND viewer_type = 'parent';

-- 열람률
SELECT 
  (views / shares * 100) as view_rate
FROM (
  SELECT 
    COUNT(DISTINCT rs.id) as shares,
    COUNT(DISTINCT rv.id) as views
  FROM report_shares rs
  LEFT JOIN report_views rv ON rs.share_token = rv.share_token
  WHERE rs.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
) metrics;
```

**필요한 DB 변경**:
```sql
-- report_views 테이블 생성
CREATE TABLE report_views (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  share_token VARCHAR(100),
  viewer_type ENUM('parent', 'public', 'academy') DEFAULT 'parent',
  view_duration_seconds INT COMMENT '체류 시간 (초)',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_id (report_id),
  INDEX idx_share_token (share_token),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (report_id) REFERENCES progress_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

##### Card 2-3: AI 효율성
```
┌──────────────────────┐
│ 🤖 AI 효율성          │
├──────────────────────┤
│ AI 리포트: 59건      │
│ 시간 절감: 8.8시간   │
│ (90분 → 9분)         │
│                      │
│ 학원당: 11.8건       │
│ 동의 완료: 100%      │
└──────────────────────┘
```

**데이터 스키마**:
```sql
-- AI로 생성된 리포트 수 (progress_records 기준)
SELECT COUNT(*) as ai_report_count
FROM progress_records
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND ai_feedback IS NOT NULL;

-- 시간 절감 계산
-- 가정: 수동 작성 시 90분, AI 사용 시 9분
SELECT 
  COUNT(*) * ((90 - 9) / 60) as hours_saved
FROM progress_records
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND ai_feedback IS NOT NULL;

-- 학원당 평균
SELECT 
  COUNT(*) / COUNT(DISTINCT academy_id) as avg_per_academy
FROM progress_records
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND ai_feedback IS NOT NULL;

-- 보호자 동의 완료율
SELECT 
  (COUNT(CASE WHEN consent_status = 'approved' THEN 1 END) / COUNT(*) * 100) as consent_rate
FROM students s
LEFT JOIN consent_requests cr ON s.id = cr.student_id
WHERE s.is_deleted = 0;
```

##### Card 2-4: 전환 퍼널
```
┌──────────────────────┐
│ 🎯 전환 퍼널          │
├──────────────────────┤
│ 학원 가입: 13개      │
│ ↓ 학생 등록: 13개    │
│ ↓ 첫 리포트: 13개    │
│ ↓ 카톡 공유: 8개     │
│                      │
│ 전환율: 61.5%        │
└──────────────────────┘
```

**데이터 스키마 (신규 수집 필요)**:
```sql
-- 신규 학원 전환 퍼널 (최근 30일)
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
AND a.is_deleted = 0;

-- 최종 전환율 (카톡 공유까지 완료)
SELECT 
  (shared / signups * 100) as conversion_rate
FROM (
  SELECT 
    COUNT(DISTINCT a.id) as signups,
    COUNT(DISTINCT CASE WHEN rs.id IS NOT NULL THEN a.id END) as shared
  FROM academies a
  LEFT JOIN students s ON a.id = s.academy_id
  LEFT JOIN progress_records pr ON s.id = pr.student_id
  LEFT JOIN report_shares rs ON pr.id = rs.progress_record_id
  WHERE a.created_at >= NOW() - INTERVAL 30 DAY
) funnel;
```

#### 5.2.3 Row 3: 수익화 & 시스템

##### Card 3-1: 수익화 준비
```
┌──────────────────────┐
│ 💰 수익화 준비        │
├──────────────────────┤
│ 헤비유저: 1개        │
│ (월 20건+ 리포트)    │
│                      │
│ 헤비유저 비율:       │
│ 20.0%                │
│                      │
│ 예상 MRR:            │
│ ₩199,200             │
│ (Standard × 8)       │
└──────────────────────┘
```

**데이터 스키마**:
```sql
-- 헤비유저 정의: 월 20건 이상 리포트 생성
SELECT COUNT(DISTINCT academy_id) as heavy_users
FROM (
  SELECT academy_id, COUNT(*) as report_count
  FROM progress_records
  WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
  AND is_deleted = 0
  GROUP BY academy_id
  HAVING COUNT(*) >= 20
) heavy;

-- 헤비유저 비율
SELECT 
  (heavy_users / total_users * 100) as heavy_user_rate
FROM (
  SELECT 
    COUNT(DISTINCT CASE WHEN report_count >= 20 THEN academy_id END) as heavy_users,
    COUNT(DISTINCT academy_id) as total_users
  FROM (
    SELECT academy_id, COUNT(*) as report_count
    FROM progress_records
    WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
    AND is_deleted = 0
    GROUP BY academy_id
  ) user_reports
) metrics;

-- 예상 MRR (Monthly Recurring Revenue)
-- 가정: Standard 플랜 ₩24,900 × 8개 학원
SELECT 
  COUNT(DISTINCT academy_id) * 24900 as estimated_mrr
FROM progress_records
WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
AND is_deleted = 0;
```

##### Card 3-2: 비용 현황
```
┌──────────────────────┐
│ 💸 비용 현황          │
├──────────────────────┤
│ 이번 달: ₩73,940     │
│ 알림톡: ₩52,800      │
│ Claude: ₩14,200      │
│ 서버: ₩19,440        │
│                      │
│ 학원당: ₩5,688       │
│                      │
│ 🎯 손익분기: 3개 학원 │
└──────────────────────┘
```

**데이터 스키마 (신규 수집 필요)**:
```sql
-- operational_costs 테이블 생성
CREATE TABLE operational_costs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cost_type ENUM('alimtalk', 'claude_api', 'server', 'domain', 'other') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW',
  description TEXT,
  billing_month DATE NOT NULL COMMENT '해당 월 (YYYY-MM-01)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_billing_month (billing_month),
  INDEX idx_cost_type (cost_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 이번 달 총 비용
SELECT SUM(amount) as total_cost
FROM operational_costs
WHERE billing_month = DATE_FORMAT(NOW(), '%Y-%m-01');

-- 비용 항목별 집계
SELECT 
  cost_type,
  SUM(amount) as cost
FROM operational_costs
WHERE billing_month = DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY cost_type;

-- 학원당 평균 비용
SELECT 
  total_cost / academy_count as cost_per_academy
FROM (
  SELECT 
    SUM(amount) as total_cost,
    (SELECT COUNT(*) FROM academies WHERE is_deleted = 0) as academy_count
  FROM operational_costs
  WHERE billing_month = DATE_FORMAT(NOW(), '%Y-%m-01')
) metrics;

-- 손익분기점 계산
-- Standard 플랜 ₩24,900 가정
SELECT CEIL(total_cost / 24900) as breakeven_academies
FROM (
  SELECT SUM(amount) as total_cost
  FROM operational_costs
  WHERE billing_month = DATE_FORMAT(NOW(), '%Y-%m-01')
) costs;
```

##### Card 3-3: 시스템 건강
```
┌──────────────────────┐
│ ⚙️ 시스템 건강        │
├──────────────────────┤
│ CPU: 92.4% 🔴        │
│ RAM: 43.3% 🟢        │
│ Disk: 85.0% 🟡       │
│                      │
│ 🔴 Backend 재시작    │
│ 102회 (주의)         │
│                      │
│ 🎯 목표 CPU: 60%     │
└──────────────────────┘
```

**데이터 소스**: 기존 시스템 모니터링 API 활용
```bash
# CPU, RAM, Disk 사용률
GET /api/admin/system/resources

# PM2 프로세스 상태
GET /api/admin/system/pm2

# Backend 재시작 횟수
GET /api/admin/system/restarts?period=week
```

**시스템 헬스 로그 테이블 (선택적)**:
```sql
CREATE TABLE system_health_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cpu_usage DECIMAL(5, 2),
  ram_usage DECIMAL(5, 2),
  disk_usage DECIMAL(5, 2),
  active_connections INT,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

##### Card 3-4: API 상태
```
┌──────────────────────┐
│ 🌐 API 상태           │
├──────────────────────┤
│ Claude: 🟢 정상      │
│ 카카오: 🟡 주의      │
│                      │
│ 가동시간:            │
│ 99일 22시간          │
│                      │
│ 응답시간: 1.2s       │
└──────────────────────┘
```

**데이터 소스**: 기존 API 또는 신규 헬스체크
```sql
-- API 상태 로그 (선택적)
CREATE TABLE api_health_checks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  api_name ENUM('claude', 'kakao', 'gemini') NOT NULL,
  status ENUM('success', 'error', 'timeout') NOT NULL,
  response_time_ms INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_name (api_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API 상태 체크 (최근 1시간)
SELECT 
  api_name,
  AVG(response_time_ms) as avg_response_time,
  COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*) * 100 as success_rate
FROM api_health_checks
WHERE created_at >= NOW() - INTERVAL 1 HOUR
GROUP BY api_name;
```

---

### 5.3 Section 3: 접었다 펼치기 테이블

#### 5.3.1 이탈 위험 학원 (기본 펼침)

```
┌────────────────────────────────────────────────────────────────┐
│ ▼ 이탈 위험 학원 (7개)                                [CSV 다운로드]│
├────────────────────────────────────────────────────────────────┤
│ 학원명         원장     학생  리포트  마지막 활동   비활성 기간  상태 │
│ ────────────────────────────────────────────────────────────── │
│ 음악학원       -        3     7      2025.12.12   23일        🔴  │
│                         [학원 상세 →] [알림 보내기 →]              │
│                                                                    │
│ 최종레스트학원  배포테스트 1    1      2025.12.24   11일        🟡  │
│                         [학원 상세 →] [알림 보내기 →]              │
│ ...                                                                │
└────────────────────────────────────────────────────────────────┘
```

**데이터 스키마**:
```sql
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
ORDER BY inactive_days DESC;
```

#### 5.3.2 활성 학원 상세

```
┌────────────────────────────────────────────────────────────────┐
│ ▼ 활성 학원 상세 (5개)                                           │
├────────────────────────────────────────────────────────────────┤
│ 학원명      학생  리포트  DAU  최근 활동      헤비유저  예상 플랜 │
│ ────────────────────────────────────────────────────────────── │
│ OO피아노     8     24    5일   오늘 10:30    ✅      Pro        │
│ ...                                                                │
└────────────────────────────────────────────────────────────────┘
```

**데이터 스키마**:
```sql
SELECT 
  a.id,
  a.name as academy_name,
  COUNT(DISTINCT s.id) as student_count,
  COUNT(DISTINCT pr.id) as report_count,
  COUNT(DISTINCT DATE(al.created_at)) as dau,
  MAX(al.created_at) as last_activity,
  CASE WHEN COUNT(DISTINCT pr.id) >= 20 THEN 'Yes' ELSE 'No' END as is_heavy_user,
  CASE 
    WHEN COUNT(DISTINCT s.id) >= 50 THEN 'Pro'
    WHEN COUNT(DISTINCT s.id) >= 25 THEN 'Standard'
    ELSE 'Free'
  END as recommended_plan
FROM academies a
JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
LEFT JOIN progress_records pr ON s.id = pr.student_id AND pr.created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') AND pr.is_deleted = 0
JOIN activity_logs al ON a.id = al.academy_id
WHERE a.is_deleted = 0
AND al.created_at >= NOW() - INTERVAL 7 DAY
GROUP BY a.id
ORDER BY report_count DESC;
```

#### 5.3.3 온보딩 퍼널 분석

```
┌────────────────────────────────────────────────────────────────┐
│ ▼ 온보딩 퍼널 분석                                               │
├────────────────────────────────────────────────────────────────┤
│ 단계                 완료 학원    비율     이탈 학원              │
│ ────────────────────────────────────────────────────────────── │
│ 1. 가입              13개        100%     -                     │
│ 2. 학생 1명 등록     13개        100%     0개                   │
│ 3. 첫 리포트 생성    13개        100%     0개                   │
│ 4. 첫 카톡 공유      8개         61.5%    5개 🟡                │
└────────────────────────────────────────────────────────────────┘
```

**데이터 스키마**:
```sql
-- 최근 30일 신규 학원 온보딩 퍼널
WITH new_academies AS (
  SELECT id FROM academies
  WHERE created_at >= NOW() - INTERVAL 30 DAY
  AND is_deleted = 0
)
SELECT 
  '1. 가입' as stage,
  (SELECT COUNT(*) FROM new_academies) as completed,
  100.0 as completion_rate,
  0 as churned
UNION ALL
SELECT 
  '2. 학생 1명 등록',
  COUNT(DISTINCT a.id),
  (COUNT(DISTINCT a.id) / (SELECT COUNT(*) FROM new_academies) * 100),
  ((SELECT COUNT(*) FROM new_academies) - COUNT(DISTINCT a.id))
FROM new_academies a
JOIN students s ON a.id = s.academy_id AND s.is_deleted = 0
UNION ALL
SELECT 
  '3. 첫 리포트 생성',
  COUNT(DISTINCT a.id),
  (COUNT(DISTINCT a.id) / (SELECT COUNT(*) FROM new_academies) * 100),
  ((SELECT COUNT(*) FROM new_academies) - COUNT(DISTINCT a.id))
FROM new_academies a
JOIN students s ON a.id = s.academy_id
JOIN progress_records pr ON s.id = pr.student_id
UNION ALL
SELECT 
  '4. 첫 카톡 공유',
  COUNT(DISTINCT a.id),
  (COUNT(DISTINCT a.id) / (SELECT COUNT(*) FROM new_academies) * 100),
  ((SELECT COUNT(*) FROM new_academies) - COUNT(DISTINCT a.id))
FROM new_academies a
JOIN students s ON a.id = s.academy_id
JOIN progress_records pr ON s.id = pr.student_id
JOIN report_shares rs ON pr.id = rs.progress_record_id;
```

---

### 5.4 Section 4: 빠른 액션 버튼

```
┌────────────────────────────────────────────────────────────────┐
│ ⚡ 빠른 액션                                                     │
├────────────────────────────────────────────────────────────────┤
│ [📧 이탈 학원 일괄 메일]  [🔄 Backend 재시작]                    │
│ [📊 월간 리포트 PDF]     [➕ 신규 학원 초대 링크]                 │
└────────────────────────────────────────────────────────────────┘
```

**기능 스펙**:

1. **이탈 학원 일괄 메일**
   - API: `POST /api/admin/actions/send-churn-emails`
   - 이탈 위험 학원 목록을 자동으로 가져와 일괄 메일 발송
   - 메일 템플릿: "오랜만이에요! TutorNote 어떻게 활용하고 계신가요?"

2. **Backend 재시작**
   - API: `POST /api/admin/actions/restart-backend`
   - PM2를 통한 안전한 재시작
   - 확인 모달 표시

3. **월간 리포트 PDF**
   - API: `GET /api/admin/actions/generate-monthly-report-pdf`
   - 현재 대시보드를 PDF로 저장
   - 이메일 발송 옵션

4. **신규 학원 초대 링크**
   - API: `GET /api/admin/actions/generate-invite-link`
   - 추천 코드가 포함된 회원가입 링크 생성
   - 클립보드 복사

---

## 6. 데이터 수집 방법

### 6.1 필요한 DB 스키마 추가/수정

#### 6.1.1 신규 테이블 생성

##### `activity_logs` (사용자 활동 로그)
```sql
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
```

##### `report_views` (학부모 리포트 열람 추적)
```sql
CREATE TABLE report_views (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  share_token VARCHAR(100),
  viewer_type ENUM('parent', 'public', 'academy') DEFAULT 'parent',
  view_duration_seconds INT COMMENT '체류 시간 (초)',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_id (report_id),
  INDEX idx_share_token (share_token),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (report_id) REFERENCES progress_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

##### `api_usage_logs` (API 사용량 추적)
```sql
CREATE TABLE api_usage_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  api_name ENUM('claude', 'gemini', 'kakao') NOT NULL,
  academy_id INT,
  endpoint VARCHAR(255),
  request_tokens INT,
  response_tokens INT,
  total_cost DECIMAL(10, 4),
  response_time_ms INT,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_name (api_name),
  INDEX idx_academy_id (academy_id),
  INDEX idx_created_at (created_at),
  INDEX idx_api_created (api_name, created_at),
  FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

##### `operational_costs` (운영 비용 추적)
```sql
CREATE TABLE operational_costs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cost_type ENUM('alimtalk', 'claude_api', 'server', 'domain', 'other') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KRW',
  description TEXT,
  billing_month DATE NOT NULL COMMENT '해당 월 (YYYY-MM-01)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_billing_month (billing_month),
  INDEX idx_cost_type (cost_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

##### `system_health_logs` (시스템 헬스체크)
```sql
CREATE TABLE system_health_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cpu_usage DECIMAL(5, 2),
  ram_usage DECIMAL(5, 2),
  disk_usage DECIMAL(5, 2),
  active_connections INT,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

##### `api_health_checks` (API 헬스체크)
```sql
CREATE TABLE api_health_checks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  api_name ENUM('claude', 'kakao', 'gemini') NOT NULL,
  status ENUM('success', 'error', 'timeout') NOT NULL,
  response_time_ms INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_name (api_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 6.1.2 기존 테이블 수정

##### `progress_records` 테이블에 컬럼 추가
```sql
ALTER TABLE progress_records 
ADD COLUMN ai_generated BOOLEAN DEFAULT 0 COMMENT 'AI로 생성되었는지 여부',
ADD COLUMN generation_time_seconds INT COMMENT '리포트 생성 소요 시간',
ADD COLUMN edit_count INT DEFAULT 0 COMMENT '수정 횟수 (AI 품질 지표)',
ADD COLUMN card_news_generated BOOLEAN DEFAULT 0 COMMENT '카드뉴스 생성 여부';
```

---

### 6.2 데이터 수집 구현

#### 6.2.1 활동 로그 수집 (Middleware)

**Backend: `middleware/activity_logger.py`**
```python
from flask import request, g
from datetime import datetime
import json

def log_activity(action_type, action_detail=None):
    """활동 로그 저장"""
    try:
        academy_id = g.get('academy_id')
        user_id = g.get('user_id')
        
        if not academy_id:
            return
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO activity_logs 
            (academy_id, user_id, action_type, action_detail, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            academy_id,
            user_id,
            action_type,
            json.dumps(action_detail) if action_detail else None,
            request.remote_addr,
            request.user_agent.string
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Activity log error: {e}")

# 사용 예시
@app.route('/api/reports', methods=['POST'])
@login_required
def create_report():
    # ... 리포트 생성 로직 ...
    
    log_activity('create_report', {
        'report_id': report_id,
        'student_id': student_id,
        'ai_generated': True
    })
    
    return jsonify({'success': True})
```

**적용 대상 엔드포인트**:
- `/api/auth/login` → `log_activity('login')`
- `/api/reports` (POST) → `log_activity('create_report')`
- `/api/reports/share` → `log_activity('share_kakaotalk')`
- `/api/students` (POST) → `log_activity('create_student')`
- `/api/attendance/check-in` → `log_activity('check_in')`

#### 6.2.2 학부모 열람 추적

**TutorNote Frontend: `pages/share/[token].tsx`**
```typescript
// 학부모가 공유 페이지 진입 시
useEffect(() => {
  const trackView = async () => {
    const startTime = Date.now();
    
    // 페이지 진입 기록
    await fetch(`/api/reports/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        share_token: token,
        viewer_type: 'parent'
      })
    });
    
    // 페이지 이탈 시 체류 시간 기록
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      // Beacon API로 페이지 이탈 시에도 전송 보장
      navigator.sendBeacon(
        '/api/reports/track-duration',
        JSON.stringify({ share_token: token, duration })
      );
    };
  };
  
  trackView();
}, [token]);
```

**Backend: `routes/reports.py`**
```python
@app.route('/api/reports/track-view', methods=['POST'])
def track_view():
    data = request.json
    share_token = data.get('share_token')
    viewer_type = data.get('viewer_type', 'parent')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
    cursor.close()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/reports/track-duration', methods=['POST'])
def track_duration():
    data = request.json
    share_token = data.get('share_token')
    duration = data.get('duration')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 최근 열람 기록 업데이트
    cursor.execute("""
        UPDATE report_views
        SET view_duration_seconds = %s
        WHERE share_token = %s
        ORDER BY created_at DESC
        LIMIT 1
    """, (duration, share_token))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return '', 204  # No Content
```

#### 6.2.3 Claude API 사용량 추적

**Backend: `utils/claude_api.py`**
```python
import anthropic
import time
from decimal import Decimal
import os

def generate_feedback_with_tracking(prompt, academy_id):
    """Claude API 호출 + 사용량 추적"""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    
    start_time = time.time()
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # 토큰 사용량 계산
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        
        # 비용 계산 (Claude Sonnet 4 가격 기준)
        # Input: $3 per 1M tokens, Output: $15 per 1M tokens
        input_cost = Decimal(input_tokens) * Decimal('3') / Decimal('1000000')
        output_cost = Decimal(output_tokens) * Decimal('15') / Decimal('1000000')
        total_cost = input_cost + output_cost
        
        # 사용량 로그 저장
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO api_usage_logs
            (api_name, academy_id, endpoint, request_tokens, response_tokens, 
             total_cost, response_time_ms, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            'claude',
            academy_id,
            '/v1/messages',
            input_tokens,
            output_tokens,
            float(total_cost),
            response_time_ms,
            'success'
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return response.content[0].text
        
    except Exception as e:
        # 에러 로그 저장
        response_time_ms = int((time.time() - start_time) * 1000)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO api_usage_logs
            (api_name, academy_id, endpoint, response_time_ms, status, error_message)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            'claude',
            academy_id,
            '/v1/messages',
            response_time_ms,
            'error',
            str(e)
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        raise e

# 기존 코드 수정
# AS-IS
# feedback = client.messages.create(...)

# TO-BE
feedback = generate_feedback_with_tracking(prompt, academy_id)
```

#### 6.2.4 시스템 헬스체크 (Cron Job)

**서버: `scripts/health_check.py`**
```python
#!/usr/bin/env python3
import psutil
import mysql.connector
import time
import os
from dotenv import load_dotenv

load_dotenv()

def collect_system_metrics():
    """시스템 리소스 사용량 수집"""
    
    # CPU, RAM, Disk 사용률
    cpu_usage = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    ram_usage = ram.percent
    disk = psutil.disk_usage('/')
    disk_usage = disk.percent
    
    # DB 연결 수 (MySQL 기준)
    try:
        net_connections = len([
            conn for conn in psutil.net_connections()
            if conn.status == 'ESTABLISHED' and conn.laddr.port == 3306
        ])
    except:
        net_connections = 0
    
    # DB에 저장
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME')
        )
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO system_health_logs
            (cpu_usage, ram_usage, disk_usage, active_connections)
            VALUES (%s, %s, %s, %s)
        """, (cpu_usage, ram_usage, disk_usage, net_connections))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] CPU: {cpu_usage}%, RAM: {ram_usage}%, Disk: {disk_usage}%")
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == '__main__':
    collect_system_metrics()
```

**Crontab 설정**:
```bash
# /etc/crontab 또는 crontab -e

# 5분마다 시스템 헬스체크 실행
*/5 * * * * /usr/bin/python3 /home/tutornote/scripts/health_check.py >> /var/log/tutornote/health_check.log 2>&1
```

**Python psutil 설치**:
```bash
pip install psutil python-dotenv --break-system-packages
```

---

### 6.3 데이터 집계 배치 작업 (선택적)

#### 6.3.1 일일 집계 (Daily Aggregation)

**서버: `scripts/daily_aggregation.py`**
```python
#!/usr/bin/env python3
"""
일일 집계: DAU, 신규 학원, 리포트 생성 수 등
매일 새벽 2시 실행
"""

import mysql.connector
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

def aggregate_daily_metrics():
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )
    cursor = conn.cursor()
    
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # DAU 계산
    cursor.execute("""
        SELECT COUNT(DISTINCT academy_id) as dau
        FROM activity_logs
        WHERE DATE(created_at) = %s
    """, (yesterday,))
    dau = cursor.fetchone()[0] or 0
    
    # 신규 학원 수
    cursor.execute("""
        SELECT COUNT(*) as new_academies
        FROM academies
        WHERE DATE(created_at) = %s
        AND is_deleted = 0
    """, (yesterday,))
    new_academies = cursor.fetchone()[0] or 0
    
    # 리포트 생성 수
    cursor.execute("""
        SELECT COUNT(*) as reports_created
        FROM progress_records
        WHERE DATE(created_at) = %s
        AND is_deleted = 0
    """, (yesterday,))
    reports_created = cursor.fetchone()[0] or 0
    
    print(f"[{datetime.now()}] Daily aggregation completed for {yesterday}")
    print(f"  DAU: {dau}, New Academies: {new_academies}, Reports: {reports_created}")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    aggregate_daily_metrics()
```

**Crontab 설정**:
```bash
# 매일 새벽 2시에 일일 집계 실행
0 2 * * * /usr/bin/python3 /home/tutornote/scripts/daily_aggregation.py >> /var/log/tutornote/daily_aggregation.log 2>&1
```

---

## 7. 구현 전략 및 운영 계획

### 10.1 Pre-work: 구현 시작 전 준비 작업

구현 시작 전 반드시 완료해야 할 기반 작업입니다. 이 작업들이 완료되어야 Phase 1을 안정적으로 시작할 수 있습니다.

#### 7.1.1 Alert 중복 방지 로직

**목적**: 5분마다 헬스체크가 실행되면서 같은 Critical Alert가 반복 발송되는 것을 방지

**구현 파일**: `backend/utils/alert_deduplicator.py`

**핵심 로직**:
```python
from datetime import datetime, timedelta
from typing import Dict, Optional

class AlertDeduplicator:
    """
    Alert 중복 발송 방지 클래스
    같은 알림을 설정된 시간(기본 60분) 내에는 재발송하지 않음
    """
    
    def __init__(self):
        self._sent_alerts: Dict[str, datetime] = {}
    
    def should_send_alert(self, alert_key: str, cooldown_minutes: int = 60) -> bool:
        """
        알림 발송 여부 결정
        
        Args:
            alert_key: 알림 고유 키 (예: "cpu_critical_92.4", "backend_restart_102")
            cooldown_minutes: 재발송 방지 시간 (분)
        
        Returns:
            bool: True면 발송, False면 Skip
        """
        now = datetime.now()
        
        if alert_key in self._sent_alerts:
            last_sent = self._sent_alerts[alert_key]
            elapsed = (now - last_sent).total_seconds() / 60
            
            if elapsed < cooldown_minutes:
                print(f"Alert '{alert_key}' skipped (sent {elapsed:.1f}m ago)")
                return False
        
        # 발송 허용 - 시간 기록
        self._sent_alerts[alert_key] = now
        return True
    
    def reset_alert(self, alert_key: str):
        """특정 알림 즉시 재발송 가능하도록 리셋"""
        if alert_key in self._sent_alerts:
            del self._sent_alerts[alert_key]
    
    def clear_old_alerts(self, hours: int = 24):
        """24시간 이상 오래된 알림 기록 삭제 (메모리 관리)"""
        now = datetime.now()
        keys_to_delete = []
        
        for key, sent_time in self._sent_alerts.items():
            if (now - sent_time).total_seconds() > hours * 3600:
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self._sent_alerts[key]


# 싱글톤 인스턴스
alert_deduplicator = AlertDeduplicator()
```

**사용 예시**:
```python
from utils.alert_deduplicator import alert_deduplicator
from utils.telegram_notifier import telegram_notifier

def check_cpu_alert():
    cpu_usage = psutil.cpu_percent(interval=1)
    
    if cpu_usage > 90:
        alert_key = f"cpu_critical_{cpu_usage:.1f}"
        
        # 중복 체크 - 60분 내 같은 CPU 사용률 알림 Skip
        if alert_deduplicator.should_send_alert(alert_key, cooldown_minutes=60):
            telegram_notifier.send_critical_alert({
                'severity': 'critical',
                'title': f'CPU 사용률 위험: {cpu_usage}%',
                'description': f'현재 CPU 사용률이 {cpu_usage}%로 매우 높습니다.',
                'action': 'Backend 재시작 또는 프로세스 확인이 필요합니다.'
            })
```

---

#### 7.1.2 Alert 임계값 Config 파일

**목적**: 하드코딩된 임계값을 설정 파일로 분리하여 운영 중 조정 가능

**구현 파일**: `backend/config/alert_thresholds.py`

```python
"""
Alert 임계값 설정
운영 중 이 파일을 수정하고 서버 재시작하면 즉시 반영됨
"""

# 시스템 리소스 임계값
SYSTEM_THRESHOLDS = {
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
BUSINESS_THRESHOLDS = {
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
ALERT_COOLDOWN = {
    'cpu_critical': 60,         # CPU 위험 알림은 1시간마다
    'cpu_warning': 120,         # CPU 주의 알림은 2시간마다
    'backend_restart': 30,      # Backend 재시작은 30분마다
    'inactive_academy': 1440,   # 무활동 학원은 1일(24시간)마다
    'parent_view_rate': 720,    # 학부모 열람률은 12시간마다
}

# 텔레그램 알림 설정
TELEGRAM_NOTIFICATION = {
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
    """Alert 중복 방지 시간(분) 가져오기"""
    return ALERT_COOLDOWN.get(alert_type, 60)  # 기본 60분
```

**사용 예시**:
```python
from config.alert_thresholds import get_threshold, get_cooldown

# 임계값 가져오기
cpu_critical = get_threshold('system', 'cpu', 'critical')  # 90
inactive_warning = get_threshold('business', 'inactive_days', 'warning')  # 14

# Cooldown 시간 가져오기
cooldown = get_cooldown('cpu_critical')  # 60분

# Alert 체크
if cpu_usage > cpu_critical:
    if alert_deduplicator.should_send_alert('cpu_critical', cooldown):
        send_telegram_alert(...)
```

---

#### 7.1.3 텔레그램 배포 알림 기능

**목적**: Phase별 구현 완료 및 배포 완료 시 텔레그램으로 자동 알림

**구현 파일**: `backend/utils/deployment_notifier.py`

```python
import os
from datetime import datetime
from typing import List, Dict
from utils.telegram_notifier import telegram_notifier

class DeploymentNotifier:
    """배포 및 Phase 완료 알림"""
    
    @staticmethod
    def notify_phase_complete(phase: str, completed_tasks: List[str]):
        """
        Phase 완료 시 텔레그램 알림
        
        Args:
            phase: "Phase 1: 긴급 수정" 등
            completed_tasks: ["DB 스키마 생성", "Claude API 추적"] 등
        """
        message = f"""
✅ **{phase} 구현 완료!**

**완료된 작업**:
"""
        for i, task in enumerate(completed_tasks, 1):
            message += f"  {i}. ✓ {task}\n"
        
        message += f"\n⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        message += f"\n\n🚀 다음 단계로 진행 가능합니다."
        
        telegram_notifier.send_message(message)
    
    @staticmethod
    def notify_deployment_start(environment: str, version: str):
        """배포 시작 알림"""
        message = f"""
🔵 **Master Admin 배포 시작**

**환경**: {environment}
**버전**: {version}
**시작 시간**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

배포 진행 중입니다...
"""
        telegram_notifier.send_message(message)
    
    @staticmethod
    def notify_deployment_complete(
        environment: str, 
        version: str, 
        changes: List[str],
        dashboard_url: str = "https://tma.tutornote.kr"
    ):
        """
        배포 완료 시 텔레그램 알림
        
        Args:
            environment: "Staging" 또는 "Production"
            version: "v1.1.0" 등
            changes: ["Critical Alerts 추가", "12개 지표 통합"] 등
            dashboard_url: 대시보드 URL
        """
        emoji = "🟢" if environment == "Production" else "🟡"
        
        message = f"""
{emoji} **Master Admin 배포 완료**

**환경**: {environment}
**버전**: {version}
**배포 시간**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

**주요 변경사항**:
"""
        for i, change in enumerate(changes, 1):
            message += f"  {i}. {change}\n"
        
        message += f"\n🔗 [대시보드 바로가기]({dashboard_url})"
        message += f"\n\n✅ 배포가 정상적으로 완료되었습니다."
        
        telegram_notifier.send_message(message)
    
    @staticmethod
    def notify_deployment_failed(environment: str, version: str, error: str):
        """배포 실패 알림"""
        message = f"""
🔴 **Master Admin 배포 실패**

**환경**: {environment}
**버전**: {version}
**실패 시간**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

**에러 내용**:
```
{error}
```

⚠️ 즉시 확인이 필요합니다.
"""
        telegram_notifier.send_message(message)


# 싱글톤 인스턴스
deployment_notifier = DeploymentNotifier()
```

**사용 예시**:
```python
from utils.deployment_notifier import deployment_notifier

# Phase 완료 알림
deployment_notifier.notify_phase_complete(
    "Phase 1: 긴급 수정",
    [
        "DB 스키마 5개 테이블 생성",
        "Claude API 사용량 추적 로직",
        "활동 로그 미들웨어",
        "시스템 헬스체크 Cron",
        "Critical Alerts UI"
    ]
)

# 배포 시작 알림
deployment_notifier.notify_deployment_start("Production", "v1.1.0")

# 배포 완료 알림
deployment_notifier.notify_deployment_complete(
    "Production",
    "v1.1.0",
    [
        "Critical Alerts 최상단 배치",
        "12개 핵심 지표 통합",
        "데이터 정합성 개선",
        "텔레그램 알림 연동"
    ]
)
```

---

#### 7.1.4 Staging 환경 셋업 가이드

**목적**: 프로덕션 배포 전 안전하게 테스트할 수 있는 환경 구축

**필요 리소스**:
1. **Staging DB**
   - 프로덕션 DB 복사본 (익명화 필요 없음 - 내부 테스트용)
   - 명명 규칙: `tutornote_staging`

2. **Staging 서버**
   - Option A: 별도 포트 사용 (예: 3005)
   - Option B: 서브도메인 (예: `staging.tma.tutornote.kr`)
   - **추천**: Option A (간단함, 비용 절감)

3. **Staging 환경변수**
   ```bash
   # .env.staging
   NODE_ENV=staging
   DATABASE_URL=mysql://user:pass@localhost:3306/tutornote_staging
   TELEGRAM_CHAT_ID=staging_test_chat_id  # 프로덕션과 분리
   MASTER_ADMIN_URL=http://localhost:3005
   ```

**Staging 배포 프로세스**:
```bash
# 1. Staging DB 생성 (프로덕션 복사)
mysqldump -u root -p tutornote > backup.sql
mysql -u root -p -e "CREATE DATABASE tutornote_staging;"
mysql -u root -p tutornote_staging < backup.sql

# 2. Staging 서버 실행
cd /home/tutornote/frontend
npm run build
PM2_HOME=/home/tutornote/.pm2 pm2 start npm --name "tutornote-admin-staging" -- start -- -p 3005

# 3. Nginx 설정 (선택적)
# location /staging/ {
#     proxy_pass http://localhost:3005/;
# }

# 4. 접속 테스트
curl http://localhost:3005/api/admin/dashboard/overview
```

**Staging 텔레그램 테스트 채널 생성**:
1. 텔레그램에서 새 그룹 생성: "TutorNote Admin Staging"
2. 기존 봇을 그룹에 추가
3. Chat ID 확인: `https://api.telegram.org/bot{BOT_TOKEN}/getUpdates`
4. `.env.staging`에 Chat ID 설정

---

### 10.2 배포 전략: Phase 1+2 통합 배포

**선택한 전략**: Option A (Phase 1+2 완료 후 한번에 배포, Phase 3은 별도 배포)

**이유**:
- Phase 1과 Phase 2는 기능적으로 강하게 연결됨 (DB 스키마 → 데이터 수집 → UI 표시)
- 중간에 배포하면 "반쪽짜리 대시보드" 상태가 되어 혼란 초래
- Phase 3는 선택적 고도화 기능이므로 안정화 후 추가 배포 가능

**배포 타임라인**:
```
Week 1-3: Phase 1+2 개발
  ├─ Week 1: Phase 1 (긴급 수정)
  ├─ Week 2-3: Phase 2 (핵심 지표 재구성)
  └─ Day 15: Staging 배포 → 2일간 검증
     
Week 3 Day 17: Phase 1+2 프로덕션 배포 🚀
  ├─ 배포 전: DB 백업, 환경변수 확인
  ├─ 배포: 30분 전 공지, 배포 시간 30분 이내
  ├─ 배포 후: 1시간 모니터링
  └─ 텔레그램 완료 알림 발송 ✅

Week 4: 안정화 기간 (1주일)
  ├─ 일일 모니터링 (CPU, 에러 로그, 텔레그램 알림)
  ├─ 버그 수정 및 핫픽스
  └─ 데이터 정합성 검증

Week 5-6: Phase 3 개발
  ├─ 일일/월간 집계 배치
  ├─ PDF 내보내기
  ├─ 시계열 차트
  └─ 모바일 반응형

Week 6 Day 35: Phase 3 프로덕션 배포 🚀
  └─ 텔레그램 완료 알림 발송 ✅
```

---

### 10.3 데이터 백필 계획: Option C (시작일 라벨 표시)

**선택한 전략**: Option C - 과거 데이터 없이 새로 시작하되, "데이터 수집 시작일" 명확히 표시

**이유**:
- 깔끔하고 정직한 방법
- 백필 작업 시간 절약 (추정 20시간 절약)
- 2-4주면 충분한 데이터 축적됨

**UI 구현 방법**:

**1) 대시보드 상단에 Info 배너 표시**:
```tsx
// components/dashboard/DataCollectionBanner.tsx
export function DataCollectionBanner() {
  const startDate = "2026-01-15";  // 실제 데이터 수집 시작일
  const daysElapsed = Math.floor(
    (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-600" />
        <div className="text-sm text-blue-800">
          <strong>데이터 수집 시작:</strong> {startDate} (D+{daysElapsed}일째)
          <span className="ml-2 text-blue-600">
            • 충분한 데이터 축적까지 2-4주 소요 예상
          </span>
        </div>
      </div>
    </div>
  );
}
```

**2) 개별 지표 카드에 툴팁 추가**:
```tsx
// components/dashboard/MetricCard.tsx
<div className="metric-card">
  <div className="flex items-center justify-between">
    <h3>{title}</h3>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info className="w-4 h-4 text-gray-400" />
        </TooltipTrigger>
        <TooltipContent>
          2026-01-15부터 수집된 데이터입니다.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
  <div className="value">{value}</div>
</div>
```

**3) 2주 후 자동으로 배너 숨김**:
```tsx
// 데이터 수집 14일 경과 시 배너 자동 숨김
if (daysElapsed > 14) {
  return null;  // 배너 숨김
}
```

---

### 9.4 Pre-work 완료 체크리스트

구현 시작 전 반드시 확인:

- [ ] **Alert 중복 방지 로직** 구현 완료
  - [ ] `utils/alert_deduplicator.py` 작성
  - [ ] 단위 테스트 통과
  
- [ ] **Alert 임계값 Config** 구현 완료
  - [ ] `config/alert_thresholds.py` 작성
  - [ ] 환경변수 또는 파일 수정으로 조정 가능 확인
  
- [ ] **텔레그램 배포 알림** 구현 완료
  - [ ] `utils/deployment_notifier.py` 작성
  - [ ] Phase 완료 알림 테스트
  - [ ] 배포 완료 알림 테스트
  
- [ ] **Staging 환경** 셋업 완료
  - [ ] Staging DB 생성 (tutornote_staging)
  - [ ] Staging 서버 실행 (포트 3005)
  - [ ] Staging 텔레그램 채널 생성 및 Chat ID 설정
  - [ ] `.env.staging` 환경변수 설정
  
- [ ] **기존 프로덕션 백업**
  - [ ] DB 백업 (`mysqldump tutornote > backup_20260115.sql`)
  - [ ] 코드 백업 (Git 태그: `v1.0.0`)
  
- [ ] **텔레그램 봇 설정** 확인
  - [ ] `TELEGRAM_BOT_TOKEN` 환경변수 설정
  - [ ] `TELEGRAM_CHAT_ID` (프로덕션) 설정
  - [ ] 테스트 메시지 발송 성공

**Pre-work 완료 시 텔레그램 알림**:
```python
deployment_notifier.notify_phase_complete(
    "Pre-work: 구현 준비",
    [
        "Alert 중복 방지 로직",
        "Alert 임계값 Config",
        "텔레그램 배포 알림 기능",
        "Staging 환경 셋업",
        "프로덕션 백업 완료"
    ]
)
```

---

## 8. 구현 단계별 계획

### 10.1 Phase 1: 긴급 수정 (1주일)

**목표**: 데이터 정합성 확보 및 Critical Alerts 추가

#### Week 1 Tasks

| 순번 | 작업 | 담당 | 소요 시간 | 우선순위 |
|------|------|------|----------|----------|
| 1.1 | DB 스키마 설계 및 생성 (5개 테이블) | Backend Dev | 3h | 긴급 |
| 1.2 | Claude API 사용량 추적 로직 구현 | Backend Dev | 4h | 긴급 |
| 1.3 | 활동 로그 middleware 구현 | Backend Dev | 3h | 긴급 |
| 1.4 | 시스템 헬스체크 cron job 구현 | DevOps | 2h | 긴급 |
| 1.5 | Critical Alerts 섹션 UI 구현 | Frontend Dev | 6h | 긴급 |
| 1.6 | Alert Rule 로직 구현 | Backend Dev | 4h | 긴급 |
| 1.7 | 기존 "인사이트 지표" 메뉴 숨김 처리 | Frontend Dev | 1h | 중간 |
| 1.8 | 데이터 정합성 검증 및 수정 | Backend Dev | 3h | 긴급 |

**총 소요 시간**: 26시간 (약 3-4일)

**완료 기준 (Definition of Done)**:
- ✅ Claude API 사용량이 실시간으로 대시보드에 반영
- ✅ 활동 로그가 정확하게 저장되고 조회 가능
- ✅ CPU 92.4% 같은 Critical 상황이 최상단에 표시
- ✅ Backend 재시작 102회가 대시보드에 표시
- ✅ 모든 데이터 집계 로직이 정확한 값 반환

---

### 10.2 Phase 2: 핵심 지표 재구성 (2주일)

**목표**: 비즈니스 중심 지표 카드 구현 및 테이블 추가

#### Week 2-3 Tasks

| 순번 | 작업 | 담당 | 소요 시간 | 우선순위 |
|------|------|------|----------|----------|
| 2.1 | report_views 테이블 생성 및 추적 로직 | Backend Dev | 4h | 높음 |
| 2.2 | operational_costs 테이블 및 입력 UI | Full Stack | 5h | 높음 |
| 2.3 | progress_records 컬럼 추가 (4개) | Backend Dev | 1h | 높음 |
| 2.4 | 학부모 열람 추적 프론트엔드 구현 | Frontend Dev | 3h | 높음 |
| 2.5 | 온보딩 퍼널 데이터 수집 | Backend Dev | 4h | 높음 |
| 2.6 | 핵심 지표 API 12개 구현 | Backend Dev | 16h | 높음 |
| 2.7 | 핵심 지표 카드 12개 UI 구현 | Frontend Dev | 12h | 높음 |
| 2.8 | 이탈 위험 학원 테이블 구현 | Full Stack | 4h | 높음 |
| 2.9 | 활성 학원 상세 테이블 구현 | Full Stack | 3h | 중간 |
| 2.10 | 온보딩 퍼널 분석 테이블 구현 | Full Stack | 3h | 중간 |
| 2.11 | 빠른 액션 버튼 4개 구현 | Full Stack | 6h | 중간 |
| 2.12 | 통합 테스트 및 버그 수정 | Full Stack | 8h | 높음 |

**총 소요 시간**: 69시간 (약 9일)

**완료 기준**:
- ✅ 12개 핵심 지표 카드가 정확한 데이터 표시
- ✅ 학부모 열람률이 실시간으로 업데이트
- ✅ 이탈 위험 학원 테이블에서 바로 액션 가능
- ✅ 온보딩 퍼널에서 병목 구간 명확히 보임
- ✅ 빠른 액션 버튼이 실제로 작동
- ✅ "인사이트 지표" 메뉴 완전 제거

---

### 10.3 Phase 3: 고도화 (2주일)

**목표**: 예측 모델, 알림 연동, 상세 분석 기능

#### Week 4-5 Tasks

| 순번 | 작업 | 담당 | 소요 시간 | 우선순위 |
|------|------|------|----------|----------|
| 3.1 | 일일/월간 집계 배치 작업 | Backend Dev | 4h | 중간 |
| 3.2 | 이탈 가능성 예측 모델 (규칙 기반) | Backend Dev | 6h | 낮음 |
| 3.3 | Critical Alert → 텔레그램 알림 연동 | Backend Dev | 3h | 중간 |
| 3.4 | 대시보드 CSV/PDF 내보내기 | Full Stack | 5h | 낮음 |
| 3.5 | 시계열 차트 (DAU, 리포트 추이) | Frontend Dev | 6h | 낮음 |
| 3.6 | 모바일 반응형 최적화 | Frontend Dev | 8h | 중간 |
| 3.7 | 성능 최적화 (쿼리, 인덱스) | Backend Dev | 6h | 중간 |
| 3.8 | Redis 캐싱 도입 (선택적) | Backend Dev | 8h | 낮음 |
| 3.9 | 최종 통합 테스트 및 QA | Full Stack | 6h | 높음 |

**총 소요 시간**: 53시간 (약 7일)

**완료 기준**:
- ✅ 매일 자동으로 집계 작업 실행
- ✅ Critical Alert 발생 시 텔레그램 알림 수신
- ✅ 대시보드를 PDF로 저장 가능
- ✅ 모바일에서도 대시보드 사용 가능
- ✅ API 응답 시간 < 1초

---

### 9.4 구현 순서 상세 플로우

```
┌─────────────────────────────────────────────────────────────┐
│ Week 1: 긴급 수정 (3-4일)                                     │
├─────────────────────────────────────────────────────────────┤
│ Day 1-2: 인프라 구축                                          │
│   ├─ DB 스키마 설계 및 생성 (5개 테이블)                      │
│   ├─ activity_logs, api_usage_logs, system_health_logs      │
│   └─ 마이그레이션 스크립트 작성 및 실행                       │
│                                                                 │
│ Day 2-3: 데이터 수집 로직 구현                                │
│   ├─ Claude API 사용량 추적 (utils/claude_api.py)            │
│   ├─ 활동 로그 middleware (middleware/activity_logger.py)    │
│   ├─ 시스템 헬스체크 cron (scripts/health_check.py)          │
│   └─ 모든 주요 엔드포인트에 로그 추가                         │
│                                                                 │
│ Day 3-4: Critical Alerts 섹션 구현                           │
│   ├─ Alert Rule 로직 (utils/alert_checker.py)               │
│   ├─ API 엔드포인트 (GET /api/admin/alerts)                  │
│   ├─ UI 컴포넌트 (components/CriticalAlerts.tsx)             │
│   └─ 인사이트 지표 메뉴 숨김 처리                            │
│                                                                 │
│ Day 4: 검증 및 수정                                           │
│   ├─ 데이터 정합성 테스트                                     │
│   ├─ Claude API 사용량 확인                                   │
│   ├─ 활동 로그 저장 확인                                     │
│   └─ 버그 수정                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Week 2-3: 핵심 지표 재구성 (9일)                              │
├─────────────────────────────────────────────────────────────┤
│ Week 2 (Day 1-5):                                             │
│   Day 1-2: DB 스키마 추가 및 데이터 수집                      │
│     ├─ report_views, operational_costs 테이블                │
│     ├─ progress_records 컬럼 추가 (4개)                       │
│     └─ 학부모 열람 추적 구현 (프론트+백)                      │
│                                                                 │
│   Day 3-5: 핵심 지표 API 구현                                │
│     ├─ Row 1: 비즈니스 건강도 (4개 API)                       │
│     ├─ Row 2: 사용자 참여 (4개 API)                          │
│     └─ Row 3: 수익화 & 시스템 (4개 API)                       │
│                                                                 │
│ Week 3 (Day 6-9):                                             │
│   Day 6-7: 핵심 지표 카드 UI 구현                            │
│     ├─ MetricCard 컴포넌트 개발                               │
│     ├─ 4x3 Grid 레이아웃 구성                                │
│     ├─ 데이터 페칭 로직 (SWR)                                │
│     └─ 트렌드 표시 (▲▼→)                                    │
│                                                                 │
│   Day 8: 테이블 섹션 구현                                    │
│     ├─ 이탈 위험 학원 테이블                                  │
│     ├─ 활성 학원 상세 테이블                                  │
│     ├─ 온보딩 퍼널 분석 테이블                                │
│     └─ 빠른 액션 버튼 4개                                    │
│                                                                 │
│   Day 9: 통합 테스트 및 버그 수정                            │
│     ├─ 전체 플로우 테스트                                     │
│     ├─ 데이터 정합성 검증                                     │
│     └─ 버그 수정                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Week 4-5: 고도화 (7일)                                        │
├─────────────────────────────────────────────────────────────┤
│ Week 4 (Day 1-4):                                             │
│   Day 1: 배치 작업 구현                                      │
│     ├─ 일일 집계 (daily_aggregation.py)                      │
│     ├─ 월간 집계 (monthly_aggregation.py)                    │
│     └─ Crontab 설정                                           │
│                                                                 │
│   Day 2: 알림 연동                                           │
│     ├─ 기존 텔레그램 봇 연동                                  │
│     ├─ Alert → 텔레그램 메시지 포맷팅                        │
│     └─ 테스트                                                 │
│                                                                 │
│   Day 3-4: 추가 기능                                         │
│     ├─ CSV/PDF 내보내기                                       │
│     ├─ 시계열 차트 (Recharts)                                │
│     └─ 예측 모델 (간단한 규칙 기반)                          │
│                                                                 │
│ Week 5 (Day 5-7):                                             │
│   Day 5-6: 성능 최적화 및 모바일 대응                        │
│     ├─ 쿼리 최적화 (인덱스 추가)                              │
│     ├─ Redis 캐싱 도입 (선택적)                               │
│     ├─ API 응답 속도 개선                                     │
│     ├─ 반응형 레이아웃 수정                                   │
│     └─ 모바일 테스트                                          │
│                                                                 │
│   Day 7: 최종 검수 및 배포                                   │
│     ├─ 전체 시나리오 테스트                                   │
│     ├─ 문서화 (README, API 문서)                             │
│     ├─ Staging 배포 및 검증                                   │
│     └─ Production 배포                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 기술 스택 및 구현 가이드

### 10.1 기술 스택

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| **Frontend** | Next.js | 16 | Master Admin 프론트엔드 |
| | React | 18 | UI 라이브러리 |
| | TypeScript | 5.x | 타입 안정성 |
| | Tailwind CSS | v4 | 스타일링 |
| | shadcn/ui | latest | UI 컴포넌트 라이브러리 |
| | Recharts | 2.x | 차트 라이브러리 |
| | SWR | 2.x | 데이터 페칭 및 캐싱 |
| **Backend** | Flask | 3.x | Python 웹 프레임워크 |
| | MySQL | 8.x | 관계형 데이터베이스 |
| | Redis | 7.x | 캐싱 (Phase 3, 선택적) |
| | psutil | latest | 시스템 리소스 모니터링 |
| **인프라** | Vultr VPS | - | 서버 호스팅 |
| | PM2 | latest | 프로세스 관리 |
| | Nginx | latest | 리버스 프록시 |
| | Cron | - | 배치 작업 스케줄링 |
| **모니터링** | python-crontab | latest | Cron 작업 관리 |
| **알림** | python-telegram-bot | latest | 텔레그램 알림 (Phase 3) |

---

### 10.2 프로젝트 구조

```
tutornote/
├── backend/
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── dashboard.py          # 대시보드 API
│   │   │   ├── alerts.py             # Critical Alerts API
│   │   │   ├── metrics.py            # 지표 API
│   │   │   └── actions.py            # 빠른 액션 API
│   │   └── reports.py                # 리포트 추적 API 추가
│   ├── middleware/
│   │   └── activity_logger.py        # 활동 로그 미들웨어
│   ├── utils/
│   │   ├── claude_api.py             # Claude API 래퍼 (사용량 추적)
│   │   ├── alert_checker.py          # Alert Rule 로직
│   │   └── db_utils.py               # DB 유틸리티
│   └── scripts/
│       ├── health_check.py           # 시스템 헬스체크 (Cron)
│       ├── daily_aggregation.py      # 일일 집계 (Cron)
│       └── monthly_aggregation.py    # 월간 집계 (Cron)
│
├── master-admin/                      # Master Admin Frontend
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx              # 새 대시보드 페이지
│   │   ├── operational-costs/
│   │   │   └── page.tsx              # 운영 비용 입력 페이지
│   │   └── ...
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── CriticalAlerts.tsx    # Critical Alerts 컴포넌트
│   │   │   ├── MetricCard.tsx        # 지표 카드 컴포넌트
│   │   │   ├── ChurnRiskTable.tsx    # 이탈 위험 학원 테이블
│   │   │   ├── OnboardingFunnel.tsx  # 온보딩 퍼널
│   │   │   └── QuickActions.tsx      # 빠른 액션 버튼
│   │   └── ...
│   └── lib/
│       └── api/
│           └── dashboard.ts           # 대시보드 API 클라이언트
│
├── tutornote-frontend/                # TutorNote Frontend
│   └── pages/
│       └── share/
│           └── [token].tsx            # 학부모 공유 페이지 (열람 추적 추가)
│
└── database/
    ├── migrations/
    │   ├── 001_create_activity_logs.sql
    │   ├── 002_create_api_usage_logs.sql
    │   ├── 003_create_report_views.sql
    │   ├── 004_create_operational_costs.sql
    │   ├── 005_create_system_health_logs.sql
    │   ├── 006_create_api_health_checks.sql
    │   └── 007_alter_progress_records.sql
    └── seeds/
        └── sample_data.sql
```

---

### 10.3 API 엔드포인트 설계

#### 8.3.1 대시보드 메인 API

**GET `/api/admin/dashboard/overview`**

종합 대시보드 데이터 반환

```json
// Response
{
  "critical_alerts": [...],
  "metrics": {
    "business_health": {...},
    "user_engagement": {...},
    "revenue_system": {...}
  },
  "last_updated": "2026-01-04T23:15:00Z"
}
```

#### 8.3.2 개별 섹션 API

**GET `/api/admin/dashboard/alerts`**
```json
{
  "alerts": [
    {
      "id": "sys-cpu-001",
      "category": "system",
      "severity": "critical",
      "title": "CPU 사용률 92.4%",
      "description": "서버 부하 높음, 즉시 확인 필요",
      "timestamp": "2026-01-04T23:15:00Z",
      "action_buttons": [
        {"label": "시스템 페이지로 이동", "action": "navigate", "link": "/system"}
      ]
    }
  ]
}
```

**GET `/api/admin/dashboard/churn-risk-academies`**
```json
{
  "academies": [
    {
      "id": 3,
      "name": "음악학원",
      "owner_name": "-",
      "student_count": 3,
      "report_count": 7,
      "last_activity": "2025-12-12T10:30:00Z",
      "inactive_days": 23,
      "risk_level": "critical"
    }
  ]
}
```

**GET `/api/admin/dashboard/active-academies`**
```json
{
  "academies": [
    {
      "id": 1,
      "name": "OO피아노학원",
      "student_count": 8,
      "report_count": 24,
      "dau": 5,
      "last_activity": "2026-01-04T10:30:00Z",
      "is_heavy_user": true,
      "recommended_plan": "Pro"
    }
  ]
}
```

**GET `/api/admin/dashboard/onboarding-funnel`**
```json
{
  "funnel": [
    {"stage": "1. 가입", "completed": 13, "completion_rate": 100.0, "churned": 0},
    {"stage": "2. 학생 1명 등록", "completed": 13, "completion_rate": 100.0, "churned": 0},
    {"stage": "3. 첫 리포트 생성", "completed": 13, "completion_rate": 100.0, "churned": 0},
    {"stage": "4. 첫 카톡 공유", "completed": 8, "completion_rate": 61.5, "churned": 5}
  ]
}
```

#### 8.3.3 빠른 액션 API

**POST `/api/admin/actions/send-churn-emails`**
```json
// Request
{
  "academy_ids": [3, 7, 11]
}

// Response
{
  "success": true,
  "emails_sent": 3,
  "failed": []
}
```

**POST `/api/admin/actions/restart-backend`**
```json
// Response
{
  "success": true,
  "message": "Backend 재시작이 시작되었습니다.",
  "estimated_downtime_seconds": 5
}
```

**GET `/api/admin/actions/generate-invite-link`**
```json
// Response
{
  "invite_link": "https://tutornote.kr/signup?ref=admin2026",
  "expires_at": "2026-02-04T00:00:00Z"
}
```

**GET `/api/admin/actions/export-dashboard-pdf`**
```
// Response: PDF File Download
Content-Type: application/pdf
Content-Disposition: attachment; filename="dashboard-2026-01-04.pdf"
```

---

### 9.4 성능 최적화 전략

#### 8.4.1 DB 쿼리 최적화

**인덱스 추가**:
```sql
-- activity_logs
CREATE INDEX idx_academy_created ON activity_logs(academy_id, created_at);
CREATE INDEX idx_created_action ON activity_logs(created_at, action_type);

-- api_usage_logs
CREATE INDEX idx_api_created ON api_usage_logs(api_name, created_at);
CREATE INDEX idx_academy_api ON api_usage_logs(academy_id, api_name);

-- report_views
CREATE INDEX idx_report_created ON report_views(report_id, created_at);
CREATE INDEX idx_token_created ON report_views(share_token, created_at);

-- system_health_logs
CREATE INDEX idx_created ON system_health_logs(created_at);

-- report_shares
CREATE INDEX idx_progress_created ON report_shares(progress_record_id, created_at);
```

**쿼리 최적화 예시**:
```sql
-- 비효율적 (전체 테이블 스캔)
SELECT COUNT(DISTINCT academy_id) FROM activity_logs
WHERE created_at >= NOW() - INTERVAL 7 DAY;

-- 효율적 (인덱스 활용)
SELECT COUNT(DISTINCT academy_id) FROM activity_logs
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
AND created_at < CURDATE() + INTERVAL 1 DAY;
```

#### 8.4.2 프론트엔드 최적화

**React 최적화**:
```typescript
// useMemo로 계산 비용 절약
const sortedAcademies = useMemo(() => {
  return academies.sort((a, b) => b.inactive_days - a.inactive_days);
}, [academies]);

// React.memo로 불필요한 리렌더링 방지
const MetricCard = React.memo(({ title, value, trend }: MetricCardProps) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
      <div className="trend">{trend}</div>
    </div>
  );
});
```

**데이터 페칭 최적화 (SWR)**:
```typescript
import useSWR from 'swr';

function Dashboard() {
  const { data, error, isLoading } = useSWR(
    '/api/admin/dashboard/overview',
    fetcher,
    {
      refreshInterval: 60000,  // 1분마다 자동 갱신
      revalidateOnFocus: false,
      dedupingInterval: 5000   // 5초 내 중복 요청 방지
    }
  );
  
  if (error) return <ErrorState error={error} />;
  if (isLoading) return <LoadingState />;
  
  return <DashboardContent data={data} />;
}
```

---

### 9.5 텔레그램 알림 구현

#### 8.5.1 기존 텔레그램 봇 연동

**현재 상황**: TutorNote는 이미 "AI Server Ops Manager"라는 24/7 서버 모니터링 텔레그램 봇을 운영 중입니다. 이 봇의 기능을 활용하여 Critical Alert를 텔레그램으로 전송합니다.

**구현 방법**:

**1) 텔레그램 알림 유틸리티 (`utils/telegram_notifier.py`)**:
```python
import os
import requests
from typing import Dict, List

class TelegramNotifier:
    """텔레그램 봇을 통한 알림 발송 클래스"""
    
    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"
    
    def send_critical_alert(self, alert: Dict) -> bool:
        """
        Critical Alert를 텔레그램으로 전송
        
        Args:
            alert: {
                'severity': 'critical' | 'warning',
                'title': str,
                'description': str,
                'action': str (optional)
            }
        """
        try:
            # 이모지 선택
            emoji = "🚨" if alert['severity'] == 'critical' else "⚠️"
            
            # 메시지 포맷팅
            message = f"""
{emoji} **TutorNote Master Admin Alert**

**{alert['title']}**

{alert['description']}
"""
            
            if alert.get('action'):
                message += f"\n📌 **권장 조치**: {alert['action']}"
            
            message += f"\n\n⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            # 텔레그램 API 호출
            response = requests.post(
                f"{self.api_url}/sendMessage",
                json={
                    'chat_id': self.chat_id,
                    'text': message,
                    'parse_mode': 'Markdown'
                },
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Telegram notification failed: {e}")
            return False
    
    def send_daily_summary(self, summary: Dict) -> bool:
        """
        일일 요약 리포트를 텔레그램으로 전송
        
        Args:
            summary: {
                'date': str,
                'active_academies': int,
                'new_reports': int,
                'issues': List[str]
            }
        """
        try:
            message = f"""
📊 **일일 요약 리포트** ({summary['date']})

✅ 활성 학원: {summary['active_academies']}개
📝 신규 리포트: {summary['new_reports']}건

"""
            if summary['issues']:
                message += "⚠️ **주의 사항**:\n"
                for issue in summary['issues']:
                    message += f"  • {issue}\n"
            else:
                message += "✨ 모든 시스템 정상 작동 중"
            
            response = requests.post(
                f"{self.api_url}/sendMessage",
                json={
                    'chat_id': self.chat_id,
                    'text': message,
                    'parse_mode': 'Markdown'
                },
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Telegram daily summary failed: {e}")
            return False


# 싱글톤 인스턴스 생성
telegram_notifier = TelegramNotifier()
```

**2) Alert 체커에 텔레그램 알림 연동 (`utils/alert_checker.py`)**:
```python
from utils.telegram_notifier import telegram_notifier

def check_and_notify_alerts():
    """
    모든 Alert를 체크하고 Critical/Warning일 경우 텔레그램 전송
    """
    alerts = []
    
    # CPU 체크
    cpu_alert = check_cpu_alert()
    if cpu_alert:
        alerts.append(cpu_alert)
        if cpu_alert['severity'] in ['critical', 'warning']:
            telegram_notifier.send_critical_alert(cpu_alert)
    
    # Backend 재시작 체크
    restart_alert = check_backend_restart_alert()
    if restart_alert:
        alerts.append(restart_alert)
        if restart_alert['severity'] == 'critical':
            telegram_notifier.send_critical_alert(restart_alert)
    
    # 무활동 학원 체크
    inactive_alert = check_inactive_academies()
    if inactive_alert:
        alerts.append(inactive_alert)
        if inactive_alert['severity'] == 'critical':
            telegram_notifier.send_critical_alert(inactive_alert)
    
    return alerts
```

**3) 헬스체크 Cron에 알림 연동 (`scripts/health_check.py`)**:
```python
import psutil
from utils.telegram_notifier import telegram_notifier

def check_system_health():
    """시스템 헬스체크 + 텔레그램 알림"""
    
    # CPU 사용률 체크
    cpu_usage = psutil.cpu_percent(interval=1)
    
    # Critical 상태일 경우 텔레그램 알림
    if cpu_usage > 90:
        telegram_notifier.send_critical_alert({
            'severity': 'critical',
            'title': f'⚠️ CPU 사용률 위험: {cpu_usage}%',
            'description': f'현재 CPU 사용률이 {cpu_usage}%로 매우 높습니다.',
            'action': 'Backend 재시작 또는 프로세스 확인이 필요합니다.'
        })
    
    # RAM 체크
    ram = psutil.virtual_memory()
    if ram.percent > 90:
        telegram_notifier.send_critical_alert({
            'severity': 'warning',
            'title': f'⚠️ RAM 사용률 높음: {ram.percent}%',
            'description': f'현재 RAM 사용률이 {ram.percent}%입니다.',
            'action': '메모리 누수 확인이 필요합니다.'
        })
    
    # 디스크 체크
    disk = psutil.disk_usage('/')
    if disk.percent > 90:
        telegram_notifier.send_critical_alert({
            'severity': 'critical',
            'title': f'⚠️ 디스크 공간 부족: {disk.percent}%',
            'description': f'현재 디스크 사용률이 {disk.percent}%입니다.',
            'action': '로그 파일 정리 또는 디스크 확장이 필요합니다.'
        })

if __name__ == '__main__':
    check_system_health()
```

**4) 일일 요약 리포트 발송 (`scripts/daily_summary.py`)**:
```python
from datetime import datetime
from utils.telegram_notifier import telegram_notifier
from database import db

def send_daily_summary():
    """매일 오전 9시에 일일 요약 리포트 텔레그램 발송"""
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # 데이터 집계
    active_academies = db.execute(
        "SELECT COUNT(*) FROM academies WHERE last_login >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    ).fetchone()[0]
    
    new_reports = db.execute(
        f"SELECT COUNT(*) FROM progress_records WHERE DATE(created_at) = '{today}'"
    ).fetchone()[0]
    
    # 이슈 체크
    issues = []
    
    # CPU 체크
    cpu_avg = db.execute(
        "SELECT AVG(cpu_usage) FROM system_health_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    ).fetchone()[0]
    
    if cpu_avg and cpu_avg > 80:
        issues.append(f"평균 CPU 사용률 높음: {cpu_avg:.1f}%")
    
    # Backend 재시작 체크
    restart_count = db.execute(
        "SELECT backend_restart_count FROM system_metrics WHERE DATE(created_at) = CURDATE()"
    ).fetchone()
    
    if restart_count and restart_count[0] > 50:
        issues.append(f"Backend 재시작 빈번: {restart_count[0]}회")
    
    # 텔레그램 발송
    telegram_notifier.send_daily_summary({
        'date': today,
        'active_academies': active_academies,
        'new_reports': new_reports,
        'issues': issues
    })

if __name__ == '__main__':
    send_daily_summary()
```

**5) Crontab 설정**:
```bash
# /etc/crontab 또는 crontab -e

# 5분마다 시스템 헬스체크 + Critical Alert 체크
*/5 * * * * /usr/bin/python3 /home/tutornote/scripts/health_check.py >> /var/log/tutornote/health_check.log 2>&1

# 매일 오전 9시 일일 요약 리포트 텔레그램 발송
0 9 * * * /usr/bin/python3 /home/tutornote/scripts/daily_summary.py >> /var/log/tutornote/daily_summary.log 2>&1
```

#### 8.5.2 텔레그램 알림 메시지 포맷

**Critical Alert 예시**:
```
🚨 TutorNote Master Admin Alert

**CPU 사용률 위험: 92.4%**

현재 CPU 사용률이 92.4%로 매우 높습니다. 시스템 성능 저하 및 서비스 장애가 발생할 수 있습니다.

📌 **권장 조치**: Backend 재시작 또는 프로세스 확인이 필요합니다.

⏰ 2026-01-04 14:30:15
```

**일일 요약 리포트 예시**:
```
📊 일일 요약 리포트 (2026-01-04)

✅ 활성 학원: 5개
📝 신규 리포트: 12건

⚠️ **주의 사항**:
  • 평균 CPU 사용률 높음: 85.2%
  • Backend 재시작 빈번: 68회

⏰ 2026-01-04 09:00:00
```

#### 8.5.3 환경 변수 설정

**`.env` 파일에 추가**:
```bash
# 텔레그램 봇 (Phase 3)
TELEGRAM_BOT_TOKEN=8473558613:AAHcx6y8m0_axwdx_Wu5NsMr5HlMPZ-V6cQ
TELEGRAM_CHAT_ID=8394117129
```

**텔레그램 봇 토큰 및 Chat ID 확인 방법**:
1. 봇 토큰: BotFather에서 확인 (`/token` 명령어)
2. Chat ID: 
   - 개인 채팅: `https://api.telegram.org/bot{BOT_TOKEN}/getUpdates` 접속 후 `message.chat.id` 확인
   - 그룹 채팅: 그룹에 봇 초대 후 위 URL에서 `chat.id` 확인 (음수로 표시됨)

---

## 10. 테스트 계획

### 10.1 단위 테스트 (Unit Tests)

#### 9.1.1 Backend

**테스트 대상**:
- Alert Rule 로직
- 데이터 집계 함수
- API 엔드포인트

**예시**:
```python
# tests/test_alert_checker.py
import pytest
from utils.alert_checker import check_cpu_alert

def test_cpu_alert_critical():
    alert = check_cpu_alert(92.4)
    assert alert['severity'] == 'critical'
    assert '92.4%' in alert['title']

def test_cpu_alert_warning():
    alert = check_cpu_alert(85.0)
    assert alert['severity'] == 'warning'

def test_cpu_alert_normal():
    alert = check_cpu_alert(60.0)
    assert alert is None

# tests/test_dashboard_api.py
def test_dashboard_overview_api(client):
    response = client.get('/api/admin/dashboard/overview')
    assert response.status_code == 200
    data = response.json
    assert 'critical_alerts' in data
    assert 'metrics' in data
```

**실행**:
```bash
cd backend
pytest tests/ -v --cov=.
```

#### 9.1.2 Frontend

**테스트 대상**:
- 컴포넌트 렌더링
- 데이터 변환 로직
- 이벤트 핸들러

**예시**:
```typescript
// __tests__/MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import MetricCard from '@/components/dashboard/MetricCard';

describe('MetricCard', () => {
  it('renders title and value correctly', () => {
    render(
      <MetricCard 
        title="학원 현황" 
        value="13개" 
        trend={{ change: 2, direction: 'up' }}
      />
    );
    
    expect(screen.getByText('학원 현황')).toBeInTheDocument();
    expect(screen.getByText('13개')).toBeInTheDocument();
  });
  
  it('displays trend indicator', () => {
    render(
      <MetricCard 
        title="학원 현황" 
        value="13개" 
        trend={{ change: 2, direction: 'up' }}
      />
    );
    
    expect(screen.getByText('▲')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
```

**실행**:
```bash
cd master-admin
npm test
```

---

### 10.2 통합 테스트 (Integration Tests)

**테스트 시나리오**:

1. **데이터 수집 → 집계 → 표시 전체 플로우**
   - TutorNote 앱에서 리포트 생성
   - 활동 로그 저장 확인
   - API 사용량 로그 저장 확인
   - Master Admin 대시보드에서 반영 확인 (1분 이내)

2. **Critical Alert 발생 → 알림**
   - CPU 사용률을 90% 이상으로 시뮬레이션
   - Alert가 대시보드 최상단에 표시되는지 확인
   - (Phase 3) 텔레그램 알림 수신 확인

3. **이탈 위험 학원 → 메일 발송**
   - 14일 무활동 학원 데이터 생성
   - "이탈 위험 학원" 테이블에 표시 확인
   - "일괄 메일 보내기" 버튼 클릭 → 메일 발송 확인

4. **학부모 열람 추적**
   - 학부모가 공유 링크로 리포트 열람
   - report_views 테이블에 기록 확인
   - 대시보드 "학부모 도달" 카드에 반영 확인

---

### 10.3 성능 테스트

**목표**:
- API 응답 시간 < 1초
- 대시보드 로딩 시간 < 2초
- 동시 접속 10명 처리

**도구**: Apache JMeter 또는 Locust

**테스트 시나리오**:
```python
# locustfile.py
from locust import HttpUser, task, between

class DashboardUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def load_dashboard(self):
        self.client.get("/api/admin/dashboard/overview")
    
    @task(1)
    def load_churn_risk(self):
        self.client.get("/api/admin/dashboard/churn-risk-academies")
    
    @task(1)
    def load_alerts(self):
        self.client.get("/api/admin/dashboard/alerts")
```

**실행**:
```bash
locust -f locustfile.py --host=https://tma.tutornote.kr --users 10 --spawn-rate 2
```

---

### 9.4 사용자 수용 테스트 (UAT)

**테스트 계획**:

| 시나리오 | 예상 결과 | 성공 기준 |
|---------|----------|----------|
| 대시보드 첫 진입 | 1초 이내에 모든 지표 로딩 | 응답 시간 < 1초 |
| Critical Alert 확인 | 빨간색으로 강조 표시 | 시각적으로 명확 |
| 이탈 위험 학원 클릭 | 학원 상세 페이지로 이동 | 정확한 학원 정보 표시 |
| 빠른 액션 버튼 클릭 | 즉시 실행 또는 확인 모달 | 3초 이내에 완료 |
| 모바일 접속 | 터치 친화적 UI | 모든 기능 사용 가능 |
| 데이터 정합성 | 실제 값과 일치 | 100% 정확 |

**UAT 체크리스트**:
- [ ] 모든 지표가 정확한 데이터를 표시하는가?
- [ ] Critical Alert가 즉시 눈에 띄는가?
- [ ] 이탈 위험 학원을 쉽게 찾을 수 있는가?
- [ ] 빠른 액션 버튼이 실제로 작동하는가?
- [ ] 모바일에서도 사용하기 편한가?
- [ ] 전체적인 UX가 직관적인가?
- [ ] 로딩 시간이 만족스러운가?
- [ ] Claude API 사용량이 정확하게 집계되는가?
- [ ] 학부모 열람률이 실시간으로 업데이트되는가?

---

## 11. 성공 지표

### 10.1 정량적 지표

| 지표 | 현재 (Before) | 목표 (After) | 측정 방법 |
|------|---------------|--------------|-----------|
| 대시보드 확인 소요 시간 | ~5분 | ~1분 | 사용자 테스트 |
| Critical Issue 인지 시간 | ~30초 | ~3초 | 시뮬레이션 |
| 데이터 정합성 | 70% | 100% | 검증 스크립트 |
| API 응답 시간 | - | < 1초 | 성능 테스트 |
| 대시보드 로딩 시간 | - | < 2초 | Lighthouse |
| 모바일 사용성 점수 | - | 90/100 | Google PageSpeed |
| 페이지 이동 횟수 | 3회 | 0회 | 사용자 테스트 |

### 10.2 정성적 지표

| 지표 | 측정 방법 | 목표 |
|------|----------|------|
| 운영자 만족도 | 5점 척도 설문 | 4.5/5 이상 |
| 기능 완성도 | 체크리스트 | 95% 이상 |
| 코드 품질 | Code Review | 승인 없는 배포 금지 |
| 문서 완성도 | README, API 문서 | 100% 작성 |
| UI/UX 직관성 | 사용자 피드백 | "직관적이다" 90% |

### 10.3 비즈니스 영향 지표

| 지표 | 현재 | 목표 | 기대 효과 |
|------|------|------|-----------|
| 의사결정 속도 | - | 50% 향상 | 데이터 기반 빠른 판단 |
| 문제 대응 시간 | - | 70% 단축 | Critical Alert 즉시 인지 |
| 이탈 학원 재활성화 | - | 20% 증가 | 선제적 케어 가능 |
| 유료 전환율 예측 | - | 예측 가능 | 수익화 준비도 파악 |

---

## 11. 리스크 관리

### 11.1 기술적 리스크

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|------------|--------|----------|
| DB 성능 저하 | 중간 | 높음 | 인덱스 최적화, 쿼리 튜닝, 집계 배치 작업 |
| API 응답 지연 | 낮음 | 중간 | 비동기 처리, 타임아웃 설정 |
| 데이터 정합성 오류 | 중간 | 높음 | 철저한 테스트, 롤백 계획, 검증 스크립트 |
| 프론트엔드 성능 | 낮음 | 중간 | React 최적화, 코드 스플리팅 |

### 11.2 일정 리스크

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|------------|--------|----------|
| 예상보다 긴 개발 시간 | 중간 | 중간 | MVP 우선, Phase 나눠서 배포 |
| 기능 변경 요청 | 높음 | 낮음 | Change Request 프로세스 |
| 리소스 부족 | 낮음 | 높음 | 우선순위 조정, 외주 검토 |

### 11.3 운영 리스크

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|------------|--------|----------|
| 대시보드 장애 | 낮음 | 중간 | 모니터링 알림, 빠른 롤백 |
| 데이터 손실 | 매우 낮음 | 매우 높음 | 일일 백업, 트랜잭션 관리 |
| 보안 취약점 | 낮음 | 높음 | 정기 보안 점검, 권한 관리 |

---

## 12. 배포 계획

### 12.1 배포 전 체크리스트

- [ ] 모든 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] UAT 완료 및 승인
- [ ] 성능 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] DB 마이그레이션 스크립트 준비 및 테스트
- [ ] 롤백 계획 수립
- [ ] 문서 작성 완료 (README, API 문서)
- [ ] 백업 완료 (DB, 코드)
- [ ] Cron 작업 설정 확인

### 12.2 배포 순서

1. **DB 마이그레이션 (배포 전날)**
   - Staging 환경에서 마이그레이션 테스트
   - 마이그레이션 소요 시간 측정
   - 롤백 스크립트 준비

2. **Staging 환경 배포 (배포 당일 오전)**
   - DB 백업
   - DB 마이그레이션 실행
   - 백엔드 배포 (PM2 재시작)
   - 프론트엔드 빌드 & 배포
   - Cron 작업 설정
   - 연기 테스트 (2시간)

3. **Production 배포 (배포 당일 오후)**
   - 사용자 공지 (30분 전)
   - DB 백업
   - DB 마이그레이션 실행 (약 5분)
   - 백엔드 배포 (PM2 재시작)
   - 프론트엔드 빌드 & 배포
   - Cron 작업 설정
   - 모니터링 (30분)

4. **모니터링 기간 (배포 후 1주일)**
   - 에러 로그 확인 (매일)
   - 성능 모니터링 (매일)
   - 사용자 피드백 수집
   - 버그 수정 (긴급)

### 12.3 롤백 계획

**롤백 조건**:
- Critical 에러 발생
- 성능 저하 50% 이상
- 데이터 정합성 오류
- 사용자 불만 다수 발생

**롤백 절차** (30분 이내):
1. 프론트엔드 이전 버전 배포 (5분)
2. 백엔드 이전 버전 PM2 재시작 (2분)
3. DB 마이그레이션 롤백 (10분)
4. Cron 작업 복원 (3분)
5. 검증 테스트 (10분)
6. 원인 분석 및 수정

---

## 13. 향후 로드맵

### Phase 4: 머신러닝 예측 (Q2 2026)
- 이탈 가능성 예측 모델 (ML 기반)
- 유료 전환 확률 예측
- 최적 알림 발송 시간 추천
- A/B 테스트 자동 분석

### Phase 5: 고급 분석 (Q3 2026)
- 코호트 분석 (가입 시기별 리텐션)
- RFM 분석 (Recency, Frequency, Monetary)
- 예측 분석 대시보드
- 커스텀 리포트 빌더

### Phase 6: 자동화 (Q4 2026)
- AI 기반 자동 리포트 생성
- 이탈 학원 자동 케어 플로우
- 스마트 알림 시스템
- 자동 비용 최적화 제안

---

## 14. 참고 자료

### 14.1 내부 문서
- `/mnt/project/ROADMAP.md` - TutorNote 전체 로드맵
- `/mnt/project/프롬프트_어조_개선.md` - AI 피드백 프롬프트
- `/mnt/project/TutorNote_2026_전략_보고서.pdf` - 비즈니스 전략

### 14.2 기술 문서
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Recharts Documentation](https://recharts.org/)
- [SWR Documentation](https://swr.vercel.app/)

### 14.3 디자인 참고
- [Vercel Analytics](https://vercel.com/analytics)
- [Linear Dashboard](https://linear.app/)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Amplitude Analytics](https://amplitude.com/)

---

## 부록

### A. 용어 정의

| 용어 | 정의 |
|------|------|
| **DAU** | Daily Active Users - 일일 활성 사용자 (학원) 수 |
| **MAU** | Monthly Active Users - 월간 활성 사용자 (학원) 수 |
| **고착도 (Stickiness)** | DAU/MAU 비율 - 사용자가 얼마나 자주 사용하는지 |
| **이탈 위험** | 7일 이상 무활동 학원 |
| **헤비유저** | 월 20건 이상 리포트 생성하는 학원 |
| **온보딩 퍼널** | 가입 → 학생 등록 → 리포트 생성 → 카톡 공유 전환 과정 |
| **MRR** | Monthly Recurring Revenue - 월간 반복 매출 |
| **Critical Alert** | 즉시 대응이 필요한 긴급 알림 |
| **Soft Delete** | 실제 삭제가 아닌 is_deleted 플래그 변경 |

### B. 환경 변수

**`.env` 파일 예시**:
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=tutornote
DB_PASSWORD=your_password
DB_NAME=tutornote_db

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Redis (Phase 3, 선택적)
REDIS_HOST=localhost
REDIS_PORT=6379

# 텔레그램 봇 (Phase 3)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Master Admin
MASTER_ADMIN_URL=https://tma.tutornote.kr
MASTER_ADMIN_PORT=3004

# TutorNote App
TUTORNOTE_APP_URL=https://app.tutornote.kr
```

### C. 마이그레이션 스크립트 예시

**`database/migrations/001_create_activity_logs.sql`**:
```sql
-- Activity Logs 테이블 생성
CREATE TABLE IF NOT EXISTS activity_logs (
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

-- 롤백 스크립트
-- DROP TABLE IF EXISTS activity_logs;
```

### D. Crontab 설정 전체

```bash
# /etc/crontab 또는 crontab -e

# 5분마다 시스템 헬스체크
*/5 * * * * /usr/bin/python3 /home/tutornote/scripts/health_check.py >> /var/log/tutornote/health_check.log 2>&1

# 매일 새벽 2시 일일 집계
0 2 * * * /usr/bin/python3 /home/tutornote/scripts/daily_aggregation.py >> /var/log/tutornote/daily_aggregation.log 2>&1

# 매월 1일 새벽 3시 월간 집계
0 3 1 * * /usr/bin/python3 /home/tutornote/scripts/monthly_aggregation.py >> /var/log/tutornote/monthly_aggregation.log 2>&1

# 매일 새벽 4시 DB 백업
0 4 * * * /usr/local/bin/backup_db.sh >> /var/log/tutornote/backup.log 2>&1
```

---

**문서 종료**

이 기획서는 TutorNote Master Admin 대시보드 개선을 위한 모든 정보를 담고 있습니다. 구현 과정에서 질문이나 변경 사항이 있을 경우 PM에게 문의해주세요.

**문서 버전 히스토리**:
- v1.0 (2026-01-04): 초안 작성 - 구현 순서 및 데이터 수집 방법 포함
- v1.1 (2026-01-05): Pre-work 섹션 추가 - Alert 중복 방지, Config, 배포 전략, 데이터 백필 계획, Staging 가이드