import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req, { params }){
  try{
    const code = String(params?.code || '').trim();
    if(!code) return NextResponse.json({ error:'missing_code' }, { status:400 });
    const key = `short/${code}.json`;
    const { blobs } = await list({ prefix: key, token: process.env.BLOB_READ_WRITE_TOKEN });
    const hit = blobs.find(b => b.pathname === key || b.pathname.endsWith('/'+key));
    if(!hit?.url) return NextResponse.json({ error:'not_found' }, { status:404 });
    const res = await fetch(hit.url, { cache: 'no-store' });
    if(!res.ok) return NextResponse.json({ error:'not_found' }, { status:404 });
    const json = await res.json().catch(()=>null);
    const target = json?.url;
    if(!target) return NextResponse.json({ error:'invalid_mapping' }, { status:404 });
    return NextResponse.redirect(target, { status: 302 });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}

