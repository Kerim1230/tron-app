import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/bookmarks — list all bookmarks
export async function GET() {
  const bookmarks = await db.bookmark.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bookmarks);
}

// POST /api/bookmarks — create a new bookmark
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, folder, favicon } = body;

    if (!url || !title) {
      return NextResponse.json(
        { error: 'url and title are required' },
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}
