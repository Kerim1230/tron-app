# 🏠 TRON Σ — الصفحة الرئيسية

> المتصفح الذكي من الجيل القادم — صُنع بـ ❤️ لمجتمع الويب العربي

---

## 📖 نبذة عن المشروع

**TRON Σ** هو متصفح ذكي يجمع بين سرعة الأداء وقوة الذكاء الاصطناعي وتصميم عصري يركز على الخصوصية. مصمم خصيصًا لدعم اللغة العربية وواجهات RTL بشكل أصلي.

### الميزات الأساسية

| الميزة | الوصف |
|--------|-------|
| 🧠 مساعد ذكي | تلخيص، ترجمة، وإجابة على الأسئلة |
| 🛡️ خصوصية متقدمة | حظر متتبعات، DNS مشفر، بصمة محمية |
| ⚡ أداء فائق | محرك عرض سريع، تحميل كسول ذكي |
| 🌐 دعم عربي أصلي | واجهة RTL كاملة، خطوط محسّنة |
| 🎨 تخصيص مرن | سمات، تخطيطات، إضافات |
| 🔄 مزامنة سلسة | تشفير طرف-لطرف عبر الأجهزة |

---

## 🚀 البدء السريع

```bash
# استنساخ المستودع
git clone https://github.com/tron-sigma/smart-browser.git
cd smart-browser

# تثبيت التبعيات
bun install

# إعداد البيئة
cp .env.example .env.local
bun run db:push

# تشغيل خادم التطوير
bun run dev
```

---

## 🏗️ مخطط البنية (نصي)

```
┌─────────────────────────────────────────────────────────┐
│                    TRON Σ Architecture                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Desktop  │  │  Mobile  │  │  Web App │              │
│  │  (Tauri) │  │(RN/Expo) │  │(Next.js) │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                     │
│       └──────────────┼──────────────┘                    │
│                      │                                    │
│              ┌───────▼───────┐                            │
│              │   API Gateway  │                            │
│              │   (Caddy)     │                            │
│              └───────┬───────┘                            │
│                      │                                    │
│       ┌──────────────┼──────────────┐                    │
│       │              │              │                     │
│  ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐              │
│  │ Next.js │  │  Socket   │  │  AI     │              │
│  │ Server  │  │  Service  │  │ Service │              │
│  │ :3000   │  │  :3003    │  │  :3004  │              │
│  └────┬────┘  └─────┬─────┘  └────┬────┘              │
│       │              │              │                     │
│       └──────────────┼──────────────┘                    │
│                      │                                    │
│              ┌───────▼───────┐                            │
│              │   Prisma ORM  │                            │
│              │   (SQLite)    │                            │
│              └───────────────┘                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 صفحات الويكي

| الصفحة | الوصف |
|--------|-------|
| [Architecture](Architecture) | البنية التقنية التفصيلية وهيكل المشروع |
| [API Reference](API-Reference) | مرجع واجهة برمجة التطبيقات الكامل |
| [Deployment](Deployment) | دليل النشر والتفريغ على Vercel |
| [Contributing](Contributing) | دليل المساهمة في المشروع |

---

## 🔗 روابط مهمة

- 🌍 الموقع الرسمي: [tron-sigma.dev](https://tron-sigma.dev)
- 💻 الكود المصدري: [GitHub](https://github.com/tron-sigma/smart-browser)
- 💬 المجتمع: [Discord](https://discord.gg/tron-sigma)
- 🐛 الإبلاغ عن الأخطاء: [Issues](https://github.com/tron-sigma/smart-browser/issues)
- 📝 التوثيق: [docs/](../docs/)

---

## 📊 حالة المشروع

![Activity](https://img.shields.io/github/commit-activity/m/tron-sigma/smart-browser)
![Issues](https://img.shields.io/github/issues/tron-sigma/smart-browser)
![PRs](https://img.shields.io/github/issues-pr/tron-sigma/smart-browser)
![License](https://img.shields.io/github/license/tron-sigma/smart-browser)

---

> 🚀 **TRON Σ** — المتصفح الذكي من الجيل القادم
