import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'حقل description مطلوب' }, { status: 400 });
    }

    // توليد تكوين Spark من الوصف
    const config = {
      name: `tron-spark-${Date.now()}`,
      description,
      framework: 'next.js',
      components: ['layout', 'header', 'content', 'footer'],
      styling: 'tailwind-css-tron-theme',
      language: 'arabic-rtl',
    };

    const preview = `🔥 Spark App: "${description}"\n\nسيتم إنشاء تطبيق كامل يتضمن:\n- واجهة مستخدم RTL عربية\n- ثيم TRON السيبراني\n- استجابة كاملة للجوال\n- تكامل مع GitHub Models API`;

    const instructions = `## تعليمات الإعداد\n\n1. انسخ التكوين إلى مشروع جديد\n2. شغّل \`npm install\`\n3. أضف متغيرات البيئة المطلوبة\n4. شغّل \`npm run dev\`\n\n💡 يمكنك تعديل التكوين حسب حاجتك.`;

    return NextResponse.json({ config, preview, instructions });
  } catch (error) {
    console.error('Spark error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
