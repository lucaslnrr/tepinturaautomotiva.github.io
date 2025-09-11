import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizePhoneBR(raw){
  const digits = String(raw || '').replace(/\D+/g,'');
  if (!digits) return null;
  if (digits.startsWith('55')) return digits;
  // assume Brazil if no country code
  return '55' + digits;
}

export async function POST(req){
  try{
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if(!token || !phoneNumberId){
      return NextResponse.json({ error:'whatsapp_not_configured' }, { status:501 });
    }

    const body = await req.json();
    const fileName = String(body?.fileName || 'orcamento.pdf').replace(/[^A-Za-z0-9_.-]/g,'_');
    const phoneRaw = body?.phone;
    const phone = normalizePhoneBR(phoneRaw);
    const pdfBase64 = String(body?.pdfBase64 || '');
    if(!phone) return NextResponse.json({ error:'invalid_phone' }, { status:400 });
    if(!pdfBase64) return NextResponse.json({ error:'missing_pdf' }, { status:400 });

    // Decode base64 to Buffer
    const base64 = pdfBase64.includes(',') ? pdfBase64.split(',').pop() : pdfBase64;
    const buffer = Buffer.from(base64, 'base64');

    // Upload to Vercel Blob (public)
    const key = `quotes/${Date.now()}-${fileName}`;
    const { url } = await put(key, buffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Send WhatsApp message with document link
    const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'document',
      document: { link: url, filename: fileName },
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if(!res.ok){
      return NextResponse.json({ error:'whatsapp_error', details: json }, { status: 500 });
    }
    return NextResponse.json({ ok:true, blobUrl: url, whatsapp: json });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}
