#!/usr/bin/env bash
# ============================================================
# 初球用户端 H5 - 回滚脚本（测试 / 生产通用）
# 使用方法:
#   ./scripts/rollback-h5.sh test h5-user-20260820173100
#   ./scripts/rollback-h5.sh prod h5-user-20260820174100
# ============================================================
set -euo pipefail

ENV="${1:-}"
TARGET_RELEASE="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

if [ -z "$ENV" ] || [ -z "$TARGET_RELEASE" ]; then
  echo "用法: $0 <test|prod> <release名称>"
  echo "示例: $0 test h5-user-20260820173100"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
H5_SSH_KEY="${PROJECT_ROOT}/ubutun-prod(1).pem"
H5_SERVER="root@114.67.69.228"

case "$ENV" in
  test)
    RELEASE_BASE="/opt/app_test/frontend/releases"
    LINK_PATH="/opt/app_test/frontend/h5"
    ACCESS_URL="https://www.qiulem.com/test/h5/"
    ;;
  prod)
    RELEASE_BASE="/opt/app/frontend/releases"
    LINK_PATH="/opt/app/frontend/h5"
    ACCESS_URL="https://www.qiulem.com/h5/"
    ;;
  *)
    error "环境参数只能是 test 或 prod"
    ;;
esac

TARGET_DIR="${RELEASE_BASE}/${TARGET_RELEASE}"

[ -f "$H5_SSH_KEY" ] || error "SSH 密钥不存在: $H5_SSH_KEY"
chmod 600 "$H5_SSH_KEY"

# 记录当前版本
CURRENT_RELEASE=$(ssh -i "$H5_SSH_KEY" -o StrictHostKeyChecking=no "$H5_SERVER" \
  "readlink -f $LINK_PATH 2>/dev/null || echo '(无)'" )

info "当前版本: $CURRENT_RELEASE"
info "目标版本: $TARGET_DIR"

if [ "$ENV" = "prod" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  即将回滚【生产环境】${NC}"
  read -r -p "  请输入 YES 确认回滚: " confirm
  if [ "$confirm" != "YES" ]; then
    warn "已取消"
    exit 0
  fi
fi

# 验证目标版本存在
ssh -i "$H5_SSH_KEY" -o StrictHostKeyChecking=no "$H5_SERVER" \
  "test -f ${TARGET_DIR}/index.html && test -d ${TARGET_DIR}/assets" \
  || error "目标版本不存在或不完整: $TARGET_DIR"

# 切换软链接
info "切换软链接..."
ssh -i "$H5_SSH_KEY" -o StrictHostKeyChecking=no "$H5_SERVER" \
  "ln -sfn ${TARGET_DIR} ${LINK_PATH} && \
   echo '软链接已切换，当前指向：' && \
   readlink -f ${LINK_PATH}"

# 验证
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ACCESS_URL")
info "首页状态: HTTP $HTTP_CODE"

echo ""
echo -e "${GREEN}✅ 回滚完成${NC}"
echo "  访问地址: $ACCESS_URL"
echo ""