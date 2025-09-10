import { NextResponse } from 'next/server';
import { readBrandsFromBlob, writeBrandsToBlob } from '@/lib/blob-services';

export async function GET(req){
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  try{
    const list = await readBrandsFromBlob();
    const items = q ? list.filter(x => (x.name||'').toLowerCase().includes(q)).slice(0, 15) : list.slice(0, 15);
    return NextResponse.json({ items });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}

export async function POST(req){
  try{
    const body = await req.json();
    const name = String(body?.name || '').trim();
    if(!name) return NextResponse.json({ error:'name_required' }, { status:400 });
    const list = await readBrandsFromBlob();
    const idx = list.findIndex(x => (x.name||'').toLowerCase() === name.toLowerCase());
    const rec = { name };
    if(idx >= 0) list[idx] = rec; else list.push(rec);
    await writeBrandsToBlob(list);
    return NextResponse.json({ item: rec });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}

