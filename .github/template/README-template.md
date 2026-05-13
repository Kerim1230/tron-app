<div align="center">

# 🚀 TRON Σ

### المتصفح الذكي من الجيل القادم

[![الإصدار](https://img.shields.io/badge/الإصدار-1.0.0-brightgreen)](https://github.com/tron-sigma/smart-browser/releases)
[![الحالة](https://img.shields.io/badge/الحالة-نشط-success)](https://github.com/tron-sigma/smart-browser)
[![الترخيص](https://img.shields.io/badge/الترخيص-MIT-blue)](LICENSE)
[![المساهمون](https://img.shields.io/github/contributors/tron-sigma/smart-browser)](https://github.com/tron-sigma/smart-browser/graphs/contributors)
[![Discord](https://img.shields.io/discord/1234567890?label=Discord&color=7289da)](https://discord.gg/tron-sigma)

[🌍 الموقع](https://tron-sigma.dev) •
[📖 التوثيق](https://tron-sigma.dev/docs) •
[💬 Discord](https://discord.gg/tron-sigma) •
[🐛 الإبلاغ عن خطأ](https://github.com/tron-sigma/smart-browser/issues/new?template=bug_report.yml) •
[✨ طلب ميزة](https://github.com/tron-sigma/smart-browser/issues/new?template=feature_request.yml)

</div>

---

## 🌟 نبذة عن TRON Σ

TRON Σ هو متصفح ذكي من الجيل القادم يجمع بين سرعة الأداء وقوة الذكاء الاصطناعي وتصميم عصري يركز على الخصوصية. مصمم خصيصًا لدعم اللغة العربية وواجهات RTL بشكل أصلي.

## ✨ الميزات الرئيسية

- 🧠 **مساعد ذكي مدمج** — مدعوم بالذكاء الاصطناعي لتلخيص الصفحات والترجمة والإجابة على الأسئلة
- 🛡️ **خصوصية متقدمة** — حظر المتتبعات تلقائيًا، وضع التصفح الخاص المحسّن، DNS مشفر
- ⚡ **أداء فائق** — محرك عرض سريع مع تحميل كسول ذكي وإدارة ذاكرة متقدمة
- 🌐 **دعم عربي أصلي** — واجهة كاملة باللغة العربية مع دعم RTL أصلي
- 🎨 **تخصيص مرن** — سمات متعددة، تخطيطات قابلة للتخصيص، إضافات قوية
- 🔄 **مزامنة سلسة** — مزامنة عبر الأجهزة مع تشفير من طرف إلى طرف
- 📱 **متعدد المنصات** — يعمل على Windows، macOS، Linux، Android، iOS

## 📦 المتطلبات الأساسية

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0
- **Git** >= 2.40.0

## 🚀 التثبيت

### من المصدر

```bash
# استنساخ المستودع
git clone https://github.com/tron-sigma/smart-browser.git
cd smart-browser

# تثبيت التبعيات
bun install

# إعداد قاعدة البيانات
bun run db:push

# تشغيل خادم التطوير
bun run dev
```

### من الحزمة المترجمة

```bash
# تحميل أحدث إصدار
# من صفحة الإصدارات: https://github.com/tron-sigma/smart-browser/releases
```

## 🖥️ الاستخدام

### التشغيل السريع

```bash
# تشغيل وضع التطوير
bun run dev

# فحص جودة الكود
bun run lint

# بناء للإنتاج
bun run build
```

### أوامر TRON CLI

```bash
# نشر المشروع
tron deploy

# نسخ احتياطي لقاعدة البيانات
tron backup

# فحص حالة الخدمات
tron status

# تشغيل الاختبارات
tron test

# فحص الكود
tron lint
```

## 🏗️ البنية التقنية

```
smart-browser/
├── src/
│   ├── app/              # صفحات Next.js App Router
│   ├── components/       # مكونات React واجهة المستخدم
│   ├── lib/              # أدوات مساعدة وخدمات
│   ├── hooks/            # React Hooks مخصصة
│   └── styles/           # أنماط Tailwind CSS
├── prisma/               # مخطط قاعدة البيانات
├── docs/                 # التوثيق
├── .github/              # قوالب GitHub وسكربتات
└── mini-services/        # خدمات مصغرة مستقلة
```

## 🤝 المساهمة

نرحب بمساهماتك! يرجى قراءة [دليل المساهمة](CONTRIBUTING.md) للحصول على تفاصيل حول:

- إعداد بيئة التطوير
- معايير كتابة الكود
- عملية إرسال طلبات السحب
- إرشادات التوثيق

## 📜 الترخيص

هذا المشروع مرخص تحت رخصة MIT — راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🙏 شكر وتقدير

- فريق [Next.js](https://nextjs.org/) على إطار العمل الرائع
- فريق [shadcn/ui](https://ui.shadcn.com/) على مكتبة المكونات
- مجتمع المصادر المفتوحة بأكمله

## 📞 التواصل

- 🌍 الموقع: [tron-sigma.dev](https://tron-sigma.dev)
- 💬 Discord: [discord.gg/tron-sigma](https://discord.gg/tron-sigma)
- 🐦 تويتر: [@TRONSigma](https://twitter.com/TRONSigma)
- 📧 البريد: [hello@tron-sigma.dev](mailto:hello@tron-sigma.dev)

---

<div align="center">

**صُنع بـ ❤️ لمجتمع الويب العربي**

</div>
