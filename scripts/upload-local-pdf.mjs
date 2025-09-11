import { put } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

async function loadEnvToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  // Try to read from .env.local or .env without adding dependencies
  for (const fname of ['.env.local', '.env']) {
    try {
      const txt = await fs.readFile(path.resolve(process.cwd(), fname), 'utf8');
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*BLOB_READ_WRITE_TOKEN\s*=\s*(.+)\s*$/);
        if (m) {
          const val = m[1].trim().replace(/^['"]|['"]$/g, '');
          process.env.BLOB_READ_WRITE_TOKEN = val;
          return val;
        }
      }
    } catch {}
  }
  return undefined;
}

function safeName(name) {
  return String(name || 'orcamento.pdf').replace(/[^A-Za-z0-9_.-]/g, '_');
}

async function main() {
  const fileArg = process.argv[2] || 'orcamento.pdf';
  const desiredName = process.argv[3] || path.basename(fileArg);
  const token = await loadEnvToken();
  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN not set. Add it to .env.local or env.');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  const buf = await fs.readFile(filePath);
  const key = `quotes/${Date.now()}-${safeName(desiredName)}`;

  const { url } = await put(key, buf, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: false,
    token,
  });

  console.log('Uploaded to:', url);
}

main().catch((e) => { console.error(e); process.exit(1); });

