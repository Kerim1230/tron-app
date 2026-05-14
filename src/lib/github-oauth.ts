// إدارة جلسات مصادقة GitHub OAuth
// يوفر دوال لإنشاء والتحقق من حالة OAuth وتحديث الرموز المنتهية
// يستخدم حماية CSRF عبر معلمة الحالة وتدقيق زمني آمن

import { randomBytes, timingSafeEqual } from "crypto";

// ==================== الأنواع ====================

/** حالة OAuth لتتبع جلسة المصادقة */
export interface OAuthState {
  /** القيمة العشوائية للحالة */
  value: string;
  /** الطابع الزمني لإنشاء الحالة */
  createdAt: number;
  /** مدة الصلاحية بالمللي ثانية */
  expiresAt: number;
  /** معرف الجلسة المرتبطة (اختياري) */
  sessionId?: string;
  /** عنوان URL لإعادة التوجيه (اختياري) */
  redirectUri?: string;
}

/** نتيجة التحقق من الحالة */
export interface OAuthStateValidationResult {
  /** هل الحالة صالحة */
  valid: boolean;
  /** سبب الفشل (إن وجد) */
  reason?: string;
  /** الحالة المحللة (إن كانت صالحة) */
  state?: OAuthState;
}

/** نتيجة تحديث الرمز المميز */
export interface TokenRefreshResult {
  /** هل تم التحديث بنجاح */
  success: boolean;
  /** الرمز المميز الجديد للوصول */
  accessToken?: string;
  /** نوع الرمز المميز */
  tokenType?: string;
  /** الصلاحيات الممنوحة */
  scope?: string;
  /** رمز التحديث الجديد (اختياري) */
  refreshToken?: string;
  /** مدة صلاحية الرمز الجديد بالثواني */
  expiresIn?: number;
  /** رسالة الخطأ (إن وجدت) */
  error?: string;
}

/** جلسة مصادقة GitHub */
export interface GitHubOAuthSession {
  /** معرف الجلسة */
  sessionId: string;
  /** حالة OAuth */
  state: OAuthState;
  /** الرمز المميز للوصول */
  accessToken?: string;
  /** رمز التحديث */
  refreshToken?: string;
  /** صلاحيات الرمز */
  scope?: string;
  /** تاريخ انتهاء الصلاحية */
  expiresAt?: number;
  /** اسم المستخدم على GitHub */
  username?: string;
}

// ==================== الثوابت ====================

/** مدة صلاحية حالة OAuth الافتراضية: 10 دقائق */
const DEFAULT_STATE_TTL_MS = 10 * 60 * 1000;

/** طول القيمة العشوائية للحالة بالبايت */
const STATE_RANDOM_BYTES = 32;

/** نقطة بداية رابط تحديث رمز GitHub OAuth */
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

/**
 * الحصول على معرف العميل من متغيرات البيئة
 * @returns معرف العميل أو فارغ إذا لم يكن موجوداً
 */
function getClientId(): string | null {
  return process.env.GITHUB_CLIENT_ID || null;
}

/**
 * الحصول على سر العميل من متغيرات البيئة
 * @returns سر العميل أو فارغ إذا لم يكن موجوداً
 */
function getClientSecret(): string | null {
  return process.env.GITHUB_CLIENT_SECRET || null;
}

// ==================== الدوال الرئيسية ====================

/**
 * إنشاء حالة OAuth عشوائية للحماية من هجمات CSRF
 * تنشئ قيمة عشوائية آمنة مشفرة مع طابع زمني لتحديد الصلاحية
 * @param ttlMs - مدة صلاحية الحالة بالمللي ثانية (الافتراضي: 10 دقائق)
 * @param sessionId - معرف الجلسة المرتبطة (اختياري)
 * @param redirectUri - عنوان URL لإعادة التوجيه (اختياري)
 * @returns كائن حالة OAuth مع القيمة العشوائية ومعلومات الصلاحية
 */
export function createOAuthState(
  ttlMs: number = DEFAULT_STATE_TTL_MS,
  sessionId?: string,
  redirectUri?: string
): OAuthState {
  // إنشاء قيمة عشوائية آمنة مشفرة
  const randomValue = randomBytes(STATE_RANDOM_BYTES).toString("hex");

  // حساب الطابع الزمني الحالي
  const now = Date.now();

  // بناء كائن الحالة
  return {
    value: randomValue,
    createdAt: now,
    expiresAt: now + ttlMs,
    sessionId,
    redirectUri,
  };
}

/**
 * التحقق من صحة حالة OAuth
 * يقارن القيم باستخدام مقارنة آمنة زمنياً لمنع هجمات التوقيت
 * يتحقق أيضاً من أن الحالة لم تنتهِ صلاحيتها
 * @param state - قيمة الحالة المستلمة من GitHub
 * @param storedState - الحالة المخزنة مسبقاً عند بدء المصادقة
 * @returns نتيجة التحقق مع سبب الفشل إن وجد
 */
