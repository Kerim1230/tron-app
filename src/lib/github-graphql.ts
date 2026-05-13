// عميل GitHub GraphQL API
// يستخدم نقطة نهاية GraphQL لاستعلام بيانات المستودعات والمستخدمين
// يوفر استعلامات معدة مسبقاً لإحصائيات المستودعات ونشاط المستخدم

// ==================== الأنواع ====================

/** إحصائيات المستودع */
export interface RepoStats {
  /** اسم المستودع */
  name: string;
  /** مالك المستودع */
  owner: string;
  /** وصف المستودع */
  description: string | null;
  /** عدد النجوم */
  stars: number;
  /** عدد الفروع */
  forks: number;
  /** عدد المشاكل المفتوحة */
  openIssues: number;
  /** عدد طلبات السحب المفتوحة */
  openPullRequests: number;
  /** عدد المراقبين */
  watchers: number;
  /** اللغة الرئيسية */
  primaryLanguage: string | null;
  /** تاريخ الإنشاء */
  createdAt: string;
  /** تاريخ آخر تحديث */
  updatedAt: string;
  /** هل المستودع عام */
  isPublic: boolean;
  /** عنوان المستودع */
  url: string;
}

/** نشاط المستخدم */
export interface UserActivity {
  /** اسم المستخدم */
  username: string;
  /** الاسم المعروض */
  displayName: string | null;
  /** النبذة التعريفية */
  bio: string | null;
  /** الصورة الشخصية */
  avatarUrl: string;
  /** عدد المستودعات العامة */
  publicRepos: number;
  /** عدد متابعي المستخدم */
  followers: number;
  /** عدد الأشخاص الذين يتبعهم */
  following: number;
  /** مساهمات حديثة */
  recentContributions: Array<{
    /** اسم المستودع */
    repository: string;
    /** عدد المساهمات */
    count: number;
  }>;
  /** المستودعات الحديثة */
  recentRepos: Array<{
    /** اسم المستودع */
    name: string;
    /** وصف المستودع */
    description: string | null;
    /** عدد النجوم */
    stars: number;
    /** اللغة الرئيسية */
    language: string | null;
    /** تاريخ آخر تحديث */
    updatedAt: string;
  }>;
}

/** استجابة GraphQL العامة */
export interface GraphQLResponse<T> {
  /** البيانات المطلوبة */
  data: T | null;
  /** أخطاء GraphQL (إن وجدت) */
  errors?: Array<{
    /** رسالة الخطأ */
    message: string;
    /** نوع الخطأ */
    type?: string;
    /** المسار في الاستعلام */
    path?: Array<string | number>;
  }>;
}

// ==================== الثوابت ====================

/** نقطة نهاية GitHub GraphQL API */
const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

/**
 * الحصول على رمز المصادقة من متغيرات البيئة
 * @returns رمز المصادقة أو فارغ إذا لم يكن موجوداً
 */
function getAuthToken(): string | null {
  return process.env.GIT_TOKEN || process.env.GITHUB_TOKEN || null;
}

// ==================== استعلامات GraphQL ====================

/** استعلام إحصائيات المستودع */
const REPO_STATS_QUERY = `
query RepoStats($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    owner {
      login
    }
    description
    stargazerCount
    forkCount
    issues(filterBy: {states: OPEN}) {
      totalCount
    }
    pullRequests(states: OPEN) {
      totalCount
    }
    watchers {
      totalCount
    }
    primaryLanguage {
      name
    }
    createdAt
    updatedAt
    isPrivate
    url
  }
}
`;

/** استعلام نشاط المستخدم */
const USER_ACTIVITY_QUERY = `
query UserActivity($login: String!) {
  user(login: $login) {
    login
    name
    bio
    avatarUrl
    repositories(privacy: PUBLIC, first: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        primaryLanguage {
          name
        }
        updatedAt
      }
    }
    followers {
      totalCount
    }
    following {
      totalCount
    }
    contributionsCollection {
      repositoryContributions(last: 10) {
        nodes {
          repository {
            name
          }
        }
      }
    }
  }
}
`;

// ==================== الدوال المساعدة ====================

/**
 * تنفيذ استعلام GraphQL ضد واجهة GitHub
 * @param query - استعلام GraphQL
 * @param variables - متغيرات الاستعلام
 * @returns استجابة GraphQL مع البيانات أو الأخطاء
 * @throws خطأ إذا لم يتم العثور على رمز المصادقة أو فشل الطلب
 */
