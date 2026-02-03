-- ============================================================
-- TutorNote Master Admin: Notification Management Tables
-- Date: 2026-01-23
-- Description: 카카오 알림톡 + 텔레그램 알림 트래킹 테이블
-- ============================================================

-- 1. 카카오 알림톡 발송 이력 테이블
CREATE TABLE IF NOT EXISTS kakao_notification_log (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- 기본 정보
  academy_id INT NOT NULL COMMENT '학원 ID',
  template_code VARCHAR(50) NOT NULL COMMENT '템플릿 코드',
  template_name VARCHAR(100) COMMENT '템플릿명',

  -- 수신자 정보
  phone VARCHAR(20) NOT NULL COMMENT '수신자 전화번호',
  receiver_name VARCHAR(50) COMMENT '수신자 이름',

  -- 메시지 정보
  message_type VARCHAR(50) COMMENT '메시지 유형 (lesson_report, attendance, monthly_report)',
  message_content TEXT COMMENT '발송 메시지 내용',

  -- 발송 결과
  status ENUM('success', 'failed') NOT NULL COMMENT '발송 상태',
  error_code VARCHAR(20) COMMENT 'Solapi 에러 코드',
  error_message TEXT COMMENT '에러 메시지',

  -- 비용 정보
  cost DECIMAL(10,2) DEFAULT 13.00 COMMENT '발송 비용 (원)',

  -- Solapi 응답 정보
  message_id VARCHAR(100) COMMENT 'Solapi 메시지 ID',
  solapi_response JSON COMMENT 'Solapi 전체 응답',

  -- 시간 정보
  sent_at DATETIME NOT NULL COMMENT '발송 시간',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_academy_sent (academy_id, sent_at),
  INDEX idx_status_sent (status, sent_at),
  INDEX idx_sent_date ((DATE(sent_at))),
  INDEX idx_template (template_code),
  INDEX idx_message_type (message_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='카카오 알림톡 발송 이력';


-- 2. 카카오 템플릿 정보 테이블
CREATE TABLE IF NOT EXISTS kakao_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- 템플릿 정보
  template_code VARCHAR(50) UNIQUE NOT NULL COMMENT '템플릿 코드',
  template_name VARCHAR(100) NOT NULL COMMENT '템플릿명',
  category VARCHAR(50) COMMENT '카테고리',
  description TEXT COMMENT '설명',

  -- 승인 정보
  status ENUM('approved', 'pending', 'rejected') DEFAULT 'pending' COMMENT '승인 상태',
  approved_at DATETIME COMMENT '승인 일시',

  -- 사용 정보
  last_used_at DATETIME COMMENT '최근 사용 일시',
  use_count INT DEFAULT 0 COMMENT '사용 횟수',

  -- 템플릿 내용
  template_content TEXT COMMENT '템플릿 내용',
  variables JSON COMMENT '변수 목록',

  -- 시간 정보
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_status (status),
  INDEX idx_last_used (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='카카오 알림톡 템플릿 정보';


-- 3. 텔레그램 알림 이력 테이블
CREATE TABLE IF NOT EXISTS telegram_notification_log (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- 알림 유형
  notification_type ENUM(
    'server_check',      -- 서버 점검 (5분마다)
    'daily_report',      -- 일일 점검 리포트 (오전 9시)
    'service_report',    -- 서비스 리포트 (오전 9시)
    'error'              -- 에러 알림 (즉시)
  ) NOT NULL COMMENT '알림 유형',

  -- 심각도 (에러 알림의 경우)
  severity ENUM('low', 'medium', 'high', 'critical') COMMENT '심각도',

  -- 메시지 정보
  title VARCHAR(200) COMMENT '알림 제목',
  message TEXT NOT NULL COMMENT '알림 내용',

  -- 컨텍스트 (에러 알림의 경우)
  academy_id INT NULL COMMENT '관련 학원 ID',
  academy_name VARCHAR(100) COMMENT '학원명',
  error_code VARCHAR(20) COMMENT '에러 코드 (KAKAO_001 등)',
  error_type VARCHAR(100) COMMENT '에러 유형',

  -- 추가 정보
  metadata JSON COMMENT '추가 정보 (CPU, 메모리, 스택 트레이스 등)',

  -- 발송 결과
  status ENUM('sent', 'failed') DEFAULT 'sent' COMMENT '발송 상태',
  telegram_message_id VARCHAR(100) COMMENT '텔레그램 메시지 ID',
  error_message TEXT COMMENT '발송 실패 시 에러 메시지',

  -- 시간 정보
  sent_at DATETIME NOT NULL COMMENT '발송 시간',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_type_sent (notification_type, sent_at),
  INDEX idx_severity_sent (severity, sent_at),
  INDEX idx_sent_date ((DATE(sent_at))),
  INDEX idx_error_code (error_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='텔레그램 알림 발송 이력';


-- 4. 텔레그램 알림 설정 테이블
CREATE TABLE IF NOT EXISTS telegram_notification_config (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- 알림 유형
  notification_type ENUM(
    'server_check',
    'daily_report',
    'service_report',
    'error'
  ) UNIQUE NOT NULL COMMENT '알림 유형',

  -- 활성화 여부
  is_enabled BOOLEAN DEFAULT TRUE COMMENT '알림 활성화 여부',

  -- 스케줄 설정
  schedule_time TIME NULL COMMENT '발송 시간 (daily_report, service_report)',
  check_interval INT NULL COMMENT '체크 간격 (분, server_check)',

  -- 추가 설정
  config JSON COMMENT '추가 설정 (임계값 등)',

  -- 시간 정보
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) COMMENT '수정자',

  -- 인덱스
  INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='텔레그램 알림 설정';


-- ============================================================
-- 초기 데이터 삽입
-- ============================================================

-- 텔레그램 알림 설정 초기값
INSERT INTO telegram_notification_config (notification_type, is_enabled, schedule_time, check_interval, config) VALUES
('server_check', TRUE, NULL, 5, '{"cpu_threshold": 80, "memory_threshold": 85, "disk_threshold": 90}'),
('daily_report', TRUE, '09:00:00', NULL, '{}'),
('service_report', TRUE, '09:00:00', NULL, '{}'),
('error', TRUE, NULL, NULL, '{"min_severity": "medium"}')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 카카오 템플릿 초기 데이터 (승인 완료된 템플릿)
INSERT INTO kakao_templates (template_code, template_name, category, status, template_content, approved_at) VALUES
('LESSON_REPORT', '레슨 리포트 발송', 'report', 'approved', '안녕하세요 #{academy_name}입니다.\n\n#{student_name} 학생의 레슨 리포트가 도착했습니다.', NOW()),
('ATTENDANCE_ALERT', '출석 알림', 'attendance', 'approved', '#{student_name} 학생이 #{academy_name}에 출석했습니다.', NOW()),
('MONTHLY_REPORT', '월간 리포트', 'report', 'approved', '#{month}월 학습 리포트가 발송되었습니다.', NOW())
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;


-- ============================================================
-- 롤백 스크립트 (필요시 사용)
-- ============================================================
-- DROP TABLE IF EXISTS telegram_notification_config;
-- DROP TABLE IF EXISTS telegram_notification_log;
-- DROP TABLE IF EXISTS kakao_templates;
-- DROP TABLE IF EXISTS kakao_notification_log;
