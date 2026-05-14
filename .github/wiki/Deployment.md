# 🚀 دليل النشر — TRON Σ

> تعليمات تفصيلية لنشر المشروع على Vercel وإدارته في الإنتاج

---

## 📋 جدول المحتويات

1. [المتطلبات الأساسية](#المتطلبات-الأساسية)
2. [النشر على Vercel](#النشر-على-vercel)
3. [متغيرات البيئة](#متغيرات-البيئة)
4. [قاعدة البيانات](#قاعدة-البيانات)
5. [CI/CD](#cicd)
6. [المراقبة والصيانة](#المراقبة-والصيانة)
7. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 📦 المتطلبات الأساسية

### الحسابات المطلوبة

| الخدمة | الغرض | الرابط |
|--------|-------|--------|
| Vercel | منصة النشر | [vercel.com](https://vercel.com) |
| GitHub | المستودع | [github.com](https://github.com) |
| Discord | تنبيهات المجتمع | [discord.com](https://discord.com) |

### الأدوات المحلية

```bash
# تأكد من تثبيت الأدوات التالية
node --version   # >= 18.0.0
bun --version    # >= 1.0.0
vercel --version # Vercel CLI

# تثبيت Vercel CLI (إذا لم يكن مثبتًا)
bun add -g vercel
```

---

## ☁️ النشر على Vercel

### الطريقة الأولى: عبر Vercel Dashboard

1. **ربط المستودع**
   - اذهب إلى [vercel.com/new](https://vercel.com/new)
   - اختر مستودع `tron-sigma/smart-browser`
   - اضغط **Import**

2. **إعدادات المشروع**
   ```
   Framework Preset:    Next.js
   Root Directory:      ./
   Build Command:       bun run build
   Output Directory:    .next
   Install Command:     bun install
   ```

3. **متغيرات البيئة**
   - أضف جميع متغيرات البيئة المطلوبة (انظر القسم أدناه)
   - اضغط **Deploy**

4. **التحقق**
   - انتظر اكتمال البناء
   - تحقق من عنوان URL المخصص
   - اختبر نقاط نهاية API

### الطريقة الثانية: عبر Vercel CLI

```bash
# تسجيل الدخول
vercel login

# النشر لأول مرة
vercel

# النشر للإنتاج
vercel --prod

# أو استخدم TRON CLI
tron deploy
```

### الطريقة الثالثة: عبر GitHub Actions (تلقائي)

عند الدمج في فرع `main`، يتم النشر تلقائيًا عبر CI/CD.

---

## 🔑 متغيرات البيئة

### متغيرات مطلوبة

```env
# === التطبيق ===
NEXT_PUBLIC_APP_URL=https://tron-sigma.dev
NEXT_PUBLIC_APP_NAME="TRON Σ"

# === قاعدة البيانات ===
DATABASE_URL="file:./db/tron.db"

# === المصادقة (NextAuth.js) ===
NEXTAUTH_URL=https://tron-sigma.dev
NEXTAUTH_SECRET=<generate-secure-secret>

# === الذكاء الاصطناعي ===
Z_AI_API_KEY=<z-ai-api-key>
Z_AI_MODEL=tron-ai-v2

# === خدمات خارجية ===
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>
```

### متغيرات اختيارية

```env
# === مصادقة OAuth ===
GITHUB_ID=<github-oauth-id>
GITHUB_SECRET=<github-oauth-secret>
GOOGLE_ID=<google-oauth-id>
GOOGLE_SECRET=<google-oauth-secret>

# === WebSocket ===
SOCKET_PORT=3003

# === التخزين ===
UPLOAD_MAX_SIZE=10485760
ALLOWED_ORIGINS=https://tron-sigma.dev

# === المراقبة ===
SENTRY_AUTH_TOKEN=<sentry-token>
SENTRY_ORG=tron-sigma
SENTRY_PROJECT=smart-browser
```

### إنشاء أسرار آمنة

```bash
# إنشاء NEXTAUTH_SECRET
openssl rand -base64 32

# أو باستخدام Bun
bun -e "console.log(Buffer.from(crypto.randomUUID()).toString('base64'))"
```

---

## 🗄️ قاعدة البيانات

### الإعداد الأولي

```bash
# إنشاء قاعدة البيانات
bun run db:push

# بذر البيانات الأولية (اختياري)
bun run db:seed

# فحص حالة قاعدة البيانات
bunx prisma studio
```

### عمليات الصيانة

```bash
# نسخ احتياطي
tron backup

# أو يدويًا
cp db/tron.db db/backups/tron_$(date +%Y%m%d_%H%M%S).db

# استعادة من نسخة احتياطية
cp db/backups/tron_20240115_100000.db db/tron.db

# إعادة تعيين قاعدة البيانات (⚠️ يحذف جميع البيانات)
bunx prisma migrate reset
```

### مخطط Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String?
  role      Role     @default(USER)
  settings  Json     @default("{}")
  tabs      Tab[]
  bookmarks Bookmark[]
  history   History[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Tab {
  id        String   @id @default(cuid())
  title     String
  url       String
  status    TabStatus @default(ACTIVE)
  groupId   String?
  favicon   String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}

enum TabStatus {
  ACTIVE
  INACTIVE
  FROZEN
}
```

---

## 🔄 CI/CD

### GitHub Actions Workflow

يتم تشغيل خطوط الأنابيب تلقائيًا عند:

| الحدث | الفرع | الإجراء |
|-------|-------|---------|
| Push | `main` | نشر الإنتاج |
| Push | `develop` | نشر المعاينة |
| PR | `main` | فحص الكود والاختبار |
| Tag | `v*` | إنشاء إصدار |

### مراحل خط الأنابيب

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Install   │──▶│    Lint     │──▶│    Test     │──▶│   Deploy    │
│  (bun install)│   │ (bun run lint)│  │ (bun run test)│ │  (vercel)  │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

### فحص جودة الكود

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run type-check

  deploy-preview:
    needs: quality
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📊 المراقبة والصيانة

### فحص حالة الخدمات

```bash
# استخدام TRON CLI
tron status

# أو يدويًا
curl -s https://tron-sigma.dev/api/health | jq .
```

**استجابة متوقعة:**
```json
{
  "status": "healthy",
  "uptime": "15d 4h 32m",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "ai": "available",
    "websocket": "running"
  }
}
```

### مؤشرات الأداء

| المؤشر | الحد المقبول | التنبيه |
|--------|-------------|---------|
| وقت الاستجابة | < 200ms | > 500ms |
| معدل الخطأ | < 0.1% | > 1% |
| استخدام الذاكرة | < 80% | > 90% |
| اتصالات قاعدة البيانات | < 50 | > 80 |

### سجلات التطبيق

```bash
# سجلات Vercel
vercel logs --follow

# سجلات محلية
tail -f dev.log
```

---

## 🔧 استكشاف الأخطاء

### مشاكل شائعة

| المشكلة | السبب | الحل |
|---------|-------|------|
| فشل البناء | إصدارات غير متوافقة | `bun install` وتأكد من الإصدارات |
| خطأ 500 | مشكلة قاعدة البيانات | تحقق من `DATABASE_URL` |
| بطء الاستجابة | ضغط على الخادم | تحقق من المراقبة وقم بالتوسعة |
| فشل المصادقة | سر غير صالح | أعد إنشاء `NEXTAUTH_SECRET` |
| AI لا يعمل | مفتاح API غير صالح | تحقق من `Z_AI_API_KEY` |

### إعادة النشر الطارئة

```bash
# نشر سريع
vercel --prod --force

# أو
tron deploy --force
```

---

> 🚀 **TRON Σ** — نشر سليم ومستقر
