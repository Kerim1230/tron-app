#!/usr/bin/env bash
# ==============================================================================
# 🚀 TRON Σ — أداة سطر الأوامر
# المتصفح الذكي من الجيل القادم
# ==============================================================================

set -euo pipefail

# === الألوان ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# === المتغيرات ===
TRON_VERSION="1.0.0"
TRON_NAME="TRON Σ CLI"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/db/backups"
LOG_FILE="${PROJECT_DIR}/tron-cli.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# === الدوال المساعدة ===

# طباعة الشعار
print_banner() {
  echo -e "${CYAN}"
  echo "  ╔═══════════════════════════════════════╗"
  echo "  ║     ████████╗ █████╗ ██████╗ ███████╗ ║"
  echo "  ║     ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝ ║"
  echo "  ║        ██║   ███████║██████╔╝███████╗ ║"
  echo "  ║        ██║   ██╔══██║██╔══██╗╚════██║ ║"
  echo "  ║        ██║   ██║  ██║██║  ██║███████║ ║"
  echo "  ║        ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ║"
  echo "  ║              Σ Smart Browser           ║"
  echo "  ╚═══════════════════════════════════════╝"
  echo -e "${RESET}"
  echo -e "${GREEN}${BOLD}  ${TRON_NAME} v${TRON_VERSION}${RESET}"
  echo -e "${DIM}  المتصفح الذكي من الجيل القادم${RESET}"
  echo ""
}

# طباعة رسالة معلومات
info() {
  echo -e "${BLUE}ℹ${RESET} ${CYAN}$1${RESET}"
}

# طباعة رسالة نجاح
success() {
  echo -e "${GREEN}✓${RESET} ${GREEN}$1${RESET}"
}

# طباعة رسالة تحذير
warn() {
  echo -e "${YELLOW}⚠${RESET} ${YELLOW}$1${RESET}"
}

# طباعة رسالة خطأ
error() {
  echo -e "${RED}✗${RESET} ${RED}$1${RESET}"
}

# تسجيل في ملف السجل
log() {
  echo "[${TIMESTAMP}] $1" >> "${LOG_FILE}"
}

# التحقق من وجود الأمر
require_cmd() {
  if ! command -v "$1" &> /dev/null; then
    error "الأمر '$1' غير مثبت. يرجى تثبيته أولاً."
    exit 1
  fi
}

# التحقق من وجود المشروع
check_project() {
  if [[ ! -f "${PROJECT_DIR}/package.json" ]]; then
    error "لم يتم العثور على مشروع TRON Σ في ${PROJECT_DIR}"
    exit 1
  fi
}

# === الأوامر ===

# tron deploy — نشر المشروع على Vercel
cmd_deploy() {
  print_banner
  info "بدء عملية النشر..."

  check_project
  require_cmd vercel

  local env="${1:-production}"
  local force_flag=""

  # التحقق من العلم --force
  if [[ "${env}" == "--force" ]] || [[ "${2:-}" == "--force" ]]; then
    force_flag="--force"
    env="production"
  fi

  # فحص الكود قبل النشر
  info "فحص جودة الكود..."
  cd "${PROJECT_DIR}"
  
  if bun run lint 2>/dev/null; then
    success "فحص الكود ناجح"
  else
    warn "فحص الكود به تحذيرات — المتابعة على مسؤوليتك"
    read -rp "هل تريد المتابعة؟ (y/N): " confirm
    if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
      info "تم إلغاء النشر"
      exit 0
    fi
  fi

  # النشر
  info "النشر على Vercel (${env})..."
  
  if [[ "${env}" == "production" ]]; then
    vercel --prod ${force_flag}
  else
    vercel ${force_flag}
  fi

  if [[ $? -eq 0 ]]; then
    success "تم النشر بنجاح! 🚀"
    log "نشر ناجح: ${env}"
  else
    error "فشل النشر"
    log "فشل النشر: ${env}"
    exit 1
  fi
}

