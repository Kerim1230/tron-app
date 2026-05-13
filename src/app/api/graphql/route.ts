import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'حقل query مطلوب' }, { status: 400 });
    }

    const token = process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json({
        error: 'مفتاح GitHub غير متوفر. أضف GIT_TOKEN إلى متغيرات البيئة.',
        simulated: true,
      }, { status: 401 });
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('GraphQL error:', error);
    return NextResponse.json({ error: 'حدث خطأ في استعلام GraphQL' }, { status: 500 });
  }
}
