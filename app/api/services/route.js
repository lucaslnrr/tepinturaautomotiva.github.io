import { NextResponse } from 'next/server';
import { readServicesFromBlob, writeServicesToBlob } from '@/lib/blob-services';

// Storage is handled exclusively via Vercel Blob (JSON file)

function parsePriceToCents(x) {
  if (x == null || x === '') return null;
  if (typeof x === 'number') return Math.round(x * 100);
  const n = Number(String(x).replace(/\./g, '').replace(',', '.'));
  if (Number.isFinite(n)) return Math.round(n * 100);
  return null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  try {
    const list = await readServicesFromBlob();
    const items = q
      ? list.filter((s) => (s.name || '').toLowerCase().includes(q.toLowerCase())).slice(0, 10)
      : list.slice(0, 10);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: 'failed', message: String(e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const priceCents = parsePriceToCents(body?.price);
    if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
    const list = await readServicesFromBlob();
    const idx = list.findIndex((x) => (x.name || '').toLowerCase() === name.toLowerCase());
    const rec = { name, price: priceCents };
    if (idx >= 0) list[idx] = rec; else list.push(rec);
    await writeServicesToBlob(list);
    return NextResponse.json({ item: rec });
  } catch (e) {
    return NextResponse.json({ error: 'failed', message: String(e) }, { status: 500 });
  }
}
