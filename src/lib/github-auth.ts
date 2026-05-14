// دوال مساعدة لمصادقة GitHub OAuth
// توفر عمليات بناء رابط المصادقة واستبدال الرمز بالرمز المميز وجلب بيانات المستخدم
// تستخدم تدفق OAuth 2.0 القياسي لـ GitHub

// ==================== الأنواع ====================

/** نتيجة استبدال رمز التفويض بالرمز المميز */
export interface TokenExchangeResult {
  /** هل تم التبديل بنجاح */
  success: boolean;
  /** الرمز المميز للوصول */
  accessToken?: string;
  /** نوع الرمز المميز */
  tokenType?: string;
  /** الصلاحيات الممنوحة */
  scope?: string;
  /** رمز التحديث (اختياري) */
  refreshToken?: string;
  /** مدة صلاحية الرمز بالثواني (اختياري) */
  expiresIn?: number;
  /** رسالة الخطأ (إن وجدت) */
  error?: string;
  /** وصف الخطأ (اختياري) */
  errorDescription?: string;
}

/** بيانات ملف المستخدم من GitHub */
export interface GitHubUserProfile {
  /** معرف المستخدم الرقمي */
  id: number;
  /** اسم المستخدم */
  login: string;
  /** الاسم المعروض */
  name: string | null;
  /** البريد الإلكتروني */
  email: string | null;
  /** النبذة التعريفية */
  bio: string | null;
  /** عنوان الصورة الشخصية */
  avatarUrl: string;
  /** عنوان URL للملف الشخصي */
  htmlUrl: string;
  /** الشركة */
  company: string | null;
  /** الموقع */
  location: string | null;
  /** الموقع الإلكتروني */
  blog: string | null;
  /** عدد المستودعات العامة */
  publicRepos: number;
  /** عدد متابعي المستخدم */
  followers: number;
  /** عدد الأشخاص الذين يتبعهم */
  following: number;
  /** هل الحساب تم التحقق منه */
  isVerified: boolean;
  /** تاريخ إنشاء الحساب */
  createdAt: string;
  /** نوع الحساب */
  type: "User" | "Organization";
}

// ==================== الثوابت ====================

/** نقطة بداية رابط تفويض GitHub OAuth */
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

/** نقطة بداية رابط استبدال رمز GitHub OAuth */
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

/** نقطة بداية واجهة GitHub REST API */
const GITHUB_API_BASE = "https://api.github.com";

/** الصلاحيات الافتراضية المطلوبة */
const DEFAULT_SCOPES = ["read:user", "user:email", "repo"];

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
 * بناء عنوان URL لتفويض GitHub OAuth
 * ينشئ رابط المصادقة الذي يُعيد توجيه المستخدم إلى صفحة تسجيل الدخول في GitHub
 * @param scopes - الصلاحيات المطلوبة (اختياري، الافتراضي: read:user, user:email, repo)
 * @param redirectUri - عنوان URL لإعادة التوجيه بعد المصادقة (اختياري)
 * @param state - معلمة الحالة للحماية من هجمات CSRF (اختياري)
 * @returns عنوان URL الكامل لتفويض GitHub
 * @throws خطأ إذا لم يتم تعيين GITHUB_CLIENT_ID في متغيرات البيئة
 */
export function getGitHubAuthUrl(
  scopes?: string[],
  redirectUri?: string,
  state?: string
): string {
  // التحقق من وجود معرف العميل
  const clientId = getClientId();
  if (!clientId) {
    throw new Error(
      "لم يتم العثور على معرف العميل. يرجى تعيين GITHUB_CLIENT_ID في متغيرات البيئة."
    );
  }

  // بناء معلمات عنوان URL
  const params = new URLSearchParams();

  // إضافة معرف العميل
  params.set("client_id", clientId);

  // إضافة الصلاحيات المطلوبة
  const effectiveScopes = scopes || DEFAULT_SCOPES;
  params.set("scope", effectiveScopes.join(" "));

  // إضافة عنوان إعادة التوجيه إذا كان موجوداً
  if (redirectUri) {
    params.set("redirect_uri", redirectUri);
  }

  // إضافة معلمة الحالة لحماية CSRF
  if (state) {
    params.set("state", state);
  }

  // بناء عنوان URL الكامل
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * استبدال رمز التفويض بالرمز المميز للوصول
 * يرسل طلب POST إلى GitHub لاستبدال الرمز المؤقت برمز وصول دائم
 * @param code - رمز التفويض المستلم من GitHub بعد موافقة المستخدم
 * @returns نتيجة التبديل مع الرمز المميز أو رسالة الخطأ
 * @throws خطأ إذا لم يتم تعيين متغيرات البيئة المطلوبة
 */
export async function exchangeCodeForToken(
  code: string
): Promise<TokenExchangeResult> {
  // التحقق من وجود معرف العميل وسر العميل
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: "لم يتم العثور على معرف العميل أو سر العميل. يرجى تعيين GITHUB_CLIENT_ID و GITHUB_CLIENT_SECRET في متغيرات البيئة.",
    };
  }

  try {
    // إرسال طلب استبدال الرمز
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `فشل استبدال الرمز (الحالة: ${response.status}): ${errorText}`,
      };
    }

    // تحليل الاستجابة
    const data = (await response.json()) as Record<string, unknown>;

    // التحقق من وجود خطأ في الاستجابة
    if (data.error) {
      return {
        success: false,
        error: data.error as string,
        errorDescription: data.error_description as string | undefined,
      };
    }

    // إرجاع الرمز المميز
    return {
      success: true,
      accessToken: data.access_token as string,
      tokenType: data.token_type as string,
      scope: data.scope as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresIn: data.expires_in as number | undefined,
    };
  } catch (error) {
    // معالجة الأخطاء غير المتوقعة
    const message =
      error instanceof Error
        ? error.message
        : "خطأ غير معروف أثناء استبدال الرمز";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * الحصول على بيانات ملف المستخدم من GitHub
 * يستخدم الرمز المميز للوصول لجلب معلومات الملف الشخصي
 * @param accessToken - الرمز المميز للوصول إلى GitHub
 * @returns بيانات ملف المستخدم المنظمة
 * @throws خطأ إذا فشل جلب البيانات
 */
export async function getGitHubUser(
  accessToken: string
): Promise<GitHubUserProfile> {
  try {
    // إرسال طلب الحصول على بيانات المستخدم
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `فشل جلب بيانات المستخدم (الحالة: ${response.status}): ${errorText}`
      );
    }

    // تحليل الاستجابة
    const data = (await response.json()) as Record<string, unknown>;

    // بناء كائن بيانات المستخدم
    return {
      id: (data.id as number) || 0,
      login: (data.login as string) || "",
      name: (data.name as string) || null,
      email: (data.email as string) || null,
      bio: (data.bio as string) || null,
      avatarUrl: (data.avatar_url as string) || "",
      htmlUrl: (data.html_url as string) || "",
      company: (data.company as string) || null,
      location: (data.location as string) || null,
      blog: (data.blog as string) || null,
      publicRepos: (data.public_repos as number) || 0,
      followers: (data.followers as number) || 0,
      following: (data.following as number) || 0,
      isVerified: (data.verified as boolean) || false,
      createdAt: (data.created_at as string) || "",
      type: (data.type as "User" | "Organization") || "User",
    };
  } catch (error) {
    // إعادة رمي الخطأ مع رسالة واضحة
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("خطأ غير معروف أثناء جلب بيانات المستخدم");
  }
}