# tron backup — نسخ احتياطي لقاعدة البيانات
cmd_backup() {
  print_banner
  info "بدء النسخ الاحتياطي..."

  check_project

  # إنشاء مجلد النسخ الاحتياطي
  mkdir -p "${BACKUP_DIR}"

  local db_file="${PROJECT_DIR}/db/tron.db"
  
  if [[ ! -f "${db_file}" ]]; then
    error "لم يتم العثور على قاعدة البيانات: ${db_file}"
    exit 1
  fi

  # إنشاء اسم الملف مع التاريخ
  local backup_name="tron_$(date +%Y%m%d_%H%M%S).db"
  local backup_path="${BACKUP_DIR}/${backup_name}"

  # نسخ الملف
  cp "${db_file}" "${backup_path}"

  # ضغط النسخة الاحتياطية
  if command -v gzip &> /dev/null; then
    gzip "${backup_path}"
    backup_path="${backup_path}.gz"
    success "تم ضغط النسخة الاحتياطية"
  fi

  # حساب الحجم
  local size
  size=$(du -h "${backup_path}" | cut -f1)

  success "تم إنشاء النسخة الاحتياطية بنجاح"
  echo -e "  ${DIM}المسار:${RESET} ${backup_path}"
  echo -e "  ${DIM}الحجم:${RESET}  ${size}"

  # حذف النسخ القديمة (أكثر من 30 يومًا)
  local old_backups
  old_backups=$(find "${BACKUP_DIR}" -name "tron_*.db*" -mtime +30 2>/dev/null | wc -l)
  
  if [[ "${old_backups}" -gt 0 ]]; then
    info "حذف ${old_backups} نسخة احتياطية قديمة..."
    find "${BACKUP_DIR}" -name "tron_*.db*" -mtime +30 -delete
    success "تم حذف النسخ القديمة"
  fi

  # عرض قائمة النسخ الاحتياطية
  echo ""
  info "النسخ الاحتياطية المتاحة:"
  ls -lht "${BACKUP_DIR}"/tron_*.db* 2>/dev/null | head -5 | while read -r line; do
    echo -e "  ${DIM}${line}${RESET}"
  done

  log "نسخ احتياطي: ${backup_path} (${size})"
}

# tron status — فحص حالة الخدمات
cmd_status() {
  print_banner
  info "فحص حالة الخدمات..."
  echo ""

  # حالة المشروع
  echo -e "${BOLD}📦 المشروع${RESET}"
  echo -e "  المسار:      ${DIM}${PROJECT_DIR}${RESET}"
  
  if [[ -f "${PROJECT_DIR}/package.json" ]]; then
    local version
    version=$(cd "${PROJECT_DIR}" && node -p "require('./package.json').version" 2>/dev/null || echo "غير محدد")
    echo -e "  الإصدار:     ${GREEN}${version}${RESET}"
    echo -e "  الحالة:      ${GREEN}● موجود${RESET}"
  else
    echo -e "  الحالة:      ${RED}● غير موجود${RESET}"
  fi
  echo ""

  # حالة Node.js
  echo -e "${BOLD}⚡ وقت التشغيل${RESET}"
  if command -v node &> /dev/null; then
    echo -e "  Node.js:     ${GREEN}$(node --version)${RESET}"
  else
    echo -e "  Node.js:     ${RED}غير مثبت${RESET}"
  fi
  
  if command -v bun &> /dev/null; then
    echo -e "  Bun:         ${GREEN}$(bun --version)${RESET}"
  else
    echo -e "  Bun:         ${RED}غير مثبت${RESET}"
  fi
  echo ""

  # حالة الخدمات
  echo -e "${BOLD}🌐 الخدمات${RESET}"
  
  # خادم التطوير
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  خادم التطوير:  ${GREEN}● يعمل${RESET} (المنفذ 3000)"
  else
    echo -e "  خادم التطوير:  ${RED}○ متوقف${RESET}"
  fi

  # خدمة Socket.io
  if curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo -e "  خدمة Socket:   ${GREEN}● تعمل${RESET} (المنفذ 3003)"
  else
    echo -e "  خدمة Socket:   ${YELLOW}○ متوقفة${RESET}"
  fi

  # خدمة AI
  if curl -s http://localhost:3004 > /dev/null 2>&1; then
    echo -e "  خدمة AI:       ${GREEN}● تعمل${RESET} (المنفذ 3004)"
  else
    echo -e "  خدمة AI:       ${YELLOW}○ متوقفة${RESET}"
  fi
  echo ""

  # حالة قاعدة البيانات
  echo -e "${BOLD}🗄️ قاعدة البيانات${RESET}"
  local db_file="${PROJECT_DIR}/db/tron.db"
  if [[ -f "${db_file}" ]]; then
    local db_size
    db_size=$(du -h "${db_file}" | cut -f1)
    echo -e "  الحالة:       ${GREEN}● متصلة${RESET}"
    echo -e "  الحجم:        ${db_size}"
  else
    echo -e "  الحالة:       ${RED}○ غير موجودة${RESET}"
    echo -e "  ${DIM}شغّل 'bun run db:push' لإنشائها${RESET}"
  fi
  echo ""

  # حالة Git
  echo -e "${BOLD}📋 Git${RESET}"
  if command -v git &> /dev/null && [[ -d "${PROJECT_DIR}/.git" ]]; then
    cd "${PROJECT_DIR}"
    local branch
    branch=$(git branch --show-current 2>/dev/null || echo "غير محدد")
    local changes
    changes=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  الفرع:        ${CYAN}${branch}${RESET}"
    echo -e "  التغييرات:    ${changes} ملف"
  else
    echo -e "  الحالة:       ${RED}ليس مستودع Git${RESET}"
  fi

  log "فحص الحالة"
}

