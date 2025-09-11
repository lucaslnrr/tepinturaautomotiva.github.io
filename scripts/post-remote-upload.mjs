import fs from 'fs/promises';
import path from 'path';

async function main() {
  const fileArg = process.argv[2] || 'orcamento.pdf';
  const origin = (process.argv[3] || 'http://localhost:3000').replace(/\/$/, '');
  const filePath = path.resolve(process.cwd(), fileArg);
  const buf = await fs.readFile(filePath);
  const base64 = buf.toString('base64');
  const fileName = path.basename(filePath);

  const endpoint = `${origin}/api/whatsapp/upload`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, pdfBase64: base64 })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

main().catch((e) => { console.error(e); process.exit(1); });