async function executeGraphQLQuery<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
  // الحصول على رمز المصادقة
  const token = getAuthToken();
  if (!token) {
    throw new Error(
      "لم يتم العثور على رمز المصادقة. يرجى تعيين GIT_TOKEN أو GITHUB_TOKEN في متغيرات البيئة."
    );
  }

  // إرسال طلب GraphQL
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  // التحقق من نجاح الاستجابة
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `فشل استعلام GraphQL (الحالة: ${response.status}): ${errorText}`
    );
  }

  // تحليل الاستجابة
  const data = await response.json();

  // التحقق من وجود أخطاء GraphQL
  if (data.errors && data.errors.length > 0) {
    const errorMessages = data.errors
      .map((e: { message: string }) => e.message)
      .join(", ");
    throw new Error(`أخطاء GraphQL: ${errorMessages}`);
  }

  return data as GraphQLResponse<T>;
}

// ==================== الدوال الرئيسية ====================

/**
 * استعلام إحصائيات المستودع
 * يسترجع معلومات شاملة عن المستودع مثل النجوم والفروع والمشاكل
 * @param owner - مالك المستودع
 * @param repo - اسم المستودع
 * @returns إحصائيات المستودع المنظمة
 * @throws خطأ إذا فشل الاستعلام أو لم يتم العثور على المستودع
 */
export async function queryRepoStats(
  owner: string,
  repo: string
): Promise<RepoStats> {
  // تنفيذ استعلام GraphQL
  const result = await executeGraphQLQuery<{
    repository: Record<string, unknown>;
  }>(REPO_STATS_QUERY, { owner, name: repo });

  // التحقق من وجود البيانات
  if (!result.data?.repository) {
    throw new Error(
      `لم يتم العثور على المستودع ${owner}/${repo} أو لا توجد صلاحيات للوصول إليه`
    );
  }

  const repository = result.data.repository;

  // بناء كائن الإحصائيات
  return {
    name: (repository.name as string) || repo,
    owner: ((repository.owner as Record<string, unknown>)?.login as string) || owner,
    description: (repository.description as string) || null,
    stars: (repository.stargazerCount as number) || 0,
    forks: (repository.forkCount as number) || 0,
    openIssues:
      ((repository.issues as Record<string, unknown>)?.totalCount as number) || 0,
    openPullRequests:
      ((repository.pullRequests as Record<string, unknown>)?.totalCount as number) || 0,
    watchers:
      ((repository.watchers as Record<string, unknown>)?.totalCount as number) || 0,
    primaryLanguage:
      ((repository.primaryLanguage as Record<string, unknown>)?.name as string) || null,
    createdAt: (repository.createdAt as string) || "",
    updatedAt: (repository.updatedAt as string) || "",
    isPublic: !(repository.isPrivate as boolean),
    url: (repository.url as string) || "",
  };
}

/**
 * استعلام نشاط المستخدم
 * يسترجع معلومات النشاط الحديث للمستخدم والمستودعات والمساهمات
 * @param username - اسم المستخدم على GitHub
 * @returns نشاط المستخدم المنظم
 * @throws خطأ إذا فشل الاستعلام أو لم يتم العثور على المستخدم
 */
export async function queryUserActivity(
  username: string
): Promise<UserActivity> {
  // تنفيذ استعلام GraphQL
  const result = await executeGraphQLQuery<{
    user: Record<string, unknown>;
  }>(USER_ACTIVITY_QUERY, { login: username });

  // التحقق من وجود البيانات
  if (!result.data?.user) {
    throw new Error(
      `لم يتم العثور على المستخدم ${username} أو لا توجد صلاحيات للوصول إليه`
    );
  }

  const user = result.data.user;
  const repos = user.repositories as Record<string, unknown>;
  const repoNodes = (repos?.nodes as Array<Record<string, unknown>>) || [];
  const contributions = user.contributionsCollection as Record<string, unknown>;
  const repoContributions = (
    (contributions?.repositoryContributions as Record<string, unknown>)?.nodes as Array<Record<string, unknown>>
  ) || [];

  // بناء كائن نشاط المستخدم
  return {
    username: (user.login as string) || username,
    displayName: (user.name as string) || null,
    bio: (user.bio as string) || null,
    avatarUrl: (user.avatarUrl as string) || "",
    publicRepos: (repos?.totalCount as number) || 0,
    followers: ((user.followers as Record<string, unknown>)?.totalCount as number) || 0,
    following: ((user.following as Record<string, unknown>)?.totalCount as number) || 0,
    recentContributions: repoContributions.map((contrib) => ({
      repository:
        ((contrib.repository as Record<string, unknown>)?.name as string) || "",
      count: 1,
    })),
    recentRepos: repoNodes.map((repoNode) => ({
      name: (repoNode.name as string) || "",
      description: (repoNode.description as string) || null,
      stars: (repoNode.stargazerCount as number) || 0,
      language:
        ((repoNode.primaryLanguage as Record<string, unknown>)?.name as string) || null,
      updatedAt: (repoNode.updatedAt as string) || "",
    })),
  };
}
