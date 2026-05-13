import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    const eventType = request.headers.get('x-github-event') || 'unknown';

    // التحقق من توقيع Webhook
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret) {
      const expectedSignature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'توقيع غير صالح' }, { status: 401 });
      }
    }

    // تسجيل الحدث
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }

    console.log(`GitHub Webhook: ${eventType}`, {
      repository: payload.repository?.full_name,
      sender: payload.sender?.login,
      action: payload.action,
    });

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
