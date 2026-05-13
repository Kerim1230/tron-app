import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/history — جلب جميع سجل التصفح
export async function GET() {
  try {
    const history = await db.history.findMany({
      orderBy: { visitedAt: 'desc' },
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب السجل' },
      { status: 500 }
    );
  }
}

// POST /api/history — إنشاء سجل تصفح جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title } = body;

    if (!url) {
      return NextResponse.json({ error: 'url مطلوب' }, { status: 400 });
    }

    const entry = await db.history.create({
      data: {
        url,
        title: title || url,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Create history error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء سجل التصفح' },
      { status: 500 }
    );
  }
}

// DELETE /api/history — حذف عنصر أو مسح الكل
export async function DELETE(req: NextRequest) {
  try {
    const clearAll = req.nextUrl.searchParams.get('all');

    if (clearAll === 'true') {
      await db.history.deleteMany();
      return NextResponse.json({ success: true, cleared: true });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: 'id مطلوب عند عدم مسح الكل' },
        { status: 400 }
      );
    }

    await db.history.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete history error:', error);
    return NextResponse.json(
      { error: 'لم يتم العثور على عنصر السجل' },
      { status: 404 }
    );
  }
}
