import fs from 'fs/promises';

async function main() {
  const origin = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
  const path = 'public/tepinturalogo.png';
  const buf = await fs.readFile(path);
  console.log('Payload bytes:', buf.length);
  const base64 = buf.toString('base64');
  console.log('Base64 length:', base64.length);
  const res = await fetch(`${origin}/api/whatsapp/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: 'big.pdf', pdfBase64: base64 })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text.slice(0, 2000));
}

main().catch((e)=>{ console.error(e); process.exit(1); });

