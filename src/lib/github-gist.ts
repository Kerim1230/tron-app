// واجهة GitHub Gist API لتخزين البيانات خفيف الوزن
// توفر عمليات إنشاء وقراءة وتحديث مقتطفات Gist
// تستخدم واجهة GitHub REST API للمصادقة والعمليات

// ==================== الأنواع ====================

/** ملف داخل الـ Gist */
export interface GistFile {
  /** اسم الملف */
  filename: string;
  /** محتوى الملف */
  content: string;
  /** لغة الملف */
  language?: string | null;
  /** حجم الملف بالبايت */
  size?: number;
  /** هل الملف مقتطع */
  truncated?: boolean;
}

/** معلومات الـ Gist */
export interface GistInfo {
  /** معرف الـ Gist */
  id: string;
  /** وصف الـ Gist */
  description: string | null;
  /** هل الـ Gist عام */
  public: boolean;
  /** عنوان URL للـ Gist */
  htmlUrl: string;
  /** عنوان URL للمحتوى الخام */
  gitPullUrl: string;
  /** ملفات الـ Gist */
  files: GistFile[];
  /** اسم المستخدم المالك */
  owner: string;
  /** تاريخ الإنشاء */
  createdAt: string;
  /** تاريخ آخر تحديث */
  updatedAt: string;
  /** عدد التعليقات */
  comments: number;
}

/** نتيجة إنشاء Gist */
export interface CreateGistResult {
  /** هل تم الإنشاء بنجاح */
  success: boolean;
  /** معرف الـ Gist المنشأ */
  gistId?: string;
  /** عنوان URL للـ Gist */
  htmlUrl?: string;
  /** رسالة الخطأ (إن وجدت) */
  error?: string;
}

/** نتيجة تحديث Gist */
export interface UpdateGistResult {
  /** هل تم التحديث بنجاح */
  success: boolean;
  /** رسالة تأكيد أو خطأ */
  message?: string;
  /** خطأ (إن وجد) */
  error?: string;
}

// ==================== الثوابت ====================

/** نقطة بداية واجهة GitHub REST API */
const GITHUB_API_BASE = "https://api.github.com";

/**
 * الحصول على رمز المصادقة من متغيرات البيئة
 * @returns رمز المصادقة أو فارغ إذا لم يكن موجوداً
 */
function getAuthToken(): string | null {
  return process.env.GIT_TOKEN || process.env.GITHUB_TOKEN || null;
}

/**
 * الحصول على ترويسات المصادقة المشتركة
 * @returns كائن الترويسات مع رمز المصادقة
 * @throws خطأ إذا لم يتم العثور على رمز المصادقة
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(
      "لم يتم العثور على رمز المصادقة. يرجى تعيين GIT_TOKEN أو GITHUB_TOKEN في متغيرات البيئة."
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * تحويل استجابة واجهة برمجة التطبيقات إلى كائن GistInfo
 * @param data - بيانات الاستجابة الخام
 * @returns كائن GistInfo المنظم
 */
function mapGistResponse(data: Record<string, unknown>): GistInfo {
  const files: GistFile[] = [];

  // تحويل ملفات الـ Gist من كائن إلى مصفوفة
  const rawFiles = data.files as Record<string, Record<string, unknown>> || {};
  for (const [filename, fileData] of Object.entries(rawFiles)) {
    files.push({
      filename,
      content: (fileData.content as string) || "",
      language: (fileData.language as string) || null,
      size: (fileData.size as number) || 0,
      truncated: (fileData.truncated as boolean) || false,
    });
  }

  return {
    id: (data.id as string) || "",
    description: (data.description as string) || null,
    public: (data.public as boolean) || false,
    htmlUrl: (data.html_url as string) || "",
    gitPullUrl: (data.git_pull_url as string) || "",
    files,
    owner: ((data.owner as Record<string, unknown>)?.login as string) || "",
    createdAt: (data.created_at as string) || "",
    updatedAt: (data.updated_at as string) || "",
    comments: (data.comments as number) || 0,
  };
}

// ==================== الدوال الرئيسية ====================