export function validateOAuthState(
  state: string,
  storedState: OAuthState
): OAuthStateValidationResult {
  try {
    // التحقق من أن قيمة الحالة غير فارغة
    if (!state || typeof state !== "string") {
      return {
        valid: false,
        reason: "قيمة الحالة فارغة أو غير صالحة",
      };
    }

    // التحقق من أن الحالة المخزنة تحتوي على قيمة
    if (!storedState.value) {
      return {
        valid: false,
        reason: "الحالة المخزنة لا تحتوي على قيمة صالحة",
      };
    }

    // التحقق من انتهاء صلاحية الحالة
    const now = Date.now();
    if (now > storedState.expiresAt) {
      return {
        valid: false,
        reason: "انتهت صلاحية حالة المصادقة",
      };
    }

    // مقارنة آمنة زمنياً لمنع هجمات التوقيت
    const stateBuffer = Buffer.from(state, "utf8");
    const storedBuffer = Buffer.from(storedState.value, "utf8");

    // التحقق من تساوي الأطوال
    if (stateBuffer.length !== storedBuffer.length) {
      return {
        valid: false,
        reason: "قيمة الحالة غير متطابقة",
      };
    }

    // مقارنة آمنة زمنياً
    const isValid = timingSafeEqual(stateBuffer, storedBuffer);

    if (!isValid) {
      return {
        valid: false,
        reason: "قيمة الحالة غير متطابقة",
      };
    }

    // الحالة صالحة
    return {
      valid: true,
      state: storedState,
    };
  } catch {
    // أي خطأ أثناء التحقق يعني فشل المصادقة
    return {
      valid: false,
      reason: "حدث خطأ أثناء التحقق من الحالة",
    };
  }
}

/**
 * تحديث رمز GitHub المميز المنتهي
 * يستخدم رمز التحديث للحصول على رمز وصول جديد
 * يتطلب إعداد رمز التحديث في تطبيق GitHub (يجب تفعيل expire user tokens)
 * @param refreshToken - رمز التحديث المستلم مع رمز الوصول الأصلي
 * @returns نتيجة التحديث مع الرمز المميز الجديد أو رسالة الخطأ
 * @throws خطأ إذا لم يتم تعيين متغيرات البيئة المطلوبة
 */
export async function refreshGitHubToken(
  refreshToken: string
): Promise<TokenRefreshResult> {
  // التحقق من وجود معرف العميل وسر العميل
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: "لم يتم العثور على معرف العميل أو سر العميل. يرجى تعيين GITHUB_CLIENT_ID و GITHUB_CLIENT_SECRET في متغيرات البيئة.",
    };
  }

  // التحقق من وجود رمز التحديث
  if (!refreshToken) {
    return {
      success: false,
      error: "رمز التحديث فارغ أو غير صالح",
    };
  }

  try {
    // إرسال طلب تحديث الرمز المميز
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `فشل تحديث الرمز المميز (الحالة: ${response.status}): ${errorText}`,
      };
    }

    // تحليل الاستجابة
    const data = (await response.json()) as Record<string, unknown>;

    // التحقق من وجود خطأ في الاستجابة
    if (data.error) {
      return {
        success: false,
        error: data.error as string,
      };
    }

    // حساب وقت انتهاء الصلاحية
    const expiresIn = data.expires_in as number | undefined;
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

    // إرجاع الرمز المميز الجديد
    return {
      success: true,
      accessToken: data.access_token as string,
      tokenType: data.token_type as string,
      scope: data.scope as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresIn,
    };
  } catch (error) {
    // معالجة الأخطاء غير المتوقعة
    const message =
      error instanceof Error
        ? error.message
        : "خطأ غير معروف أثناء تحديث الرمز المميز";

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * تشفير حالة OAuth لتخزينها بأمان
 * يحول كائن الحالة إلى نص مشفر بترميز Base64
 * @param state - كائن حالة OAuth
 * @returns نص مشفر يمكن تخزينه بأمان
 */
export function encodeOAuthState(state: OAuthState): string {
  // تحويل الكائن إلى نص JSON
  const jsonString = JSON.stringify(state);

  // تشفير بترميز Base64
  return Buffer.from(jsonString, "utf8").toString("base64url");
}

/**
 * فك تشفير حالة OAuth المخزنة
 * يحول النص المشفر مرة أخرى إلى كائن الحالة
 * @param encoded - النص المشفر
 * @returns كائن حالة OAuth أو فارغ إذا فشل فك التشفير
 */
export function decodeOAuthState(encoded: string): OAuthState | null {
  try {
    // فك تشفير Base64
    const jsonString = Buffer.from(encoded, "base64url").toString("utf8");

    // تحويل النص إلى كائن
    const parsed = JSON.parse(jsonString) as OAuthState;

    // التحقق من وجود الحقول المطلوبة
    if (!parsed.value || !parsed.createdAt || !parsed.expiresAt) {
      return null;
    }

    return parsed;
  } catch {
    // فشل فك التشفير
    return null;
  }
}
