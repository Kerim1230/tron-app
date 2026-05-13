import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || process.env.GIT_TOKEN || process.env.GITHUB_TOKEN;

    if (!token) {
      // إشعارات محاكاة
      return NextResponse.json({
        notifications: [
          { id: '1', type: 'issue', repository: 'Kerim1230/tron-app', subject: 'طلب ميزة: إضافة شاشة GitHub', reason: 'author', updated: new Date().toISOString(), unread: true },
          { id: '2', type: 'pr', repository: 'Kerim1230/tron-app', subject: 'دمج: تحديث واجهة المستخدم', reason: 'review_requested', updated: new Date(Date.now() - 3600000).toISOString(), unread: true },
          { id: '3', type: 'workflow', repository: 'Kerim1230/tron-app', subject: 'نجاح: TRON Skills Cron', reason: 'subscribed', updated: new Date(Date.now() - 7200000).toISOString(), unread: false },
        ],
        simulated: true,
      });
    }

    const response = await fetch('https://api.github.com/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TRON-Sigma-App',
      },
    });

    const data = await response.json();
    return NextResponse.json({ notifications: data });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
