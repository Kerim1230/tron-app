# 📡 مرجع API — TRON Σ

> توثيق شامل لجميع نقاط نهاية واجهة برمجة التطبيقات

---

## 📋 جدول المحتويات

1. [المصادقة](#المصادقة)
2. [التبويبات](#التبويبات)
3. [الذكاء الاصطناعي](#الذكاء-الاصطناعي)
4. [الإعدادات](#الإعدادات)
5. [سجل التصفح](#سجل-التصفح)
6. [الإشارات المرجعية](#الإشارات-المرجعية)
7. [المزامنة](#المزامنة)
8. [رموز الأخطاء](#رموز-الأخطاء)

---

## 🔐 المصادقة

يستخدم TRON Σ مصادقة JWT عبر NextAuth.js v4. يجب تضمين رمز المصادقة في رأس الطلب.

### رأس المصادقة

```
Authorization: Bearer <token>
```

### الحصول على رمز المصادقة

```
POST /api/auth/signin
```

**الطلب:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**الاستجابة:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "usr_abc123",
    "name": "أحمد محمد",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

## 📑 التبويبات

### استرجاع جميع التبويبات

```
GET /api/tabs
```

**معلمات الاستعلام:**

| المعلمة | النوع | مطلوب | الوصف |
|---------|-------|-------|-------|
| `status` | string | لا | تصفية حسب الحالة: `active`, `inactive`, `frozen` |
| `limit` | number | لا | عدد النتائج (افتراضي: 50) |
| `offset` | number | لا | بداية النتائج (افتراضي: 0) |

**الاستجابة:**
```json
{
  "tabs": [
    {
      "id": "tab_abc123",
      "title": "TRON Σ — التوثيق",
      "url": "https://tron-sigma.dev/docs",
      "status": "active",
      "favicon": "https://tron-sigma.dev/favicon.ico",
      "lastActive": "2024-01-15T10:30:00Z",
      "groupId": "grp_work",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

### إنشاء تبويب جديد

```
POST /api/tabs
```

**الطلب:**
```json
{
  "url": "https://example.com",
  "title": "مثال",
  "groupId": "grp_work",
  "position": 0,
  "active": true
}
```

**الاستجابة:**
```json
{
  "id": "tab_xyz789",
  "title": "مثال",
  "url": "https://example.com",
  "status": "active",
  "createdAt": "2024-01-15T11:00:00Z"
}
```

### تحديث تبويب

```
PUT /api/tabs/:id
```

**الطلب:**
```json
{
  "title": "عنوان محدث",
  "status": "frozen",
  "groupId": "grp_personal"
}
```

**الاستجابة:**
```json
{
  "id": "tab_xyz789",
  "title": "عنوان محدث",
  "status": "frozen",
  "groupId": "grp_personal",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

### حذف تبويب

```
DELETE /api/tabs/:id
```

**الاستجابة:**
```json
{
  "message": "تم حذف التبويب بنجاح",
  "id": "tab_xyz789"
}
```

---

## 🧠 الذكاء الاصطناعي

### تلخيص محتوى صفحة

```
POST /api/ai/summarize
```

**الطلب:**
```json
{
  "url": "https://example.com/article",
  "content": "نص المحتوى المراد تلخيصه...",
  "language": "ar",
  "length": "medium",
  "format": "paragraph"
}
```

| المعلمة | النوع | الوصف |
|---------|-------|-------|
| `url` | string | رابط الصفحة (اختياري إذا وفرت المحتوى) |
| `content` | string | المحتوى النصي مباشرة |
| `language` | string | لغة التلخيص: `ar`, `en`, `fr` |
| `length` | string | الطول: `short`, `medium`, `long` |
| `format` | string | التنسيق: `paragraph`, `bullets`, `both` |

**الاستجابة:**
```json
{
  "summary": "يتناول المقال موضوع تطور تقنيات الذكاء الاصطناعي في العالم العربي...",
  "keyPoints": [
    "نمو سريع في اعتماد الذكاء الاصطناعي",
    "تحديات اللغة العربية في النماذج اللغوية",
    "فرص مستقبلية واعدة للابتكار"
  ],
  "wordCount": {
    "original": 2500,
    "summary": 150
  },
  "language": "ar",
  "model": "tron-ai-v2",
  "processingTime": "1.2s"
}
```

### ترجمة نص

```
POST /api/ai/translate
```

**الطلب:**
```json
{
  "text": "Hello, how are you today?",
  "source": "en",
  "target": "ar",
  "context": "casual"
}
```

| المعلمة | النوع | الوصف |
|---------|-------|-------|
| `text` | string | النص المراد ترجمته (حتى 5000 حرف) |
| `source` | string | لغة المصدر: `ar`, `en`, `fr`, `de`, `es`, `ja`, `zh` |
| `target` | string | لغة الهدف |
| `context` | string | السياق: `casual`, `formal`, `technical`, `literary` |

**الاستجابة:**
```json
{
  "translatedText": "مرحبًا، كيف حالك اليوم؟",
  "source": "en",
  "target": "ar",
  "confidence": 0.98,
  "alternatives": [
    "أهلاً، كيف حالك في هذا اليوم؟",
    "مرحباً، كيف تسير أمورك اليوم؟"
  ]
}
```

### محادثة مع المساعد

```
POST /api/ai/chat
```

**الطلب:**
```json
{
  "message": "اشرح لي كيف يعمل حظر المتتبعات",
  "context": "browser-settings",
  "history": [
    {
      "role": "user",
      "content": "كيف أحمي خصوصيتي؟"
    },
    {
      "role": "assistant",
      "content": "يمكنك تفعيل حظر المتتبعات من الإعدادات..."
    }
  ]
}
```

**الاستجابة:**
```json
{
  "response": "يعمل حظر المتتبعات عن طريق اعتراض الطلبات الصادرة...",
  "suggestions": [
    "كيف أفعّل حظر المتتبعات؟",
    "ما الفرق بين المستويات المختلفة؟",
    "هل يؤثر على أداء التصفح؟"
  ],
  "relatedSettings": [
    {
      "key": "trackerBlocking",
      "label": "حظر المتتبعات",
      "url": "/settings/privacy#tracker-blocking"
    }
  ]
}
```

---

## ⚙️ الإعدادات

### استرجاع الإعدادات

```
GET /api/settings
```

**الاستجابة:**
```json
{
  "general": {
    "language": "ar",
    "theme": "dark",
    "startupPage": "new-tab",
    "defaultSearchEngine": "tron-search"
  },
  "privacy": {
    "trackerBlocking": "strict",
    "encryptedDns": true,
    "fingerprintProtection": true,
    "privateBrowsingDefault": false
  },
  "performance": {
    "lazyLoading": true,
    "tabFreezing": true,
    "memoryOptimization": "auto",
    "cacheSize": "500mb"
  },
  "ai": {
    "enabled": true,
    "autoSummarize": false,
    "language": "ar",
    "model": "tron-ai-v2"
  }
}
```

### تحديث الإعدادات

```
PUT /api/settings
```

**الطلب:**
```json
{
  "privacy": {
    "trackerBlocking": "balanced"
  },
  "general": {
    "theme": "light"
  }
}
```

**الاستجابة:**
```json
{
  "message": "تم تحديث الإعدادات بنجاح",
  "updated": ["privacy.trackerBlocking", "general.theme"],
  "requiresRestart": false
}
```

---

## 📜 سجل التصفح

### استرجاع السجل

```
GET /api/history
```

**معلمات الاستعلام:**

| المعلمة | النوع | الوصف |
|---------|-------|-------|
| `q` | string | بحث في السجل |
| `from` | string | تاريخ البداية (ISO 8601) |
| `to` | string | تاريخ النهاية (ISO 8601) |
| `limit` | number | عدد النتائج (افتراضي: 100) |
| `domain` | string | تصفية حسب النطاق |

**الاستجابة:**
```json
{
  "entries": [
    {
      "id": "hist_abc123",
      "url": "https://tron-sigma.dev/docs",
      "title": "التوثيق الرسمي — TRON Σ",
      "visitedAt": "2024-01-15T10:30:00Z",
      "visitCount": 5,
      "domain": "tron-sigma.dev"
    }
  ],
  "total": 250,
  "limit": 100,
  "offset": 0
}
```

### حذف عنصر من السجل

```
DELETE /api/history/:id
```

**الاستجابة:**
```json
{
  "message": "تم حذف العنصر من السجل",
  "id": "hist_abc123"
}
```

### حذف السجل بالكامل

```
DELETE /api/history
```

**معلمات الاستعلام:**

| المعلمة | النوع | الوصف |
|---------|-------|-------|
| `from` | string | حذف من تاريخ |
| `to` | string | حذف إلى تاريخ |
| `domain` | string | حذف نطاق محدد فقط |

**الاستجابة:**
```json
{
  "message": "تم حذف السجل بنجاح",
  "deletedCount": 250
}
```

---

## 🔖 الإشارات المرجعية

### استرجاع الإشارات

```
GET /api/bookmarks
```

**الاستجابة:**
```json
{
  "bookmarks": [
    {
      "id": "bm_abc123",
      "url": "https://tron-sigma.dev",
      "title": "TRON Σ",
      "description": "المتصفح الذكي",
      "folderId": "folder_work",
      "tags": ["متصفح", "تقنية"],
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ],
  "folders": [
    {
      "id": "folder_work",
      "name": "عمل",
      "parentId": null,
      "count": 15
    }
  ]
}
```

### إضافة إشارة

```
POST /api/bookmarks
```

**الطلب:**
```json
{
  "url": "https://example.com",
  "title": "مثال",
  "description": "وصف مختصر",
  "folderId": "folder_work",
  "tags": ["تقنية", "مرجع"]
}
```

### حذف إشارة

```
DELETE /api/bookmarks/:id
```

---

## 🔄 المزامنة

### حالة المزامنة

```
GET /api/sync/status
```

**الاستجابة:**
```json
{
  "enabled": true,
  "lastSync": "2024-01-15T10:00:00Z",
  "devices": [
    {
      "id": "dev_abc",
      "name": "MacBook Pro",
      "type": "desktop",
      "lastActive": "2024-01-15T10:30:00Z"
    },
    {
      "id": "dev_xyz",
      "name": "iPhone 15",
      "type": "mobile",
      "lastActive": "2024-01-15T09:00:00Z"
    }
  ],
  "pendingChanges": 0
}
```

### تشغيل المزامنة

```
POST /api/sync/trigger
```

**الاستجابة:**
```json
{
  "message": "تمت المزامنة بنجاح",
  "syncedAt": "2024-01-15T11:00:00Z",
  "changesApplied": 3
}
```

---

## ❌ رموز الأخطاء

### رموز الحالة HTTP

| الرمز | الاسم | الوصف |
|-------|-------|-------|
| 200 | OK | الطلب ناجح |
| 201 | Created | تم إنشاء المورد بنجاح |
| 400 | Bad Request | طلب غير صالح أو معلمات مفقودة |
| 401 | Unauthorized | مصادقة مطلوبة أو رمز غير صالح |
| 403 | Forbidden | صلاحيات غير كافية |
| 404 | Not Found | المورد غير موجود |
| 409 | Conflict | تعارض (مثل: عنصر موجود مسبقًا) |
| 422 | Unprocessable | بيانات غير قابلة للمعالجة |
| 429 | Too Many Requests | تجاوز حد الطلبات |
| 500 | Internal Error | خطأ داخلي في الخادم |
| 503 | Unavailable | الخدمة غير متاحة مؤقتًا |

### تنسيق الخطأ

```json
{
  "error": {
    "code": "TAB_NOT_FOUND",
    "message": "التبويب المطلوب غير موجود",
    "details": {
      "tabId": "tab_invalid",
      "suggestion": "تحقق من معرف التبويب وحاول مرة أخرى"
    }
  }
}
```

### رموز الأخطاء المخصصة

| الرمز | الوصف |
|-------|-------|
| `AUTH_INVALID_TOKEN` | رمز المصادقة غير صالح أو منتهي |
| `AUTH_REQUIRED` | مصادقة مطلوبة لهذا الطلب |
| `TAB_NOT_FOUND` | التبويب غير موجود |
| `TAB_LIMIT_REACHED` | تم الوصول للحد الأقصى للتبويبات |
| `AI_SERVICE_UNAVAILABLE` | خدمة الذكاء الاصطناعي غير متاحة |
| `AI_RATE_LIMITED` | تجاوز حد طلبات الذكاء الاصطناعي |
| `AI_CONTENT_TOO_LARGE` | المحتوى كبير جدًا للمعالجة |
| `SETTINGS_INVALID` | قيمة إعداد غير صالحة |
| `SYNC_CONFLICT` | تعارض في المزامنة |
| `BOOKMARK_DUPLICATE` | إشارة مرجعية موجودة مسبقًا |
| `HISTORY_EMPTY` | سجل التصفح فارغ |
| `DB_CONNECTION_ERROR` | خطأ اتصال قاعدة البيانات |

---

## 📌 حدود API

| النقطة | الحد | النافذة الزمنية |
|--------|------|----------------|
| API عام | 100 طلب | الدقيقة |
| AI تلخيص | 20 طلب | الساعة |
| AI ترجمة | 30 طلب | الساعة |
| AI محادثة | 50 طلب | الساعة |
| مزامنة | 6 طلب | الدقيقة |

---

> 📡 **TRON Σ API** — واجهة برمجية قوية ومرنة
