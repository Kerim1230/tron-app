// وكيل Copilot الذكي - يستخدم واجهة نماذج GitHub لتقديم المساعدة في التطوير
// يوفر استجابات منظمة مع اقتراحات ومقتطفات برمجية
// يعمل كمساعد ذكي لمشروع TRON Σ

import { callGitHubModel } from "./github-models";
import type { GitHubModelConfig } from "./github-models";

/** رسالة النظام الافتراضية للوكيل الذكي */
const COPILOT_SYSTEM_PROMPT =
  "أنت وكيل TRON الذكي. ساعد في التطوير والإصلاح.";

/** نوع الاقتراح */
export type SuggestionType =
  | "code"        // اقتراح برمجي
  | "fix"         // إصلاح خطأ
  | "refactor"    // إعادة هيكلة
  | "explanation" // شرح
  | "best-practice"; // أفضل الممارسات

/** اقتراح من الوكيل الذكي */
export interface CopilotSuggestion {
  /** نوع الاقتراح */
  type: SuggestionType;
  /** عنوان الاقتراح */
  title: string;
  /** تفاصيل الاقتراح */
  description: string;
  /** مقتطف برمجي مقترح (اختياري) */
  code?: string;
  /** مستوى الثقة في الاقتراح (0-1) */
  confidence: number;
}

/** استجابة الوكيل الذكي المنظمة */
export interface CopilotAgentResponse {
  /** الرد الرئيسي من الوكيل */
  answer: string;
  /** قائمة الاقتراحات المستخرجة */
  suggestions: CopilotSuggestion[];
  /** النموذج المستخدم */
  model: string;
  /** مدة الاستجابة بالمللي ثانية */
  responseTimeMs?: number;
  /** إجمالي الرموز المستخدمة */
  totalTokens?: number;
}

/** إعدادات الوكيل الذكي */
export interface CopilotAgentConfig {
  /** رسالة النظام المخصصة */
  systemPrompt?: string;
  /** النموذج المستخدم */
  model?: string;
  /** إعدادات إضافية للنموذج */
  modelConfig?: Partial<GitHubModelConfig>;
}

/**
 * بناء الطلب المنظم للوكيل الذكي
 * يجمع السياق والسؤال في تنسيق موحد
 * @param prompt - سؤال المستخدم
 * @param context - سياق إضافي (اختياري)
 * @param systemPrompt - رسالة النظام (اختياري)
 * @returns النص المنسق للطلب
 */
function buildCopilotPrompt(
  prompt: string,
  context?: string,
  systemPrompt?: string
): string {
  // بناء أجزاء الطلب
  const parts: string[] = [];

  // إضافة رسالة النظام
  const effectiveSystemPrompt = systemPrompt || COPILOT_SYSTEM_PROMPT;
  parts.push(`[تعليمات النظام]: ${effectiveSystemPrompt}`);

  // إضافة السياق إذا كان موجوداً
  if (context && context.trim().length > 0) {
    parts.push(`[السياق]:\n${context}`);
  }

  // إضافة سؤال المستخدم
  parts.push(`[السؤال]: ${prompt}`);

  // إضافة تعليمات تنسيق الاستجابة
  parts.push(
    `[تعليمات التنسيق]: قدّم إجابتك بالتنسيق التالي:
1. إجابة مباشرة على السؤال
2. قائمة بالاقتراحات (إن وجدت) مع تحديد نوع كل اقتراح (code/fix/refactor/explanation/best-practice)
3. مقتطفات برمجية إن لزم الأمر مع تحديد لغة البرمجة`
  );

  return parts.join("\n\n");
}

/**
 * استخراج الاقتراحات من استجابة النموذج
 * يحلل النص للعثور على اقتراحات منظمة
 * @param content - محتوى استجابة النموذج
 * @returns قائمة الاقتراحات المستخرجة
 */
function extractSuggestions(content: string): CopilotSuggestion[] {
  const suggestions: CopilotSuggestion[] = [];

  // أنماط البحث عن الاقتراحات في النص
  const patterns: Array<{
    type: SuggestionType;
    regex: RegExp;
  }> = [
    { type: "fix", regex: /(?:إصلاح|fix|حل)[:：]\s*(.+?)(?=\n\n|\n\d|$)/gis },
    { type: "code", regex: /```(\w+)?\s*\n([\s\S]*?)```/g },
    { type: "refactor", regex: /(?:إعادة هيكلة|refactor|تحسين)[:：]\s*(.+?)(?=\n\n|\n\d|$)/gis },
    { type: "best-practice", regex: /(?:أفضل ممارسة|best practice|نصيحة)[:：]\s*(.+?)(?=\n\n|\n\d|$)/gis },
  ];

  // البحث عن مقتطفات برمجية
  const codeBlocks: Array<{ language: string; code: string }> = [];
  const codePattern = /```(\w+)?\s*\n([\s\S]*?)```/g;
  let codeMatch: RegExpExecArray | null;
  while ((codeMatch = codePattern.exec(content)) !== null) {
    codeBlocks.push({
      language: codeMatch[1] || "text",
      code: codeMatch[2].trim(),
    });
  }

  // إضافة المقتطفات البرمجية كاقتراحات
  for (const block of codeBlocks) {
    suggestions.push({
      type: "code",
      title: `مقتطف ${block.language}`,
      description: `مقتطف برمجي بلغة ${block.language}`,
      code: block.code,
      confidence: 0.9,
    });
  }

  // البحث عن أنماط الاقتراحات الأخرى
  for (const pattern of patterns) {
    if (pattern.type === "code") continue; // تم معالجتها أعلاه
    let match: RegExpExecArray | null;
    const tempRegex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = tempRegex.exec(content)) !== null) {
      const text = match[1] || match[0];
      if (text.trim()) {
        suggestions.push({
          type: pattern.type,
          title: text.trim().split("\n")[0].substring(0, 100),
          description: text.trim(),
          confidence: 0.7,
        });
      }
    }
  }

  // إذا لم يتم العثور على اقتراحات، إنشاء اقتراح عام من المحتوى
  if (suggestions.length === 0 && content.trim().length > 0) {
    suggestions.push({
      type: "explanation",
      title: "استجابة الوكيل الذكي",
      description: content.trim().substring(0, 500),
      confidence: 0.5,
    });
  }

  return suggestions;
}

/**
 * سؤال وكيل Copilot الذكي
 * يرسل سؤالاً مع سياق اختياري ويسترجع استجابة منظمة مع اقتراحات
 * @param prompt - سؤال المستخدم
 * @param context - سياق إضافي مثل كود أو وصف المشكلة (اختياري)
 * @param config - إعدادات الوكيل (اختياري)
 * @returns استجابة منظمة مع إجابة واقتراحات
 * @throws خطأ إذا فشل استدعاء النموذج
 */
export async function askCopilotAgent(
  prompt: string,
  context?: string,
  config?: CopilotAgentConfig
): Promise<CopilotAgentResponse> {
  // بناء الطلب المنسق
  const fullPrompt = buildCopilotPrompt(
    prompt,
    context,
    config?.systemPrompt
  );

  // استدعاء نموذج GitHub
  const modelResponse = await callGitHubModel(
    fullPrompt,
    config?.model,
    config?.modelConfig
  );

  // استخراج الاقتراحات من الاستجابة
  const suggestions = extractSuggestions(modelResponse.content);

  // بناء الاستجابة المنظمة
  return {
    answer: modelResponse.content,
    suggestions,
    model: modelResponse.model,
    responseTimeMs: modelResponse.responseTimeMs,
    totalTokens: modelResponse.totalTokens,
  };
}
