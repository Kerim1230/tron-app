# 🤝 دليل المساهمة — TRON Σ

> تعليمات تفصيلية للمساهمة في تطوير TRON Σ

---

## 📋 جدول المحتويات

1. [إعداد بيئة التطوير](#إعداد-بيئة-التطوير)
2. [معايير الكود](#معايير-الكود)
3. [الاختبارات](#الاختبارات)
4. [عملية طلب السحب](#عملية-طلب-السحب)
5. [رسائل الالتزام](#رسائل-الالتزام)
6. [معايير التصميم](#معايير-التصميم)
7. [دعم RTL والعربية](#دعم-rtl-والعربية)

---

## 🛠️ إعداد بيئة التطوير

### المتطلبات

```bash
node --version  # >= 18.0.0
bun --version   # >= 1.0.0
git --version   # >= 2.40.0
```

### خطوات الإعداد

```bash
# 1. استنساخ المستودع
git clone https://github.com/tron-sigma/smart-browser.git
cd smart-browser

# 2. إنشاء فرع للميزة
git checkout -b feature/your-feature-name

# 3. تثبيت التبعيات
bun install

# 4. إعداد متغيرات البيئة
cp .env.example .env.local
# عدّل .env.local بالقيم المطلوبة

# 5. إعداد قاعدة البيانات
bun run db:push

# 6. تشغيل خادم التطوير
bun run dev

# 7. فتح المتصفح على http://localhost:3000
```

### خدمات مصغرة

```bash
# تشغيل خدمة الدردشة
cd mini-services/chat-service
bun install
bun run dev  # يعمل على المنفذ 3003

# تشغيل خدمة الذكاء الاصطناعي
cd mini-services/ai-service
bun install
bun run dev  # يعمل على المنفذ 3004
```

---

## 📏 معايير الكود

### TypeScript

```typescript
// ✅ استخدم أنواع محددة دائمًا
interface BrowserTab {
  id: string;
  title: string;
  url: string;
  status: 'active' | 'inactive' | 'frozen';
}

// ❌ تجنب any تمامًا
const tab: any = createTab();

// ✅ استخدم الأنواع العامة
function getTab<T extends BrowserTab>(id: string): Promise<T> {
  return db.tab.findUnique({ where: { id } }) as Promise<T>;
}
```

### مكونات React

```tsx
// ✅ هيكل المكون القياسي
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 1. تعريف الأنواع
interface TabListProps {
  tabs: BrowserTab[];
  onTabClose: (id: string) => void;
  onTabSelect: (id: string) => void;
}

// 2. المكون
export function TabList({ tabs, onTabClose, onTabSelect }: TabListProps) {
  // 3. الحالات
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // 4. المعالجات
  const handleClose = useCallback((id: string) => {
    setActiveTab(null);
    onTabClose(id);
  }, [onTabClose]);

  // 5. العرض
  return (
    <Card>
      <CardHeader>
        <CardTitle>التبويبات المفتوحة</CardTitle>
      </CardHeader>
      <CardContent>
        {tabs.map((tab) => (
          <div key={tab.id} onClick={() => onTabSelect(tab.id)}>
            {tab.title}
            <Button onClick={() => handleClose(tab.id)}>✕</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### مسارات API

```typescript
// src/app/api/tabs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const tabs = await db.tab.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tabs });
  } catch (error) {
    console.error('خطأ في استرجاع التبويبات:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'خطأ داخلي' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من البيانات
    if (!body.url || !body.title) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'البيانات مطلوبة' } },
        { status: 400 }
      );
    }

    const tab = await db.tab.create({ data: body });
    return NextResponse.json(tab, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء التبويب:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'خطأ داخلي' } },
      { status: 500 }
    );
  }
}
```

### قواعد التنسيق

| القاعدة | القيمة |
|---------|--------|
| المسافة البادئة | مسافتان |
| علامات الاقتباس | مفردة |
| الفاصلة اللاحقة | نعم (متعدد الأسطر) |
| الحد الأقصى للسطر | 100 حرف |
| الفواصل المنقوطة | دائمًا |

---

## 🧪 الاختبارات

### تشغيل الاختبارات

```bash
# جميع الاختبارات
bun run test

# اختبارات ملف محدد
bun run test -- src/components/browser/tab-bar.test.ts

# مراقبة التغييرات
bun run test -- --watch

# تغطية الكود
bun run test -- --coverage
```

### كتابة اختبارات

```typescript
// tab-bar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TabBar } from './tab-bar';

describe('TabBar', () => {
  const mockTabs = [
    { id: '1', title: 'تبويب 1', url: 'https://a.com', status: 'active' },
    { id: '2', title: 'تبويب 2', url: 'https://b.com', status: 'inactive' },
  ];

  it('يعرض جميع التبويبات', () => {
    render(<TabBar tabs={mockTabs} onTabClose={vi.fn()} onTabSelect={vi.fn()} />);
    expect(screen.getByText('تبويب 1')).toBeInTheDocument();
    expect(screen.getByText('تبويب 2')).toBeInTheDocument();
  });

  it('يستدعي onTabClose عند الضغط على زر الإغلاق', () => {
    const onClose = vi.fn();
    render(<TabBar tabs={mockTabs} onTabClose={onClose} onTabSelect={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /إغلاق/i })[0]);
    expect(onClose).toHaveBeenCalledWith('1');
  });
});
```

---

## 🔄 عملية طلب السحب

### الخطوات

```
1. تحديث الفرع المحلي
   git checkout main
   git pull origin main

