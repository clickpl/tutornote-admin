-- ============================================================
-- TutorNote Master Admin - Phase 1 마이그레이션
-- 001_create_tracking_tables.sql
--
-- 생성 테이블: 6개
-- 1. activity_logs - 사용자 활동 로그
-- 2. report_views - 학부모 리포트 열람 추적
-- 3. api_usage_logs - API 사용량 추적
-- 4. operational_costs - 운영 비용 추적
-- 5. system_health_logs - 시스템 헬스체크
-- 6. api_health_checks - API 헬스체크
--
-- 실행: mysql -u root -p tutornote < 001_create_tracking_tables.sql
-- ============================================================

-- 1. activity_logs (사용자 활동 로그)
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
  INDEX idx_academy_created (academy_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. report_views (학부모 리포트 열람 추적)
CREATE TABLE IF NOT EXISTS report_views (
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
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. api_usage_logs (API 사용량 추적)
CREATE TABLE IF NOT EXISTS api_usage_logs (
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
  INDEX idx_api_created (api_name, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. operational_costs (운영 비용 추적)
CREATE TABLE IF NOT EXISTS operational_costs (
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

-- 5. system_health_logs (시스템 헬스체크)
CREATE TABLE IF NOT EXISTS system_health_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cpu_usage DECIMAL(5, 2),
  ram_usage DECIMAL(5, 2),
  disk_usage DECIMAL(5, 2),
  active_connections INT,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. api_health_checks (API 헬스체크)
CREATE TABLE IF NOT EXISTS api_health_checks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  api_name ENUM('claude', 'kakao', 'gemini') NOT NULL,
  status ENUM('success', 'error', 'timeout') NOT NULL,
  response_time_ms INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_name (api_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 완료 메시지
SELECT '✅ 6개 트래킹 테이블 생성 완료!' AS message;
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('activity_logs', 'report_views', 'api_usage_logs', 'operational_costs', 'system_health_logs', 'api_health_checks');
