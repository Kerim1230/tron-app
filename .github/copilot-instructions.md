# تعليمات GitHub Copilot - TRON Σ
<!-- تعليمات مخصصة لمساعد البرمجة بالذكاء الاصطناعي -->

## 🏗️ معمارية TRON Σ

TRON Σ هو متصفح ذكي مبني على Next.js 16 مع معمارية موجهة باللوحات (Panel-based).

### البنية الأساسية
```
src/
├── app/                    # صفحات Next.js App Router
│   ├── api/                # نقاط نهاية API
│   │   ├── browser/agent/  # وكيل التصفح الذكي
│   │   ├── bookmarks/      # إدارة المفضلة
│   │   ├── chat/           # المحادثة مع AI
│   │   ├── skills/         # مهارات TRON
│   │   └── history/        # سجل التصفح
│   ├── layout.tsx          # التخطيط الرئيسي
│   └── page.tsx            # الصفحة الرئيسية
├── components/
│   ├── tron/               # مكونات TRON المخصصة
│   │   ├── BrowserPanel    # لوحة التصفح
│   │   ├── ChatPanel       # لوحة المحادثة
│   │   ├── HomePanel       # لوحة الرئيسية
│   │   ├── SkillsPanel     # لوحة المهارات
│   │   ├── HistoryPanel    # لوحة السجل
│   │   └── BookmarksPanel  # لوحة المفضلة
│   └── ui/                 # مكونات shadcn/ui
├── hooks/                  # خطافات React المخصصة
├── lib/                    # أدوات مساعدة
│   ├── db.ts               # عميل قاعدة البيانات Prisma
│   └── utils.ts            # أدوات مساعدة عامة
└── store/                  # إدارة الحالة Zustand
    └── useAppStore.ts      # المخزن الرئيسي للتطبيق
```

## 📐 اصطلاحات التسمية

### الملفات والمجلدات
- **المكونات**: `PascalCase` مثل `BrowserPanel.tsx`
- **الخطافات**: `camelCase` مع بادئة `use` مثل `useAppStore.ts`
- **الأدوات**: `camelCase` مثل `db.ts`, `utils.ts`
- **نقاط API**: `kebab-case` أو `camelCase`
- **أنماط Prisma**: `PascalCase` مثل `Bookmark`, `History`

### الكود
- **المتغيرات**: `camelCase` مثل `isLoading`, `userProfile`
- **الثوابت**: `UPPER_SNAKE_CASE` مثل `MAX_RETRIES`
- **الأنواع**: `PascalCase` مع بادئة `T` اختيارياً مثل `PanelType`
- **المكونات**: `PascalCase` مع تصدير مسمى
- **الدوال المساعدة**: `camelCase` مثل `formatDate()`

## 🌐 دعم اللغة العربية

TRON Σ يدعم واجهة عربية بالكامل. عند كتابة الكود:

### قواعد واجهة المستخدم العربية
```tsx
// ✅ صحيح - نص عربي مباشر
<h1>مرحباً بك في TRON Σ</h1>

// ✅ صحيح - دعم ثنائي اللغة
const t = {
  ar: { welcome: 'مرحباً بك في TRON Σ' },
  en: { welcome: 'Welcome to TRON Σ' }
};

// ❌ خطأ - نص إنجليزي فقط
<h1>Welcome to TRON Σ</h1>
```

### اتجاه النص
```tsx
// دعم RTL للعربية
<div dir="rtl" className="text-right">
  <p>النص العربي</p>
</div>

// دعم ديناميكي
<div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
  {content}
</div>
```

## 🎨 أصناف Tailwind CSS

### استخدام الألوان
```tsx
// ✅ استخدم متغيرات shadcn/ui
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">

// ❌ لا تستخدم الألوان المباشرة
<div className="bg-blue-500 text-white">
<div className="bg-indigo-600">
```

### التصميم المتجاوب
```tsx
// ✅ الجوال أولاً
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ✅ أحجام لمس مناسبة
<button className="min-h-[44px] min-w-[44px]">

// ✅ حشوة متسقة
<div className="p-4 md:p-6">
```

## 📦 أمثلة الكود

### مكون TRON نموذجي
```tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TronPanelProps {
  title: string;
  // خصائص إضافية
}

export function TronPanel({ title }: TronPanelProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setIsActive(!isActive)}>
          {isActive ? 'نشط' : 'غير نشط'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### نقطة نهاية API
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const data = await db.model.findMany();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}
```

### استخدام المخزن
```tsx
import { useAppStore } from '@/store/useAppStore';

function Component() {
  const { activePanel, setActivePanel } = useAppStore();

  return (
    <button onClick={() => setActivePanel('chat')}>
      المحادثة
    </button>
  );
}
```

## ⚡ قواعد مهمة

1. **لا تستخدم indigo أو blue** ما لم يُطلب صراحة
2. **استخدم مكونات shadcn/ui** بدلاً من بناء مكونات من الصفر
3. **TypeScript صارم** في جميع الملفات
4. **استخدم `'use client'`** للمكونات التفاعلية
5. **استخدم API Routes** بدلاً من Server Actions
6. **Prisma** لجميع عمليات قاعدة البيانات
7. **Zustand** لإدارة الحالة، **TanStack Query** لبيانات الخادم
8. **阿拉伯 تعليقات** حيثما أمكن لشرح المنطق المعقد
