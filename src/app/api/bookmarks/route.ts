import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/bookmarks — جلب جميع الإشارات المرجعية
export async function GET() {
  try {
    const bookmarks = await db.bookmark.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشارات المرجعية' },
      { status: 500 }
    );
  }
}

// POST /api/bookmarks — إنشاء إشارة مرجعية جديدة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, folder, favicon } = body;

    if (!url || !title) {
      return NextResponse.json(
        { error: 'url و title مطلوبان' },
        { status: 400 }
      );
    }

    const bookmark = await db.bookmark.create({
      data: {
        url,
        title,
        folder: folder || 'عام',
        favicon: favicon || '',
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error('Create bookmark error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الإشارة المرجعية' },
      { status: 500 }
    );
  }
}
