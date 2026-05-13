import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/history — list all history items
export async function GET() {
  const history = await db.history.findMany({
    orderBy: { visitedAt: 'desc' },
  });
  return NextResponse.json(history);
}

// POST /api/history — create a history entry (used when visiting a URL)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title } = body;

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const entry = await db.history.create({
      data: {
        url,
        title: title || url,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create history entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/history — delete one item or clear all
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
        { error: 'id is required when not clearing all' },
        { status: 400 }
      );
    }

    await db.history.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'History item not found' },
      { status: 404 }
    );
  }
}