/**
 * حفظ محتوى في Gist جديد
 * ينشئ مقتطف كود جديد على GitHub مع ملف واحد أو أكثر
 * @param content - محتوى الملف المراد حفظه
 * @param filename - اسم الملف داخل الـ Gist
 * @param description - وصف الـ Gist (اختياري)
 * @param isPublic - هل الـ Gist عام أم خاص (الافتراضي: خاص)
 * @returns نتيجة الإنشاء مع معرف الـ Gist وعنوان URL
 * @throws خطأ إذا فشل إنشاء الـ Gist
 */
export async function saveToGist(
  content: string,
  filename: string,
  description?: string,
  isPublic: boolean = false
): Promise<CreateGistResult> {
  try {
    // بناء هيكل الطلب
    const requestBody = {
      description: description || `Gist created by TRON Σ - ${filename}`,
      public: isPublic,
      files: {
        [filename]: {
          content,
        },
      },
    };

    // إرسال طلب إنشاء الـ Gist
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `فشل إنشاء الـ Gist (الحالة: ${response.status}): ${errorText}`,
      };
    }

    // تحليل الاستجابة
    const data = (await response.json()) as Record<string, unknown>;

    return {
      success: true,
      gistId: (data.id as string) || "",
      htmlUrl: (data.html_url as string) || "",
    };
  } catch (error) {
    // معالجة الأخطاء غير المتوقعة
    const message =
      error instanceof Error ? error.message : "خطأ غير معروف أثناء إنشاء الـ Gist";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * تحميل محتوى من Gist موجود
 * يسترجع محتوى الـ Gist بالكامل أو ملف محدد منه
 * @param gistId - معرف الـ Gist المراد تحميله
 * @param filename - اسم ملف محدد داخل الـ Gist (اختياري، يرجع كل الملفات إذا لم يحدد)
 * @returns معلومات الـ Gist أو محتوى ملف محدد
 * @throws خطأ إذا فشل تحميل الـ Gist
 */
export async function loadFromGist(
  gistId: string,
  filename?: string
): Promise<GistInfo | string> {
  try {
    // إرسال طلب الحصول على الـ Gist
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `فشل تحميل الـ Gist (الحالة: ${response.status}): ${errorText}`
      );
    }

    // تحليل الاستجابة
    const data = (await response.json()) as Record<string, unknown>;

    // تحويل إلى كائن GistInfo
    const gistInfo = mapGistResponse(data);

    // إذا تم تحديد اسم ملف، إرجاع محتوى ذلك الملف فقط
    if (filename) {
      const file = gistInfo.files.find((f) => f.filename === filename);
      if (!file) {
        throw new Error(
          `لم يتم العثور على الملف "${filename}" في الـ Gist ${gistId}`
        );
      }
      return file.content;
    }

    // إرجاع معلومات الـ Gist الكاملة
    return gistInfo;
  } catch (error) {
    // إعادة رمي الخطأ مع رسالة واضحة
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("خطأ غير معروف أثناء تحميل الـ Gist");
  }
}

/**
 * تحديث محتوى ملف في Gist موجود
 * يحدّث محتوى ملف محدد دون التأثير على بقية الملفات
 * @param gistId - معرف الـ Gist المراد تحديثه
 * @param content - المحتوى الجديد
 * @param filename - اسم الملف المراد تحديثه
 * @returns نتيجة التحديث مع رسالة تأكيد أو خطأ
 * @throws خطأ إذا فشل تحديث الـ Gist
 */
export async function updateGist(
  gistId: string,
  content: string,
  filename: string
): Promise<UpdateGistResult> {
  try {
    // بناء هيكل الطلب - تحديث ملف محدد فقط
    const requestBody = {
      files: {
        [filename]: {
          content,
        },
      },
    };

    // إرسال طلب تحديث الـ Gist
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `فشل تحديث الـ Gist (الحالة: ${response.status}): ${errorText}`,
      };
    }

    return {
      success: true,
      message: `تم تحديث الملف "${filename}" في الـ Gist ${gistId} بنجاح`,
    };
  } catch (error) {
    // معالجة الأخطاء غير المتوقعة
    const message =
      error instanceof Error
        ? error.message
        : "خطأ غير معروف أثناء تحديث الـ Gist";
    return {
      success: false,
      error: message,
    };
  }
}
