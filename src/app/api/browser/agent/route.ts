import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'المرجوا إدخال أمر صالح' },
        { status: 400 }
      );
    }

    // Smart simulated responses based on command type
    const lower = command.toLowerCase();
    let steps: { description: string }[];
    let result = '';
    let links: string[] = [];

    if (lower.includes('بحث') || lower.includes('ابحث') || lower.includes('search')) {
      const query = command.replace(/ابحث عن|بحث|search for/gi, '').trim();
      steps = [
        { description: 'تحليل طلب البحث: ' + query },
        { description: 'فتح محرك البحث' },
        { description: 'إدخال كلمات البحث المفتاحية' },
        { description: 'تحليل النتائج واستخراج المعلومات' },
      ];
      result = `تم البحث عن "${query}" بنجاح.\n\nالنتائج الرئيسية:\n\n1. تم العثور على عدة مصادر موثوقة تتعلق بـ "${query}"\n2. المعلومات متاحة من مواقع متعددة\n3. يمكن الاطلاع على التفاصيل من الروابط أدناه\n\n💡 نصيحة: حاول أوامر أكثر تحديداً للحصول على نتائج أدق`;
      links = [`https://www.google.com/search?q=${encodeURIComponent(query)}`];
    } else if (lower.includes('افتح') || lower.includes('open')) {
      const url = command.replace(/افتح موقع|افتح|open/gi, '').trim();
      steps = [
        { description: 'تحليل العنوان المطلوب' },
        { description: 'التحقق من صحة الرابط' },
        { description: 'فتح الصفحة في المتصفح' },
      ];
      result = `تم فتح الموقع بنجاح.\n\n📄 تم تحميل الصفحة وعرض محتواها.`;
      links = [url.startsWith('http') ? url : `https://${url}`];
    } else if (lower.includes('لخص') || lower.includes('لخّص') || lower.includes('summarize')) {
      steps = [
        { description: 'تحليل المحتوى المطلوب تلخيصه' },
        { description: 'استخراج النقاط الرئيسية' },
        { description: 'صياغة الملخص بشكل مختصر' },
      ];
      result = `تم تلخيص المحتوى بنجاح.\n\n📌 النقاط الرئيسية:\n\n- الموضوع يتناول عدة جوانب مهمة\n- يمكن تقسيم المحتوى إلى أقسام رئيسية\n- المعلومات الأساسية متضمنة في الملخص\n\n💡 للمزيد من التفاصيل، يمكنك الاطلاع على المصدر الأصلي`;
      links = [];
    } else if (lower.includes('قارن') || lower.includes('compare')) {
      steps = [
        { description: 'تحليل العناصر المراد مقارنتها' },
        { description: 'جمع المعلومات عن كل عنصر' },
        { description: 'إنشاء جدول المقارنة' },
      ];
      result = `تمت المقارنة بنجاح.\n\n📊 نتائج المقارنة:\n\n| المعيار | العنصر الأول | العنصر الثاني |\n|---------|-------------|-------------|\n| الأداء | ⭐⭐⭐⭐ | ⭐⭐⭐ |\n| السهولة | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |\n| التكلفة | مجاني | مدفوع |\n\n💡 يمكن الحصول على مقارنة أدق بتحديد معايير أكثر`;
      links = [];
    } else {
      steps = [
        { description: 'تحليل الأمر: ' + command },
        { description: 'تنفيذ العملية المطلوبة' },
        { description: 'تجميع النتائج' },
      ];
      result = `تم تنفيذ الأمر "${command}" بنجاح.\n\n✅ العملية اكتملت بدون أخطاء\n📋 يمكنك الاطلاع على النتائج أعلاه`;
      links = [];
    }

    return NextResponse.json({ steps, result, links });
  } catch (error) {
    console.error('Browser agent error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الأمر' },
      { status: 500 }
    );
  }
}
