import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ردود محاكاة احتياطية عند فشل الاتصال بالنموذج
const FALLBACK_RESPONSES: Record<string, string[]> = {
  'شرح': [
    'بالتأكيد! دعني أشرح لك هذا الموضوع بالتفصيل.\n\n**المفهوم الأساسي** يعتمد على عدة نقاط مهمة:\n\n- **الأساس**: فهم المبادئ الأولية التي يبنى عليها الموضوع\n- **التطبيق**: كيفية استخدام هذه المبادئ في الواقع العملي\n- **الأمثلة**: نماذج توضيحية تساعد في الفهم بشكل أفضل\n\nهل تريد أن أتعمق في جزء معين من هذا الشرح؟',
  ],
  default: [
    'مرحباً! 👋 أنا المساعد الذكي لمتصفح TRON. يمكنني مساعدتك في:\n\n- 🔍 **شرح المفاهيم** وتوضيح الأفكار المعقدة\n- 🌐 **ترجمة النصوص** بين مختلف اللغات\n- 💻 **كتابة الأكواد** بلغات برمجة متعددة\n- 🔧 **حل المشكلات** التقنية والبرمجية\n\nكيف يمكنني مساعدتك اليوم؟',
    'شكراً لرسالتك! 😊 أنا هنا لمساعدتك.\n\nيمكنني تقديم المساعدة في عدة مجالات. فقط أخبرني بما تحتاجه وسأبذل قصارى جهدي لمساعدتك!',
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, model } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      );
    }

    const usedModel = model || 'gpt-4o-mini';
    const token = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    // محاولة استدعاء GitHub Models API للرد الفعلي
    if (token) {
      try {
        const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: usedModel,
            messages: [
              { role: 'system', content: 'أنت مساعد ذكي لمتصفح TRON. أجب بالعربية. ساعد المستخدم في البحث والترجمة والبرمجة وحل المشكلات.' },
              { role: 'user', content: message },
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content || 'لا يوجد رد';

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
            usage: data.usage,
          });
        }
      } catch {
        // فشل الاتصال - استخدام الردود الاحتياطية
      }
    }

    // رد احتياطي محاكاة
    const lower = message.toLowerCase();
    let fallbackResponse: string;
    if (lower.includes('شرح') || lower.includes('اشرح')) {
      fallbackResponse = FALLBACK_RESPONSES['شرح'][0];
    } else {
      const arr = FALLBACK_RESPONSES.default;
      fallbackResponse = arr[Math.floor(Math.random() * arr.length)];
    }

    // حفظ في قاعدة البيانات (غير حاظر)
    try {
      await db.aiConversation.create({
        data: {
          title: message.slice(0, 50),
          model: usedModel + '-fallback',
          messages: {
            create: [
              { role: 'user', content: message },
              { role: 'assistant', content: fallbackResponse },
            ],
          },
        },
      });
    } catch {
      // فشل حفظ DB غير حرج
    }

    return NextResponse.json({
      response: fallbackResponse,
      model: usedModel,
      fallback: true,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}
