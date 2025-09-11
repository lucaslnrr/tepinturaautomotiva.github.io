import { NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function genCode(len = 6){
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let s = '';
  for(let i=0;i<len;i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
  return s;
}

export async function POST(req){
  try{
    const body = await req.json();
    const target = String(body?.target || '').trim();
    let code = String(body?.code || '').trim();
    if(!target) return NextResponse.json({ error:'missing_target' }, { status:400 });

    // Generate a code if not provided
    if(!code) code = genCode(7);

    // Write mapping to Blob as public JSON
    const key = `short/${code}.json`;
    await put(key, JSON.stringify({ url: target }), {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Build short URL based on current origin
    const u = new URL(req.url);
    const shortUrl = `${u.origin}/s/${encodeURIComponent(code)}`;
    return NextResponse.json({ ok:true, code, shortUrl });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}