# tron test — تشغيل الاختبارات
cmd_test() {
  print_banner
  info "تشغيل الاختبارات..."

  check_project
  require_cmd bun

  cd "${PROJECT_DIR}"

  local test_args="${*:-}"
  
  info "تشغيل: bun run test ${test_args}"
  echo ""

  if bun run test ${test_args}; then
    echo ""
    success "جميع الاختبارات نجحت! ✅"
    log "اختبارات ناجحة"
  else
    echo ""
    error "بعض الاختبارات فشلت"
    log "اختبارات فاشلة"
    exit 1
  fi
}

# tron lint — فحص الكود
cmd_lint() {
  print_banner
  info "فحص جودة الكود..."

  check_project
  require_cmd bun

  cd "${PROJECT_DIR}"

  if bun run lint; then
    echo ""
    success "فحص الكود ناجح! ✨"
    log "فحص كود ناجح"
  else
    echo ""
    error "فحص الكود به مشاكل"
    log "فحص كود به مشاكل"
    exit 1
  fi
}

# tron help — عرض المساعدة
cmd_help() {
  print_banner
  echo -e "${BOLD}الأوامر المتاحة:${RESET}"
  echo ""
  echo -e "  ${GREEN}tron deploy${RESET}     نشر المشروع على Vercel"
  echo -e "                الخيارات: --force (نشر إجباري)"
  echo ""
  echo -e "  ${GREEN}tron backup${RESET}     نسخ احتياطي لقاعدة البيانات"
  echo ""
  echo -e "  ${GREEN}tron status${RESET}     فحص حالة جميع الخدمات"
  echo ""
  echo -e "  ${GREEN}tron test${RESET}       تشغيل الاختبارات"
  echo -e "                الخيارات: تمرير أي معلمات لـ bun test"
  echo ""
  echo -e "  ${GREEN}tron lint${RESET}       فحص جودة الكود"
  echo ""
  echo -e "  ${GREEN}tron help${RESET}       عرض هذه المساعدة"
  echo ""
  echo -e "  ${GREEN}tron version${RESET}    عرض الإصدار"
  echo ""
  echo -e "${DIM}مثال:${RESET}"
  echo -e "  ${CYAN}tron deploy --force${RESET}    نشر إجباري للإنتاج"
  echo -e "  ${CYAN}tron test -- --watch${RESET}   تشغيل الاختبارات مع المراقبة"
  echo ""
  echo -e "${DIM}السجل: ${LOG_FILE}${RESET}"
}

# tron version — عرض الإصدار
cmd_version() {
  echo -e "${GREEN}${TRON_NAME}${RESET} v${TRON_VERSION}"
}

# === النقطة الرئيسية ===

main() {
  local command="${1:-help}"
  shift || true

  case "${command}" in
    deploy)
      cmd_deploy "$@"
      ;;
    backup)
      cmd_backup "$@"
      ;;
    status)
      cmd_status "$@"
      ;;
    test)
      cmd_test "$@"
      ;;
    lint)
      cmd_lint "$@"
      ;;
    help|--help|-h)
      cmd_help
      ;;
    version|--version|-v)
      cmd_version
      ;;
    *)
      error "أمر غير معروف: ${command}"
      echo ""
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
