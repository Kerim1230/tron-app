import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const RESPONSES: Record<string, string[]> = {
  'شرح': [
    'بالتأكيد! دعني أشرح لك هذا الموضوع بالتفصيل.\n\n**المفهوم الأساسي** يعتمد على عدة نقاط مهمة:\n\n- **الأساس**: فهم المبادئ الأولية التي يبنى عليها الموضوع\n- **التطبيق**: كيفية استخدام هذه المبادئ في الواقع العملي\n- **الأمثلة**: نماذج توضيحية تساعد في الفهم بشكل أفضل\n\nهل تريد أن أتعمق في جزء معين من هذا الشرح؟',
  ],
  'ترجم': [
    'تمت الترجمة بنجاح! ✅\n\nحرصت على نقل المعنى بدقة مع مراعاة الفروق اللغوية والثقافية بين اللغتين.\n\n💡 يمكنني أيضاً تقديم ترجمات بديلة بأساليب مختلفة.',
  ],
  'كود': [
    'بالتأكيد! إليك الكود المطلوب:\n\n```javascript\n// حل برمجي متكامل\nfunction process(data) {\n  return data\n    .filter(item => item.active)\n    .map(item => ({\n      ...item,\n      processed: true,\n      timestamp: Date.now()\n    }));\n}\n```\n\nهذا الكود يقوم بـ:\n- تصفية البيانات النشطة فقط\n- إضافة علامة معالجة لكل عنصر\n- إضافة طابع زمني\n\nهل تريد تعديل شيء في الكود؟',
  ],
  'حل': [
    'دعني أساعدك في حل هذه المشكلة! 🔧\n\n**تحليل المشكلة:**\n\n1. **تحديد السبب الجذري**: غالباً ما تكون المشكلة ناتجة عن تكوين غير صحيح أو بيانات مفقودة\n\n2. **الحل المقترح**:\n- تأكد من أن جميع المتغيرات معرّفة بشكل صحيح\n- تحقق من الاتصال بالخادم\n- راجع سجلات الأخطاء للحصول على تفاصيل أكثر\n\n3. **خطوات الوقاية**:\n- إضافة معالجة أخطاء مناسبة\n- كتابة اختبارات وحدة\n- مراجعة الكود بشكل دوري\n\nهل تريد تفصيل أكثر؟',
  ],
  default: [
    'مرحباً! 👋 أنا المساعد الذكي لمتصفح TRON. يمكنني مساعدتك في:\n\n- 🔍 **شرح المفاهيم** وتوضيح الأفكار المعقدة\n- 🌐 **ترجمة النصوص** بين مختلف اللغات\n- 💻 **كتابة الأكواد** بلغات برمجة متعددة\n- 🔧 **حل المشكلات** التقنية والبرمجية\n\nكيف يمكنني مساعدتك اليوم؟',
    'شكراً لرسالتك! 😊 أنا هنا لمساعدتك.\n\nيمكنني تقديم المساعدة في عدة مجالات. فقط أخبرني بما تحتاجه وسأبذل قصارى جهدي لمساعدتك!',
  ],
};

function getResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('شرح') || lower.includes('اشرح')) return RESPONSES['شرح'][0];
  if (lower.includes('ترجم')) return RESPONSES['ترجم'][0];
  if (lower.includes('كود') || lower.includes('اكتب')) return RESPONSES['كود'][0];
  if (lower.includes('حل') || lower.includes('مشكل')) return RESPONSES['حل'][0];
  const arr = RESPONSES.default;
  return arr[Math.floor(Math.random() * arr.length)];
}

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

    const response = getResponse(message);

    // Save to database (non-blocking)
    try {
      await db.aiConversation.create({
        data: {
          title: message.slice(0, 50),
          model: model || 'default',
          messages: {
            create: [
              { role: 'user', content: message },
              { role: 'assistant', content: response },
            ],
          },
        },
      });
    } catch {
      // DB save failure is non-critical
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}
