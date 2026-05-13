// تحليلات GitHub Insights - جلب إحصائيات المستودعات
// يوفر بيانات حركة المرور والمساهمين وتوزيع اللغات
// يستخدم واجهة GitHub REST API لجلب البيانات التحليلية

// ==================== الأنواع ====================

/** بيانات حركة مرور المستودع */
export interface RepoTraffic {
  /** عدد مشاهدات المستودع */
  views: {
    /** العدد الإجمالي */
    count: number;
    /** عدد المشاهدات الفريدة */
    uniques: number;
    /** البيانات اليومية */
    daily: Array<{
      /** الطابع الزمني */
      timestamp: string;
      /** عدد المشاهدات */
      count: number;
      /** عدد المشاهدات الفريدة */
      uniques: number;
    }>;
  };
  /** عدد الاستنساخات */
  clones: {
    /** العدد الإجمالي */
    count: number;
    /** عدد الاستنساخات الفريدة */
    uniques: number;
    /** البيانات اليومية */
    daily: Array<{
      /** الطابع الزمني */
      timestamp: string;
      /** عدد الاستنساخات */
      count: number;
      /** عدد الاستنساخات الفريدة */
      uniques: number;
    }>;
  };
}

/** معلومات المساهم */
export interface ContributorInfo {
  /** معرف المساهم */
  id: number;
  /** اسم المستخدم */
  login: string;
  /** عنوان الصورة الشخصية */
  avatarUrl: string;
  /** عنوان URL للملف الشخصي */
  htmlUrl: string;
  /** عدد المساهمات */
  contributions: number;
  /** هل المساهم عضو في المستودع */
  isMember: boolean;
}

/** نسبة لغة برمجة في المستودع */
export interface LanguagePercentage {
  /** اسم اللغة */
  language: string;
  /** عدد البايتات المكتوبة بتلك اللغة */
  bytes: number;
  /** النسبة المئوية من إجمالي الكود */
  percentage: number;
  /** لون اللغة على GitHub */
  color?: string;
}

/** رؤى المستودع الشاملة */
export interface RepoInsights {
  /** اسم المستودع */
  repository: string;
  /** مالك المستودع */
  owner: string;
  /** بيانات حركة المرور (اختياري - يتطلب صلاحيات خاصة) */
  traffic?: RepoTraffic;
  /** قائمة المساهمين */
  contributors: ContributorInfo[];
  /** توزيع اللغات */
  languages: LanguagePercentage[];
  /** إحصائيات إضافية */
  metadata: {
    /** إجمالي عدد المساهمين */
    totalContributors: number;
    /** إجمالي عدد اللغات */
    totalLanguages: number;
    /** اللغة السائدة */
    primaryLanguage: string | null;
    /** وقت جلب البيانات */
    fetchedAt: string;
  };
}

// ==================== الثوابت ====================

/** نقطة بداية واجهة GitHub REST API */
const GITHUB_API_BASE = "https://api.github.com";

/** ألوان اللغات الشائعة على GitHub */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  Perl: "#0298c3",
  R: "#198CE7",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  Zig: "#ec915c",
  Nix: "#7e7eff",
};

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

// ==================== الدوال الداخلية ====================

/**
 * جلب بيانات حركة مرور المستودع
 * يتطلب صلاحيات خاصة (push access) للمستودع
 * @param owner - مالك المستودع
 * @param repo - اسم المستودع
 * @returns بيانات حركة المرور أو فارغ إذا فشل الجلب
 */
async function fetchRepoTraffic(
  owner: string,
  repo: string
): Promise<RepoTraffic | null> {
  try {
    // جلب بيانات المشاهدات
    const viewsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/traffic/views`,
      { method: "GET", headers: getAuthHeaders() }
    );

    // جلب بيانات الاستنساخات
    const clonesResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/traffic/clones`,
      { method: "GET", headers: getAuthHeaders() }
    );

    // تحليل بيانات المشاهدات
    let viewsData = { count: 0, uniques: 0, viewDays: [] as Array<Record<string, unknown>> };
    if (viewsResponse.ok) {
      const rawViews = (await viewsResponse.json()) as Record<string, unknown>;
      viewsData = {
        count: (rawViews.count as number) || 0,
        uniques: (rawViews.uniques as number) || 0,
        viewDays: (rawViews.views as Array<Record<string, unknown>>) || [],
      };
    }

    // تحليل بيانات الاستنساخات
    let clonesData = { count: 0, uniques: 0, cloneDays: [] as Array<Record<string, unknown>> };
    if (clonesResponse.ok) {
      const rawClones = (await clonesResponse.json()) as Record<string, unknown>;
      clonesData = {
        count: (rawClones.count as number) || 0,
        uniques: (rawClones.uniques as number) || 0,
        cloneDays: (rawClones.clones as Array<Record<string, unknown>>) || [],
      };
    }

    // بناء كائن حركة المرور
    return {
      views: {
        count: viewsData.count,
        uniques: viewsData.uniques,
        daily: viewsData.viewDays.map((day) => ({
          timestamp: (day.timestamp as string) || "",
          count: (day.count as number) || 0,
          uniques: (day.uniques as number) || 0,
        })),
      },
      clones: {
        count: clonesData.count,
        uniques: clonesData.uniques,
        daily: clonesData.cloneDays.map((day) => ({
          timestamp: (day.timestamp as string) || "",
          count: (day.count as number) || 0,
          uniques: (day.uniques as number) || 0,
        })),
      },
    };
  } catch {
    // بيانات حركة المرور تتطلب صلاحيات خاصة - لا نرمي خطأ
    return null;
  }
}

