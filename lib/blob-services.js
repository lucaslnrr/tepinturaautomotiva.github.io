import { list, put } from '@vercel/blob';
import { DEFAULT_SERVICES } from '@/lib/services-default';

const BLOB_KEY = 'services/services.json';

export async function readServicesFromBlob() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    const hit = blobs.find((b) => b.pathname === BLOB_KEY || b.pathname.endsWith('/' + BLOB_KEY));
    if (hit && hit.url) {
      const res = await fetch(hit.url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json;
        if (json && Array.isArray(json.items)) return json.items;
      }
    }
    // Seed if not present
    await safeWriteServicesToBlob(DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
  } catch (_e) {
    return DEFAULT_SERVICES;
  }
}

export async function writeServicesToBlob(listData) {
  const data = Array.isArray(listData) ? listData : DEFAULT_SERVICES;
  await put(BLOB_KEY, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
  });
  return data;
}

async function safeWriteServicesToBlob(data){
  try { await writeServicesToBlob(data); } catch (_) {}
}

