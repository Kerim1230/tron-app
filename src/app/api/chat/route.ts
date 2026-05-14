import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── إعدادات OpenRouter ───────────────────────────────────────────────────────

/** نقطة نهاية OpenRouter API */
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/** النموذج الافتراضي - DeepSeek مجاني */
const DEFAULT_MODEL = 'deepseek/deepseek-chat-v3-0324:free';

/** رسالة النظام الافتراضية */
const SYSTEM_PROMPT = `أنت مساعد ذكي لمتصفح TRON Σ. أجب بالعربية بشكل أساسي، لكن يمكنك الإجابة بالإنجليزية إذا طلب المستخدم ذلك.

قدراتك:
- 🔍 شرح المفاهيم وتوضيح الأفكار المعقدة
- 🌐 ترجمة النصوص بين مختلف اللغات
- 💻 كتابة الأكواد بلغات برمجة متعددة
- 🔧 حل المشكلات التقنية والبرمجية
- 📊 تحليل البيانات وتقديم الرؤى
- ✍️ كتابة وتحرير المحتوى

أجب بوضوح وتنظيم. استخدم التنسيق Markdown عند الحاجة. كن مختصراً لكن شاملاً.`;

/**
 * الحصول على مفتاح OpenRouter من متغيرات البيئة
 * يبحث في OPENROUTER_KEYS (دعم مفاتيح متعددة مفصولة بفاصلة)
 */
function getOpenRouterKey(): string | null {
  const keys = process.env.OPENROUTER_KEYS;
  if (!keys) return null;

  // دعم مفاتيح متعددة مفصولة بفاصلة - اختيار عشوائي للتوزيع
  const keyList = keys.split(',').map(k => k.trim()).filter(Boolean);
  if (keyList.length === 0) return null;

  return keyList[Math.floor(Math.random() * keyList.length)];
}

// ─── معالج POST الرئيسي ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, model, history } = body;

    // التحقق من وجود الرسالة
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      );
    }

    // تحديد النموذج المستخدم
    const usedModel = model || DEFAULT_MODEL;

    // بناء سجل المحادثة (آخر 10 رسائل)
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // إضافة سجل المحادثة السابق إن وجد
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // إضافة الرسالة الحالية
    messages.push({ role: 'user', content: message });

    // ─── محاولة 1: OpenRouter ──────────────────────────────────────────────
    const openRouterKey = getOpenRouterKey();
    if (openRouterKey) {
      try {
        const response = await fetch(OPENROUTER_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://tron-sigma.vercel.app',
            'X-Title': 'TRON Σ Smart Browser',
          },
          body: JSON.stringify({
            model: usedModel,
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content || 'لا يوجد رد من النموذج';

          // حفظ في قاعدة البيانات (غير حاظر)
          try {
            await db.aiConversation.create({
              data: {
                title: message.slice(0, 50),
                model: usedModel,
                messages: {
                  create: [
                    { role: 'user', content: message },
                    { role: 'assistant', content: aiResponse },
                  ],
                },
              },
            });
          } catch {
            // فشل حفظ DB غير حرج
          }

          return NextResponse.json({
            response: aiResponse,
            model: usedModel,
            provider: 'openrouter',
            usage: data.usage,
          });
        }

        // فشل OpenRouter - تسجيل الخطأ
        const errorText = await response.text();
        console.error(`OpenRouter فشل (${response.status}):`, errorText);
      } catch (err) {
        console.error('OpenRouter خطأ اتصال:', err);
      }
    }

    // ─── محاولة 2: GitHub Models API (احتياطي) ────────────────────────────
    const githubToken = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;
    if (githubToken) {
      try {
        const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content || 'لا يوجد رد';

          // حفظ في قاعدة البيانات
          try {
            await db.aiConversation.create({
              data: {
                title: message.slice(0, 50),
                model: 'gpt-4o-mini',
                messages: {
                  create: [
                    { role: 'user', content: message },
                    { role: 'assistant', content: aiResponse },
                  ],
                },
              },
            });
          } catch {
            // فشل حفظ DB غير حرج
          }

          return NextResponse.json({
            response: aiResponse,
            model: 'gpt-4o-mini',
            provider: 'github-models',
            usage: data.usage,
          });
        }

        const errorText = await response.text();
        console.error(`GitHub Models فشل (${response.status}):`, errorText);
      } catch (err) {
        console.error('GitHub Models خطأ اتصال:', err);
      }
    }

    // ─── فشل كل المحاولات ─────────────────────────────────────────────────
    const errorMessage = !openRouterKey && !githubToken
      ? 'فشل الاتصال بالنموذج: لا توجد مفاتيح API متاحة. يرجى تعيين OPENROUTER_KEYS أو GITHUB_MODELS_TOKEN في متغيرات البيئة.'
      : 'فشل الاتصال بجميع النماذج المتاحة (OpenRouter و GitHub Models). يرجى المحاولة مرة أخرى لاحقاً.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 503 }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ داخلي في معالجة الطلب' },
      { status: 500 }
    );
  }
}
