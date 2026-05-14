#!/usr/bin/env bash
# ==============================================================================
# 🧠 TRON Σ — أداة GitHub Copilot CLI
# مساعد ذكي للبرمجة باستخدام gh copilot
# ==============================================================================

set -euo pipefail

# === الألوان ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# === المتغيرات ===
TRON_COPILOT_VERSION="1.0.0"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# === الدوال المساعدة ===

print_banner() {
  echo -e "${MAGENTA}"
  echo "  🧠 TRON Σ Copilot CLI"
  echo -e "${RESET}"
  echo -e "${DIM}  مساعد ذكي للبرمجة — مدعوم بـ GitHub Copilot${RESET}"
  echo ""
}

info() {
  echo -e "${BLUE}ℹ${RESET} ${CYAN}$1${RESET}"
}

success() {
  echo -e "${GREEN}✓${RESET} ${GREEN}$1${RESET}"
}

warn() {
  echo -e "${YELLOW}⚠${RESET} ${YELLOW}$1${RESET}"
}

error() {
  echo -e "${RED}✗${RESET} ${RED}$1${RESET}"
}

# التحقق من تثبيت gh CLI
require_gh() {
  if ! command -v gh &> /dev/null; then
    error "أمر 'gh' غير مثبت. يرجى تثبيت GitHub CLI أولاً."
    echo -e "${DIM}  https://cli.github.com/${RESET}"
    exit 1
  fi
}

# التحقق من تثبيت gh copilot extension
require_copilot() {
  require_gh
  if ! gh extension list 2>/dev/null | grep -q "copilot"; then
    warn "إضافة GitHub Copilot غير مثبتة. جارٍ التثبيت..."
    gh extension install github/gh-copilot
    if [[ $? -eq 0 ]]; then
      success "تم تثبيت إضافة GitHub Copilot"
    else
      error "فشل تثبيت إضافة GitHub Copilot"
      exit 1
    fi
  fi
}

# التحقق من المصادقة
require_auth() {
  if ! gh auth status &> /dev/null; then
    error "لم يتم تسجيل الدخول إلى GitHub CLI"
    echo -e "${DIM}  شغّل 'gh auth login' أولاً${RESET}"
    exit 1
  fi
}

# === الأوامر ===

