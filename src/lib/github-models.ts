// واجهة استدعاء نماذج GitHub AI المجانية
// النماذج: gpt-4o, gpt-4o-mini, deepseek-r1, meta/llama-3.3-70b-instruct, mistral-large
// تستخدم نقطة نهاية GitHub Models لاستدعاء نماذج الذكاء الاصطناعي

/** إعدادات استدعاء النموذج */
export interface GitHubModelConfig {
  /** اسم النموذج المراد استخدامه */
  model: string;
  /** درجة الحرارة - تتحكم بعشوائية الاستجابة (0-1) */
  temperature?: number;
  /** الحد الأقصى لعدد الرموز في الاستجابة */
  maxTokens?: number;
  /** أعلى احتمالية للرموز المتاحة (0-1) */
  topP?: number;
}

/** استجابة نموذج GitHub */
export interface GitHubModelResponse {
  /** نص الاستجابة من النموذج */
  content: string;
  /** النموذج المستخدم في الاستدعاء */
  model: string;
  /** عدد الرموز المستخدمة في الطلب */
  promptTokens?: number;
  /** عدد الرموز في الاستجابة */
  completionTokens?: number;
  /** إجمالي الرموز المستخدمة */
  totalTokens?: number;
  /** وقت الاستجابة بالمللي ثانية */
  responseTimeMs?: number;
}

/** قائمة النماذج المدعومة */
export const SUPPORTED_MODELS = {
  GPT4O: "gpt-4o",
  GPT4O_MINI: "gpt-4o-mini",
  DEEPSEEK_R1: "deepseek-r1",
  LLAMA_3_3_70B: "meta/llama-3.3-70b-instruct",
  MISTRAL_LARGE: "mistral-large",
} as const;

/** نوع النموذج المدعوم */
export type SupportedModel = (typeof SUPPORTED_MODELS)[keyof typeof SUPPORTED_MODELS];

/** النموذج الافتراضي */
const DEFAULT_MODEL = SUPPORTED_MODELS.GPT4O_MINI;

/** نقطة نهاية GitHub Models API */
const GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com/chat/completions";

/**
 * الحصول على رمز المصادقة من متغيرات البيئة
 * يبحث أولاً عن GITHUB_MODELS_TOKEN ثم عن GIT_TOKEN ثم عن GITHUB_TOKEN
 * @returns رمز المصادقة أو فارغ إذا لم يكن موجوداً
 */
function getAuthToken(): string | null {
  return (
    process.env.GITHUB_MODELS_TOKEN ||
    process.env.GIT_TOKEN ||
    process.env.GITHUB_TOKEN ||
    null
  );
}

/**
 * استدعاء نموذج GitHub AI
 * يرسل طلب إلى نقطة نهاية GitHub Models ويسترجع الاستجابة
 * @param prompt - النص المرسل للنموذج
 * @param model - اسم النموذج (اختياري، الافتراضي gpt-4o-mini)
 * @param config - إعدادات إضافية للنموذج (اختياري)
 * @returns استجابة النموذج مع البيانات الوصفية
 * @throws خطأ إذا لم يتم العثور على رمز المصادقة أو فشل الطلب
 */
export async function callGitHubModel(
  prompt: string,
  model?: string,
  config?: Partial<GitHubModelConfig>
): Promise<GitHubModelResponse> {
  // تسجيل وقت البدء لحساب مدة الاستجابة
  const startTime = Date.now();

  // الحصول على رمز المصادقة
  const token = getAuthToken();
  if (!token) {
    throw new Error(
      "لم يتم العثور على رمز المصادقة. يرجى تعيين GITHUB_MODELS_TOKEN أو GIT_TOKEN أو GITHUB_TOKEN في متغيرات البيئة."
    );
  }

  // تحديد النموذج المستخدم
  const selectedModel = model || config?.model || DEFAULT_MODEL;

  // بناء هيكل الطلب
  const requestBody = {
    model: selectedModel,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: config?.temperature ?? 0.7,
    max_tokens: config?.maxTokens ?? 1024,
    top_p: config?.topP ?? 1,
  };

  // إرسال الطلب إلى واجهة برمجة التطبيقات
  const response = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  // التحقق من نجاح الاستجابة
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `فشل استدعاء نموذج GitHub (الحالة: ${response.status}): ${errorText}`
    );
  }

  // تحليل الاستجابة
  const data = await response.json();

  // استخراج نص الاستجابة من الاختيارات
  const content =
    data.choices?.[0]?.message?.content ?? "";

  // حساب مدة الاستجابة
  const responseTimeMs = Date.now() - startTime;

  // بناء كائن الاستجابة
  return {
    content,
    model: data.model || selectedModel,
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
    totalTokens: data.usage?.total_tokens,
    responseTimeMs,
  };
}