// ==================== الدوال الرئيسية ====================

/**
 * جلب رؤى شاملة عن المستودع
 * يجمع بيانات حركة المرور والمساهمين وتوزيع اللغات في استدعاء واحد
 * @param owner - مالك المستودع
 * @param repo - اسم المستودع
 * @returns رؤى المستودع الشاملة
 * @throws خطأ إذا فشل جلب البيانات الأساسية
 */
export async function getRepoInsights(
  owner: string,
  repo: string
): Promise<RepoInsights> {
  // جلب البيانات بالتوازي لتحسين الأداء
  const [traffic, contributors, languages] = await Promise.all([
    fetchRepoTraffic(owner, repo).catch(() => null),
    getContributors(owner, repo).catch(() => []),
    getLanguageBreakdown(owner, repo).catch(() => []),
  ]);

  // تحديد اللغة السائدة
  const primaryLanguage = languages.length > 0 ? languages[0].language : null;

  // بناء كائن الرؤى الشاملة
  return {
    repository: repo,
    owner,
    traffic: traffic || undefined,
    contributors,
    languages,
    metadata: {
      totalContributors: contributors.length,
      totalLanguages: languages.length,
      primaryLanguage,
      fetchedAt: new Date().toISOString(),
    },
  };
}

/**
 * جلب قائمة المساهمين في المستودع
 * يسترجع معلومات عن كل مساهم مع عدد المساهمات
 * @param owner - مالك المستودع
 * @param repo - اسم المستودع
 * @returns قائمة المساهمين مرتبة حسب عدد المساهمات
 * @throws خطأ إذا فشل جلب البيانات
 */
export async function getContributors(
  owner: string,
  repo: string
): Promise<ContributorInfo[]> {
  try {
    // إرسال طلب جلب المساهمين
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=100`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `فشل جلب المساهمين (الحالة: ${response.status}): ${errorText}`
      );
    }

    // تحليل الاستجابة
    const data = (await response.json()) as Array<Record<string, unknown>>;

    // تحويل البيانات إلى كائنات ContributorInfo
    return data.map((contributor) => ({
      id: (contributor.id as number) || 0,
      login: (contributor.login as string) || "",
      avatarUrl: (contributor.avatar_url as string) || "",
      htmlUrl: (contributor.html_url as string) || "",
      contributions: (contributor.contributions as number) || 0,
      isMember: (contributor.type as string) === "User",
    }));
  } catch (error) {
    // إعادة رمي الخطأ مع رسالة واضحة
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("خطأ غير معروف أثناء جلب المساهمين");
  }
}

/**
 * جلب توزيع لغات البرمجة في المستودع
 * يسترجع نسبة كل لغة مع عدد البايتات واللون
 * @param owner - مالك المستودع
 * @param repo - اسم المستودع
 * @returns قائمة اللغات مرتبة حسب النسبة المئوية تنازلياً
 * @throws خطأ إذا فشل جلب البيانات
 */
export async function getLanguageBreakdown(
  owner: string,
  repo: string
): Promise<LanguagePercentage[]> {
  try {
    // إرسال طلب جلب اللغات
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    // التحقق من نجاح الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `فشل جلب اللغات (الحالة: ${response.status}): ${errorText}`
      );
    }

    // تحليل الاستجابة - الرد كائن { "Language": bytes }
    const data = (await response.json()) as Record<string, number>;

    // حساب إجمالي البايتات
    const totalBytes = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);

    // تحويل الكائن إلى مصفوفة مع حساب النسب المئوية
    const languages: LanguagePercentage[] = Object.entries(data).map(
      ([language, bytes]) => ({
        language,
        bytes,
        percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
        color: LANGUAGE_COLORS[language],
      })
    );

    // ترتيب اللغات حسب النسبة المئوية تنازلياً
    languages.sort((a, b) => b.percentage - a.percentage);

    return languages;
  } catch (error) {
    // إعادة رمي الخطأ مع رسالة واضحة
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("خطأ غير معروف أثناء جلب توزيع اللغات");
  }
}