# tron explain — شرح الكود
cmd_explain() {
  print_banner
  require_copilot
  require_auth

  local target="${1:-}"
  
  if [[ -z "${target}" ]]; then
    # إذا لم يتم تحديد ملف، اسأل المستخدم
    echo -e "${BOLD}ما الذي تريد شرحه؟${RESET}"
    echo ""
    echo -e "  1) ملف محدد"
    echo -e "  2) دالة محددة"
    echo -e "  3) كود من الحافظة"
    echo -e "  4) آخر التغييرات (git diff)"
    echo ""
    read -rp "اختر (1-4): " choice

    case "${choice}" in
      1)
        read -rp "مسار الملف: " file_path
        if [[ -f "${PROJECT_DIR}/${file_path}" ]]; then
          target="شرح محتوى الملف ${file_path} في مشروع TRON Σ. اشرح باللغة العربية مع توضيح البنية والمنطق والأهمية."
          gh copilot explain "${target}" < "${PROJECT_DIR}/${file_path}"
        else
          error "الملف غير موجود: ${file_path}"
          exit 1
        fi
        ;;
      2)
        read -rp "اسم الدالة أو المكون: " func_name
        target="شرح الدالة أو المكون '${func_name}' في مشروع TRON Σ. اشرح باللغة العربية: ما الذي تفعله، مدخلاتها، مخرجاتها، وأي جانب مهم."
        gh copilot suggest "${target}"
        ;;
      3)
        if command -v pbpaste &> /dev/null; then
          target="شرح الكود التالي في سياق مشروع TRON Σ. اشرح باللغة العربية."
          pbpaste | gh copilot explain "${target}"
        elif command -v xclip &> /dev/null; then
          target="شرح الكود التالي في سياق مشروع TRON Σ. اشرح باللغة العربية."
          xclip -selection clipboard -o | gh copilot explain "${target}"
        else
          error "لا يمكن قراءة الحافظة. يرجى تمرير مسار ملف بدلاً من ذلك."
          exit 1
        fi
        ;;
      4)
        target="شرح آخر التغييرات في مشروع TRON Σ. اشرح باللغة العربية ما الذي تغير ولماذا."
        git diff | gh copilot explain "${target}"
        ;;
      *)
        error "اختيار غير صالح"
        exit 1
        ;;
    esac
  else
    # إذا تم تحديد ملف
    if [[ -f "${target}" ]]; then
      info "شرح الملف: ${target}"
      gh copilot explain "شرح هذا الكود في سياق مشروع TRON Σ المتصفح الذكي. اشرح باللغة العربية مع توضيح البنية والمنطق والأهمية." < "${target}"
    elif [[ -d "${target}" ]]; then
      info "شرح الدليل: ${target}"
      # جمع جميع ملفات TypeScript/TSX
      for file in "${target}"/*.{ts,tsx,js,jsx}; do
        if [[ -f "${file}" ]]; then
          echo -e "\n${BOLD}📄 $(basename "${file}")${RESET}"
          gh copilot explain "شرح هذا الكود باختصار باللغة العربية." < "${file}"
          echo ""
        fi
      done
    else
      # اعتباره سؤالًا نصيًا
      info "شرح: ${target}"
      gh copilot suggest "في سياق مشروع TRON Σ (متصفح ذكي): ${target} — أجب باللغة العربية."
    fi
  fi
}

# tron suggest — اقتراح تحسينات
cmd_suggest() {
  print_banner
  require_copilot
  require_auth

  local scope="${1:-general}"
  local context=""

  # بناء السياق حسب النطاق
  case "${scope}" in
    performance|أداء)
      context="اقترح تحسينات أداء لمشروع TRON Σ. ركز على: تسريع العرض، تحسين الذاكرة، تحسين استعلامات قاعدة البيانات، تقليل حجم الحزمة. أجب باللغة العربية."
      ;;
    security|أمان)
      context="اقترح تحسينات أمنية لمشروع TRON Σ. ركز على: حماية XSS، CSRF، حقن SQL، أمان API، تشفير البيانات. أجب باللغة العربية."
      ;;
    accessibility|إمكانية-الوصول)
      context="اقترح تحسينات إمكانية الوصول لمشروع TRON Σ. ركز على: دعم قارئ الشاشة، التنقل بلوحة المفاتيح، التباين، ARIA. أجب باللغة العربية."
      ;;
    rtl|عربي)
      context="اقترح تحسينات دعم RTL والعربية لمشروع TRON Σ. ركز على: خصائص منطقية، اتجاه النص، تخطيط متوافق، خطوط عربية. أجب باللغة العربية."
      ;;
    code|كود)
      context="راجع كود مشروع TRON Σ واقترح تحسينات. ركز على: أنماط التصميم، إعادة الاستخدام، قابلية القراءة، الصيانة. أجب باللغة العربية."
      ;;
    *)
      # إذا كان نصًا حرًا
      if [[ -f "${scope}" ]]; then
        context="راجع هذا الملف واقترح تحسينات باللغة العربية. ركز على: الجودة، الأداء، الأمان، وأفضل الممارسات."
        info "مراجعة الملف: ${scope}"
        gh copilot suggest "${context}" < "${scope}"
        return
      fi
      context="اقترح تحسينات لمشروع TRON Σ (متصفح ذكي): ${scope}. أجب باللغة العربية مع أمثلة كود."
      ;;
  esac

  info "طلب اقتراحات: ${scope}"
  echo ""
  
  gh copilot suggest "${context}"
}

# tron fix — إصلاح مشاكل
cmd_fix() {
  print_banner
  require_copilot
  require_auth

  local issue="${1:-}"
  
  if [[ -z "${issue}" ]]; then
    echo -e "${BOLD}ما المشكلة التي تريد إصلاحها؟${RESET}"
    echo ""
    echo -e "  1) أخطاء Lint"
    echo -e "  2) أخطاء TypeScript"
    echo -e "  3) مشكلة محددة (وصفها)"
    echo -e "  4) آخر خطأ في السجلات"
    echo ""
    read -rp "اختر (1-4): " choice

    case "${choice}" in
      1)
        info "تحليل أخطاء Lint..."
        local lint_output
        lint_output=$(cd "${PROJECT_DIR}" && bun run lint 2>&1 || true)
        if [[ -z "${lint_output}" ]]; then
          success "لا توجد أخطاء Lint"
          return
        fi
        echo "${lint_output}" | gh copilot suggest "أصلح أخطاء Lint التالية في مشروع TRON Σ. قدم الكود المصحح بالكامل باللغة العربية."
        ;;
      2)
        info "تحليل أخطاء TypeScript..."
        local ts_output
        ts_output=$(cd "${PROJECT_DIR}" && bunx tsc --noEmit 2>&1 || true)
        if [[ -z "${ts_output}" ]]; then
          success "لا توجد أخطاء TypeScript"
          return
        fi
        echo "${ts_output}" | gh copilot suggest "أصلح أخطاء TypeScript التالية في مشروع TRON Σ. قدم الكود المصحح باللغة العربية."
        ;;
      3)
        read -rp "صف المشكلة: " problem_desc
        gh copilot suggest "أصلح هذه المشكلة في مشروع TRON Σ: ${problem_desc}. قدم حلًا باللغة العربية مع الكود المصحح."
        ;;
      4)
        if [[ -f "${PROJECT_DIR}/dev.log" ]]; then
          local last_error
          last_error=$(tail -50 "${PROJECT_DIR}/dev.log" | rg -i "error|fail|crash" | tail -5 || true)
          if [[ -n "${last_error}" ]]; then
            echo "${last_error}" | gh copilot suggest "حلل وأصلح هذه الأخطاء من سجل TRON Σ. أجب باللغة العربية."
          else
            warn "لا توجد أخطاء في السجل"
          fi
        else
          warn "ملف السجل غير موجود"
        fi
        ;;
      *)
        error "اختيار غير صالح"
        exit 1
        ;;
    esac
  else
    if [[ -f "${issue}" ]]; then
      info "إصلاح مشكلة من ملف: ${issue}"
      gh copilot suggest "أصلح المشاكل في هذا الكود ضمن مشروع TRON Σ. قدم الكود المصحح باللغة العربية." < "${issue}"
    else
      info "إصلاح مشكلة: ${issue}"
      gh copilot suggest "أصلح هذه المشكلة في مشروع TRON Σ: ${issue}. قدم حلًا عمليًا باللغة العربية مع أمثلة كود."
    fi
  fi
}

# tron generate — توليد كود
cmd_generate() {
  print_banner
  require_copilot
  require_auth

  local type="${1:-}"
  
  if [[ -z "${type}" ]]; then
    echo -e "${BOLD}ما الذي تريد توليده؟${RESET}"
    echo ""
    echo -e "  1) مكون React جديد"
    echo -e "  2) مسار API جديد"
    echo -e "  3) React Hook مخصص"
    echo -e "  4) مخطط Prisma"
    echo -e "  5) اختبار"
    echo -e "  6) كود مخصص"
    echo ""
    read -rp "اختر (1-6): " choice

    case "${choice}" in
      1)
        read -rp "اسم المكون: " component_name
        read -rp "الوصف: " component_desc
        gh copilot suggest "أنشئ مكون React باسم '${component_name}' لمشروع TRON Σ. الوصف: ${component_desc}. استخدم TypeScript، shadcn/ui، Tailwind CSS. ادعم RTL. أجب باللغة العربية مع الكود الكامل."
        ;;
      2)
        read -rp "مسار API (مثال: /api/tabs): " api_path
        read -rp "الطرق المطلوبة (GET, POST, etc.): " api_methods
        gh copilot suggest "أنشئ مسار API في ${api_path} بمشروع TRON Σ. الطرق: ${api_methods}. استخدم Next.js App Router، Prisma، TypeScript. اتبع نمط معالجة الأخطاء الموحد. أجب باللغة العربية."
        ;;
      3)
        read -rp "اسم الـ Hook: " hook_name
        read -rp "الوظيفة: " hook_desc
        gh copilot suggest "أنشئ React Hook مخصص باسم '${hook_name}' لمشروع TRON Σ. الوظيفة: ${hook_desc}. استخدم TypeScript. أجب باللغة العربية."
        ;;
      4)
        read -rp "اسم النموذج: " model_name
        read -rp "الحقول المطلوبة: " model_fields
        gh copilot suggest "أنشئ مخطط Prisma لنموذج '${model_name}' بمشروع TRON Σ. الحقول: ${model_fields}. استخدم SQLite. أجب باللغة العربية."
        ;;
      5)
        read -rp "الملف المراد اختباره: " test_target
        gh copilot suggest "أنشئ اختبارات للملف ${test_target} في مشروع TRON Σ. استخدم Vitest و Testing Library. غطِّ الحالات الأساسية والحدية. أجب باللغة العربية."
        ;;
      6)
        read -rp "صف ما تريد توليده: " custom_desc
        gh copilot suggest "في سياق مشروع TRON Σ (متصفح ذكي بـ Next.js 16): ${custom_desc}. أجب باللغة العربية مع كود كامل."
        ;;
      *)
        error "اختيار غير صالح"
        exit 1
        ;;
    esac
  else
    info "توليد: ${type}"
    gh copilot suggest "في سياق مشروع TRON Σ (متصفح ذكي بـ Next.js 16، TypeScript، Tailwind CSS، Prisma): ${type}. أجب باللغة العربية مع كود كامل."
  fi
}

# === المساعدة ===

cmd_help() {
  print_banner
  echo -e "${BOLD}الأوامر المتاحة:${RESET}"
  echo ""
  echo -e "  ${MAGENTA}tron explain${RESET}   شرح الكود وتوضيح المنطق"
  echo -e "               ${DIM}مثال: tron explain src/app/page.tsx${RESET}"
  echo -e "               ${DIM}مثال: tron explain \"كيف يعمل نظام التبويبات؟\"${RESET}"
  echo ""
  echo -e "  ${MAGENTA}tron suggest${RESET}  اقتراح تحسينات على الكود"
  echo -e "               ${DIM}النطاقات: performance, security, accessibility, rtl, code${RESET}"
  echo -e "               ${DIM}مثال: tron suggest performance${RESET}"
  echo -e "               ${DIM}مثال: tron suggest src/components/browser/tab-bar.tsx${RESET}"
  echo ""
  echo -e "  ${MAGENTA}tron fix${RESET}      إصلاح مشاكل وأخطاء"
  echo -e "               ${DIM}مثال: tron fix \"خطأ في渲染 التبويبات\"${RESET}"
  echo -e "               ${DIM}مثال: tron fix src/app/api/tabs/route.ts${RESET}"
  echo ""
  echo -e "  ${MAGENTA}tron generate${RESET} توليد كود جديد"
  echo -e "               ${DIM}مثال: tron generate \"أنشئ مكون شريط البحث\"${RESET}"
  echo -e "               ${DIM}مثال: tron generate (وضع تفاعلي)${RESET}"
  echo ""
  echo -e "${DIM}المتطلبات: GitHub CLI (gh) + إضافة Copilot${RESET}"
  echo -e "${DIM}التثبيت: gh extension install github/gh-copilot${RESET}"
}

# === النقطة الرئيسية ===

main() {
  local command="${1:-help}"
  shift || true

  case "${command}" in
    explain|شرح)
      cmd_explain "$@"
      ;;
    suggest|اقترح)
      cmd_suggest "$@"
      ;;
    fix|أصلح)
      cmd_fix "$@"
      ;;
    generate|ولّد)
      cmd_generate "$@"
      ;;
    help|--help|-h)
      cmd_help
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
