import { NextRequest, NextResponse } from 'next/server';

// نماذج GitHub AI المجانية
const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'نموذج متقدم من OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'نموذج سريع واقتصادي' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', description: 'نموذج استدلالي متقدم' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: 'نموذج مفتوح المصدر من Meta' },
  { id: 'mistral-large', name: 'Mistral Large', description: 'نموذج كبير من Mistral AI' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'حقل prompt مطلوب' }, { status: 400 });
    }

    const usedModel = model || 'gpt-4o-mini';
    const token = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN;

    // محاولة استدعاء GitHub Models API مباشرة
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
              { role: 'system', content: 'أنت مساعد ذكي. أجب بالعربية.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content || 'لا يوجد رد';
          return NextResponse.json({
            response: aiResponse,
            model: usedModel,
            usage: data.usage,
          });
        }
      } catch {
        // فشل الاتصال - استخدام المحاكاة
      }
    }

    // رد محاكاة
    const simulatedResponse = `🤖 نموذج ${usedModel} (محاكاة)\n\nتم استلام طلبك: "${prompt.slice(0, 80)}"\n\n💡 لتشغيل النماذج الحقيقية، أضف GITHUB_MODELS_TOKEN إلى متغيرات البيئة.`;

    return NextResponse.json({
      response: simulatedResponse,
      model: usedModel,
      simulated: true,
      availableModels: AVAILABLE_MODELS,
    });
  } catch (error) {
    console.error('GitHub Models error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// GET: قائمة النماذج المتاحة
export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
