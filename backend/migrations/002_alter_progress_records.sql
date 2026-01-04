-- ============================================================
-- TutorNote Master Admin - Phase 1 마이그레이션
-- 002_alter_progress_records.sql
--
-- 수정 테이블: progress_records
-- 추가 컬럼: 4개
-- 1. ai_generated - AI로 생성되었는지 여부
-- 2. generation_time_seconds - 리포트 생성 소요 시간
-- 3. edit_count - 수정 횟수 (AI 품질 지표)
-- 4. card_news_generated - 카드뉴스 생성 여부
--
-- 실행: mysql -u root -p tutornote < 002_alter_progress_records.sql
-- ============================================================

-- 컬럼이 없는 경우에만 추가 (에러 방지)
-- MySQL 8.0+ 에서는 IF NOT EXISTS 사용 불가, 프로시저로 처리

DELIMITER //

CREATE PROCEDURE add_column_if_not_exists()
BEGIN
    -- ai_generated 컬럼 추가
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'progress_records'
        AND COLUMN_NAME = 'ai_generated'
    ) THEN
        ALTER TABLE progress_records
        ADD COLUMN ai_generated BOOLEAN DEFAULT 0 COMMENT 'AI로 생성되었는지 여부';
    END IF;

    -- generation_time_seconds 컬럼 추가
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'progress_records'
        AND COLUMN_NAME = 'generation_time_seconds'
    ) THEN
        ALTER TABLE progress_records
        ADD COLUMN generation_time_seconds INT COMMENT '리포트 생성 소요 시간';
    END IF;

    -- edit_count 컬럼 추가
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'progress_records'
        AND COLUMN_NAME = 'edit_count'
    ) THEN
        ALTER TABLE progress_records
        ADD COLUMN edit_count INT DEFAULT 0 COMMENT '수정 횟수 (AI 품질 지표)';
    END IF;

    -- card_news_generated 컬럼 추가
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'progress_records'
        AND COLUMN_NAME = 'card_news_generated'
    ) THEN
        ALTER TABLE progress_records
        ADD COLUMN card_news_generated BOOLEAN DEFAULT 0 COMMENT '카드뉴스 생성 여부';
    END IF;
END//

DELIMITER ;

-- 프로시저 실행
CALL add_column_if_not_exists();

-- 프로시저 삭제 (정리)
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- 결과 확인
SELECT '✅ progress_records 테이블 컬럼 추가 완료!' AS message;
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'progress_records'
AND COLUMN_NAME IN ('ai_generated', 'generation_time_seconds', 'edit_count', 'card_news_generated');
