#!/bin/bash
# ============================================================
# TutorNote Master Admin - Phase 1 마이그레이션 실행 스크립트
#
# 사용법:
#   chmod +x run_migrations.sh
#   ./run_migrations.sh
# ============================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MIGRATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${MIGRATION_DIR}/../backups"
DB_NAME="${DB_NAME:-tutornote}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔵 TutorNote Master Admin - Phase 1 마이그레이션          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

# MySQL 접속 정보
read -sp "MySQL 루트 비밀번호 (없으면 Enter): " MYSQL_ROOT_PASSWORD
echo ""

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    MYSQL_CMD="mysql -u root"
    MYSQLDUMP_CMD="mysqldump -u root"
else
    MYSQL_CMD="mysql -u root -p${MYSQL_ROOT_PASSWORD}"
    MYSQLDUMP_CMD="mysqldump -u root -p${MYSQL_ROOT_PASSWORD}"
fi

# 1. DB 백업
echo -e "${YELLOW}[1/3] DB 백업 중...${NC}"
BACKUP_FILE="${BACKUP_DIR}/backup_before_phase1_$(date +%Y%m%d_%H%M%S).sql"
${MYSQLDUMP_CMD} ${DB_NAME} > "${BACKUP_FILE}" 2>/dev/null || {
    echo -e "${RED}❌ DB 백업 실패${NC}"
    exit 1
}
echo -e "${GREEN}✓ DB 백업 완료: ${BACKUP_FILE}${NC}"

# 2. 트래킹 테이블 생성
echo ""
echo -e "${YELLOW}[2/3] 트래킹 테이블 생성 중...${NC}"
${MYSQL_CMD} ${DB_NAME} < "${MIGRATION_DIR}/001_create_tracking_tables.sql" 2>/dev/null || {
    echo -e "${RED}❌ 트래킹 테이블 생성 실패${NC}"
    exit 1
}
echo -e "${GREEN}✓ 트래킹 테이블 6개 생성 완료${NC}"

# 3. progress_records 테이블 수정
echo ""
echo -e "${YELLOW}[3/3] progress_records 테이블 수정 중...${NC}"
${MYSQL_CMD} ${DB_NAME} < "${MIGRATION_DIR}/002_alter_progress_records.sql" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  progress_records 테이블 수정 스킵 (이미 존재하거나 테이블 없음)${NC}"
}
echo -e "${GREEN}✓ progress_records 컬럼 추가 완료${NC}"

# 결과 확인
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Phase 1 마이그레이션 완료!                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 생성된 테이블:${NC}"
${MYSQL_CMD} ${DB_NAME} -e "SHOW TABLES LIKE '%logs%';" 2>/dev/null
${MYSQL_CMD} ${DB_NAME} -e "SHOW TABLES LIKE 'report_views';" 2>/dev/null
${MYSQL_CMD} ${DB_NAME} -e "SHOW TABLES LIKE 'operational_costs';" 2>/dev/null
${MYSQL_CMD} ${DB_NAME} -e "SHOW TABLES LIKE 'api_health_checks';" 2>/dev/null
echo ""
echo -e "${BLUE}📦 백업 파일:${NC}"
echo "   ${BACKUP_FILE}"
echo ""
