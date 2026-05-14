import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

function getHeaders(token?: string) {
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TRON-Sigma-App',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gistId = searchParams.get('gistId');
    const token = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    if (!gistId) {
      return NextResponse.json({ error: 'gistId مطلوب' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: 'مفتاح GitHub غير متوفر. أضف GITHUB_MODELS_TOKEN أو GIT_TOKEN إلى متغيرات البيئة.' }, { status: 401 });
    }

    const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      headers: getHeaders(token),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Gist GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, filename, description } = body;
    const token = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json({ error: 'مفتاح GitHub غير متوفر. أضف GITHUB_MODELS_TOKEN أو GIT_TOKEN إلى متغيرات البيئة.' }, { status: 401 });
    }

    const response = await fetch(`${GITHUB_API}/gists`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        description: description || `TRON Gist - ${filename}`,
        public: false,
        files: { [filename || 'tron-note.txt']: { content } },
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Gist POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { gistId, content, filename } = body;
    const token = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    if (!gistId || !token) {
      return NextResponse.json({ error: 'gistId ومفتاح GitHub مطلوبان' }, { status: 400 });
    }

    const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({
        files: { [filename || 'tron-note.txt']: { content } },
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Gist PUT error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gistId = searchParams.get('gistId');
    const token = process.env.GITHUB_MODELS_TOKEN || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    if (!gistId || !token) {
      return NextResponse.json({ error: 'gistId ومفتاح GitHub مطلوبان' }, { status: 400 });
    }

    const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });

    return NextResponse.json({ deleted: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Gist DELETE error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
