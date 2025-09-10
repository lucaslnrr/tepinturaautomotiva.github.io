import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(req){
  try{
    const body = await req.json();
    const fileName = String(body?.fileName || 'orcamento.pdf').replace(/[^A-Za-z0-9_.-]/g,'_');
    const pdfBase64 = String(body?.pdfBase64 || '');
    if(!pdfBase64) return NextResponse.json({ error:'missing_pdf' }, { status:400 });

    const base64 = pdfBase64.includes(',') ? pdfBase64.split(',').pop() : pdfBase64;
    const buffer = Buffer.from(base64, 'base64');
    const key = `quotes/${Date.now()}-${fileName}`;
    const { url } = await put(key, buffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok:true, url });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}

