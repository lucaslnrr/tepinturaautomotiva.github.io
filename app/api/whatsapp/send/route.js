import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { phone, url, fileName } = await req.json();
    if (!phone || !url) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) {
      return NextResponse.json({ error: 'missing_token' }, { status: 500 });
    }
    const payload = {
      messaging_product: 'whatsapp',
      to: String(phone),
      type: 'document',
      document: {
        link: String(url),
        filename: fileName || 'document.pdf'
      }
    };
    const apiUrl = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: 'failed', detail: data }, { status: res.status });
    }
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ error: 'failed', message: String(e) }, { status: 500 });
  }
}
