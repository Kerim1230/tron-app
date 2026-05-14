import { NextResponse } from 'next/server';

// بدء عملية المصادقة مع GitHub OAuth
export async function GET(request: Request) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json({
        error: 'GITHUB_CLIENT_ID غير مضبوط. أضفه إلى متغيرات البيئة.',
        authUrl: null,
      }, { status: 500 });
    }

    // توليد حالة عشوائية للحماية من CSRF
    const state = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const redirectUri = `${new URL(request.url).origin}/api/oauth/github`;

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user:email,repo,notifications`;

    // إعادة التوجيه إلى صفحة تفويض GitHub
    return Response.redirect(authUrl);
  } catch (error) {
    console.error('GitHub auth error:', error);
    return NextResponse.json({ error: 'حدث خطأ في المصادقة' }, { status: 500 });
  }
}
