#!/bin/bash
#
# TutorNote Master Admin - Staging 환경 셋업 스크립트
#
# 사용 방법:
#   chmod +x scripts/setup_staging.sh
#   ./scripts/setup_staging.sh
#
# 주의: MySQL 루트 비밀번호 입력이 필요합니다.
#

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGING_PORT=3005
STAGING_DB_NAME="tutornote_staging"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔵 TutorNote Master Admin - Staging 환경 셋업            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. 필수 환경 확인
echo -e "${YELLOW}[1/5] 필수 환경 확인 중...${NC}"

if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL이 설치되어 있지 않습니다.${NC}"
    echo "   brew install mysql (macOS) 또는 apt install mysql-server (Ubuntu)"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ MySQL 및 npm 확인 완료${NC}"

# 2. Staging DB 생성
echo ""
echo -e "${YELLOW}[2/5] Staging DB 생성 중...${NC}"
echo "   데이터베이스: ${STAGING_DB_NAME}"

# MySQL 비밀번호 입력 (선택적)
read -sp "MySQL 루트 비밀번호 (없으면 Enter): " MYSQL_ROOT_PASSWORD
echo ""

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    MYSQL_CMD="mysql -u root"
else
    MYSQL_CMD="mysql -u root -p${MYSQL_ROOT_PASSWORD}"
fi

# DB 생성 (이미 존재하면 스킵)
${MYSQL_CMD} -e "CREATE DATABASE IF NOT EXISTS ${STAGING_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
    echo -e "${RED}❌ Staging DB 생성 실패${NC}"
    echo "   MySQL 연결을 확인해주세요."
    exit 1
}

echo -e "${GREEN}✓ Staging DB '${STAGING_DB_NAME}' 생성 완료${NC}"

# 3. 프로덕션 DB 복사 (선택적)
echo ""
echo -e "${YELLOW}[3/5] 프로덕션 데이터 복사 (선택)${NC}"
read -p "프로덕션 DB를 Staging으로 복사하시겠습니까? (y/N): " COPY_PROD

if [[ "$COPY_PROD" =~ ^[Yy]$ ]]; then
    read -p "프로덕션 DB 이름 (기본: tutornote): " PROD_DB_NAME
    PROD_DB_NAME=${PROD_DB_NAME:-tutornote}

    echo "   ${PROD_DB_NAME} → ${STAGING_DB_NAME} 복사 중..."

    # 백업 및 복원
    ${MYSQL_CMD} ${PROD_DB_NAME} > /tmp/tutornote_backup_staging.sql 2>/dev/null || {
        echo -e "${YELLOW}⚠️  프로덕션 DB 백업 실패. 빈 DB로 진행합니다.${NC}"
    }

    if [ -f /tmp/tutornote_backup_staging.sql ]; then
        ${MYSQL_CMD} ${STAGING_DB_NAME} < /tmp/tutornote_backup_staging.sql 2>/dev/null || true
        rm -f /tmp/tutornote_backup_staging.sql
        echo -e "${GREEN}✓ 프로덕션 데이터 복사 완료${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  프로덕션 데이터 복사 건너뜀${NC}"
fi

# 4. .env.staging 파일 생성
echo ""
echo -e "${YELLOW}[4/5] .env.staging 파일 생성 중...${NC}"

ENV_STAGING_FILE="${PROJECT_ROOT}/.env.staging"

cat > "${ENV_STAGING_FILE}" << EOF
# TutorNote Master Admin - Staging 환경 설정
# 생성일: $(date '+%Y-%m-%d %H:%M:%S')

NODE_ENV=staging
PORT=${STAGING_PORT}

# 데이터베이스
DATABASE_URL=mysql://root:${MYSQL_ROOT_PASSWORD}@localhost:3306/${STAGING_DB_NAME}
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${MYSQL_ROOT_PASSWORD}
DB_NAME=${STAGING_DB_NAME}

# 텔레그램 (Staging용 테스트 채널로 변경 권장)
TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID=\${TELEGRAM_CHAT_ID}

# Master Admin URL
MASTER_ADMIN_URL=http://localhost:${STAGING_PORT}

# API 설정
CLAUDE_API_KEY=\${CLAUDE_API_KEY}
KAKAO_API_KEY=\${KAKAO_API_KEY}
EOF

echo -e "${GREEN}✓ .env.staging 파일 생성 완료${NC}"
echo "   경로: ${ENV_STAGING_FILE}"

# 5. 완료 메시지
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Staging 환경 셋업 완료!                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 생성된 리소스:${NC}"
echo "   • Staging DB: ${STAGING_DB_NAME}"
echo "   • 환경 설정: ${ENV_STAGING_FILE}"
echo ""
echo -e "${BLUE}🚀 Staging 서버 실행 방법:${NC}"
echo ""
echo "   # 1. 프론트엔드 빌드"
echo "   cd ${PROJECT_ROOT}/frontend"
echo "   npm run build"
echo ""
echo "   # 2. Staging 서버 실행 (PM2)"
echo "   PM2_HOME=~/.pm2 pm2 start npm --name \"tutornote-admin-staging\" -- start -- -p ${STAGING_PORT}"
echo ""
echo "   # 또는 직접 실행"
echo "   PORT=${STAGING_PORT} npm start"
echo ""
echo -e "${BLUE}🔗 접속 URL:${NC}"
echo "   http://localhost:${STAGING_PORT}"
echo ""
echo -e "${YELLOW}💡 Tip: Staging 텔레그램 채널을 별도로 만들어 TELEGRAM_CHAT_ID를 분리하세요.${NC}"
echo ""
