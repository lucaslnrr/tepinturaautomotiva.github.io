import { NextResponse } from 'next/server';
import { readModelsFromBlob, writeModelsToBlob } from '@/lib/blob-services';

export async function GET(req){
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const brand = (searchParams.get('brand') || '').trim().toLowerCase();
  try{
    const list = await readModelsFromBlob();
    let filtered = list;
    if (brand) {
      filtered = filtered.filter((x) => {
        const xb = String(x.brand || '').toLowerCase();
        const xn = String(x.name || '').toLowerCase();
        if (xb) return xb === brand;
        // Fallback support if items were stored as full name like "Chevrolet Onix"
        return xn.startsWith(brand + ' ');
      });
    }
    if (q) {
      filtered = filtered.filter((x) => String(x.name || '').toLowerCase().includes(q));
    }
    const items = filtered.slice(0, 15);
    return NextResponse.json({ items });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}

export async function POST(req){
  try{
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const brand = String(body?.brand || '').trim();
    if(!name) return NextResponse.json({ error:'name_required' }, { status:400 });
    const list = await readModelsFromBlob();
    const idx = list.findIndex(x => (String(x.name||'').toLowerCase() === name.toLowerCase()) && (String(x.brand||'').toLowerCase() === brand.toLowerCase()));
    const rec = brand ? { name, brand } : { name };
    if(idx >= 0) list[idx] = rec; else list.push(rec);
    await writeModelsToBlob(list);
    return NextResponse.json({ item: rec });
  }catch(e){
    return NextResponse.json({ error:'failed', message:String(e) }, { status:500 });
  }
}