2. إنشاء فرع جديد
   git checkout -b feature/اسم-الميزة

3. تطوير الميزة
   — اتبع معايير الكود
   — اكتب اختبارات
   — حدّث التوثيق

4. فحص الكود
   bun run lint

5. تشغيل الاختبارات
   bun run test

6. إرسال التغييرات
   git add .
   git commit -m "feat(scope): وصف التغيير"
   git push origin feature/اسم-الميزة

7. فتح طلب سحب على GitHub
   — استخدم القالب المناسب
   — اربط المشكلة المرتبطة
   — اطلب مراجعة

8. معالجة ملاحظات المراجعة
   — أجب على جميع التعليقات
   — أجري التعديلات المطلوبة

9. الدمج بعد الموافقة
```

### أسماء الفروع

| النوع | البادئة | مثال |
|-------|---------|-------|
| ميزة | `feature/` | `feature/ai-assistant` |
| إصلاح | `fix/` | `fix/tab-memory-leak` |
| تحسين | `improve/` | `improve/render-speed` |
| توثيق | `docs/` | `docs/api-endpoints` |

---

## 📝 رسائل الالتزام

نتبع [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### أنواع الالتزام

| النوع | الوصف | مثال |
|-------|-------|-------|
| `feat` | ميزة جديدة | `feat(ai): إضافة ميزة الترجمة الفورية` |
| `fix` | إصلاح خطأ | `fix(tabs): إصلاح تسرب الذاكرة في التبويبات` |
| `docs` | توثيق | `docs(api): تحديث مرجع API` |
| `style` | تنسيق | `style(ui): توحيد التباعد` |
| `refactor` | إعادة هيكلة | `refactor(auth): تبسيط منطق المصادقة` |
| `perf` | أداء | `perf(render): تسريع عرض المكونات` |
| `test` | اختبارات | `test(tabs): إضافة اختبارات شاملة` |
| `chore` | صيانة | `chore(deps): تحديث التبعيات` |

---

## 🎨 معايير التصميم

### ألوان TRON Σ

```css
/* الألوان الرئيسية */
--tron-primary: #22c55e;    /* الأخضر الرئيسي */
--tron-dark: #052e16;       /* الداكن */
--tron-light: #dcfce7;      /* الفاتح */

/* ألوان الدلالات */
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #06b6d4;
```

### مكونات shadcn/ui

```tsx
// ✅ استخدم مكونات shadcn/ui الموجودة
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

// ❌ لا تنشئ مكونات من الصدر إذا كان shadcn/ui يوفرها
```

### التصميم المتجاوب

```tsx
// ✅ تصميم متجاوب
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="p-4 md:p-6">
      {/* المحتوى */}
    </Card>
  ))}
</div>
```

---

## 🌐 دعم RTL والعربية

### قواعد أساسية

```tsx
// ✅ استخدم خصائص منطقية (logical properties)
<div className="ps-4 pe-2 ms-2 me-4">
  {/* padding-inline-start, padding-inline-end, etc. */}
</div>

// ❌ لا تستخدم left/right
<div className="pl-4 pr-2 ml-2 mr-4">
  {/* خطأ — لا يعمل مع RTL */}
</div>

// ✅ استخدم start/end للنص
<p className="text-start">النص</p>

// ❌ تجنب text-left/text-right
<p className="text-right">النص</p>
```

### مكونات داعمة لـ RTL

```tsx
// صفحة كاملة بـ RTL
export default function ArabicPage() {
  return (
    <div dir="rtl" className="font-tajawal">
      <header className="flex items-center gap-4">
        <Logo />
        <nav className="flex items-center gap-6">
          <a href="#">الرئيسية</a>
          <a href="#">الميزات</a>
        </nav>
      </header>
      <main>
        {/* المحتوى */}
      </main>
    </div>
  );
}
```

### نصوص واجهة المستخدم

```typescript
// lib/i18n.ts
export const ar = {
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    close: 'إغلاق',
    search: 'بحث',
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ',
    success: 'تم بنجاح',
  },
  browser: {
    newTab: 'تبويب جديد',
    closeTab: 'إغلاق التبويب',
    bookmark: 'إضافة إشارة',
    history: 'السجل',
    settings: 'الإعدادات',
  },
  ai: {
    summarize: 'تلخيص',
    translate: 'ترجمة',
    ask: 'اسأل المساعد',
  },
};
```

---

## ✅ قائمة مراجعة قبل الإرسال

- [ ] الكود يتبع معايير TypeScript الصارمة
- [ ] لا توجد أخطاء Lint (`bun run lint` ينجح)
- [ ] جميع الاختبارات تنجح (`bun run test`)
- [ ] التوثيق محدث (إذا لزم الأمر)
- [ ] دعم RTL يعمل بشكل صحيح
- [ ] التصميم متجاوب على جميع الشاشات
- [ ] لا توجد تحذيرات في وحدة التحكم
- [ ] رسائل الالتزام تتبع Conventional Commits
- [ ] طلب السحب يستخدم القالب المناسب

---

> 🤝 **TRON Σ** — مساهماتك تصنع الفرق
