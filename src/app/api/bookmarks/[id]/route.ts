import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/bookmarks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.bookmark.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Bookmark not found' },
      { status: 404 }
    );
  }
}
