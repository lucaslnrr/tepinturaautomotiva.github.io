import { list, put } from '@vercel/blob';
import { DEFAULT_SERVICES } from '@/lib/services-default';
import { DEFAULT_BRANDS, DEFAULT_MODELS, DEFAULT_COLORS } from '@/lib/cars-default';
import { DEFAULT_PAYMENTS } from '@/lib/payments-default';

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

// Brands
const BRANDS_KEY = 'cars/brands.json';
export async function readBrandsFromBlob(){
  try{
    const { blobs } = await list({ prefix: BRANDS_KEY });
    const hit = blobs.find(b => b.pathname === BRANDS_KEY || b.pathname.endsWith('/'+BRANDS_KEY));
    if(hit?.url){
      const res = await fetch(hit.url, { cache: 'no-store' });
      if(res.ok){ const json = await res.json(); if(Array.isArray(json)) return json; }
    }
    await put(BRANDS_KEY, JSON.stringify(DEFAULT_BRANDS, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
    return DEFAULT_BRANDS;
  }catch(_){ return DEFAULT_BRANDS; }
}
export async function writeBrandsToBlob(listData){
  const data = Array.isArray(listData) ? listData : DEFAULT_BRANDS;
  await put(BRANDS_KEY, JSON.stringify(data, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
  return data;
}

// Models
const MODELS_KEY = 'cars/models.json';
export async function readModelsFromBlob(){
  try{
    const { blobs } = await list({ prefix: MODELS_KEY });
    const hit = blobs.find(b => b.pathname === MODELS_KEY || b.pathname.endsWith('/'+MODELS_KEY));
    if(hit?.url){
      const res = await fetch(hit.url, { cache: 'no-store' });
      if(res.ok){ const json = await res.json(); if(Array.isArray(json)) return json; }
    }
    await put(MODELS_KEY, JSON.stringify(DEFAULT_MODELS, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
    return DEFAULT_MODELS;
  }catch(_){ return DEFAULT_MODELS; }
}
export async function writeModelsToBlob(listData){
  const data = Array.isArray(listData) ? listData : DEFAULT_MODELS;
  await put(MODELS_KEY, JSON.stringify(data, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
  return data;
}

// Colors
const COLORS_KEY = 'cars/colors.json';
export async function readColorsFromBlob(){
  try{
    const { blobs } = await list({ prefix: COLORS_KEY });
    const hit = blobs.find(b => b.pathname === COLORS_KEY || b.pathname.endsWith('/'+COLORS_KEY));
    if(hit?.url){
      const res = await fetch(hit.url, { cache: 'no-store' });
      if(res.ok){ const json = await res.json(); if(Array.isArray(json)) return json; }
    }
    await put(COLORS_KEY, JSON.stringify(DEFAULT_COLORS, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
    return DEFAULT_COLORS;
  }catch(_){ return DEFAULT_COLORS; }
}
export async function writeColorsToBlob(listData){
  const data = Array.isArray(listData) ? listData : DEFAULT_COLORS;
  await put(COLORS_KEY, JSON.stringify(data, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
  return data;
}

// Payments
const PAYMENTS_KEY = 'meta/payments.json';
export async function readPaymentsFromBlob(){
  try{
    const { blobs } = await list({ prefix: PAYMENTS_KEY });
    const hit = blobs.find(b => b.pathname === PAYMENTS_KEY || b.pathname.endsWith('/'+PAYMENTS_KEY));
    if(hit?.url){
      const res = await fetch(hit.url, { cache: 'no-store' });
      if(res.ok){ const json = await res.json(); if(Array.isArray(json)) return json; }
    }
    await put(PAYMENTS_KEY, JSON.stringify(DEFAULT_PAYMENTS, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
    return DEFAULT_PAYMENTS;
  }catch(_){ return DEFAULT_PAYMENTS; }
}
export async function writePaymentsToBlob(listData){
  const data = Array.isArray(listData) ? listData : DEFAULT_PAYMENTS;
  await put(PAYMENTS_KEY, JSON.stringify(data, null, 2), { access:'public', contentType:'application/json; charset=utf-8', addRandomSuffix:false });
  return data;
}
