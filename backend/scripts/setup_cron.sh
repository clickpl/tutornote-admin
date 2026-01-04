#!/bin/bash
# ============================================================
# TutorNote Master Admin - Crontab 설정 스크립트
#
# 사용법:
#   chmod +x scripts/setup_cron.sh
#   ./scripts/setup_cron.sh
# ============================================================

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "${SCRIPT_DIR}")"
LOG_DIR="${BACKEND_DIR}/logs"

echo -e "${BLUE}⏰ TutorNote Crontab 설정${NC}"
echo ""

# 로그 디렉토리 생성
mkdir -p "${LOG_DIR}"
echo -e "${GREEN}✓ 로그 디렉토리 생성: ${LOG_DIR}${NC}"

# Python3 경로 확인
PYTHON3_PATH=$(which python3)
if [ -z "$PYTHON3_PATH" ]; then
    echo -e "${YELLOW}⚠️  python3가 설치되어 있지 않습니다.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python3 경로: ${PYTHON3_PATH}${NC}"

# psutil 설치 확인
${PYTHON3_PATH} -c "import psutil" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  psutil 설치 중...${NC}"
    pip3 install psutil --break-system-packages 2>/dev/null || pip3 install psutil
}

# Crontab 엔트리 생성
CRON_ENTRY="*/5 * * * * ${PYTHON3_PATH} ${SCRIPT_DIR}/health_check.py >> ${LOG_DIR}/health_check.log 2>&1"

# 기존 Crontab에 추가 (중복 방지)
(crontab -l 2>/dev/null | grep -v "health_check.py"; echo "${CRON_ENTRY}") | crontab -

echo ""
echo -e "${GREEN}✅ Crontab 설정 완료!${NC}"
echo ""
echo -e "${BLUE}📋 현재 Crontab:${NC}"
crontab -l | grep health_check || echo "(health_check 관련 항목 없음)"
echo ""
echo -e "${BLUE}📁 로그 파일:${NC}"
echo "   ${LOG_DIR}/health_check.log"
echo ""
echo -e "${BLUE}🔧 수동 실행 테스트:${NC}"
echo "   ${PYTHON3_PATH} ${SCRIPT_DIR}/health_check.py"
echo ""
