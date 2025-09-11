import { put } from '@vercel/blob';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs/promises';
import path from 'path';

function normalizeWhatsAppNumberBR(digits) {
  let d = String(digits || '').replace(/\D+/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (d.startsWith('55')) return d;
  if (d.length === 11 || d.length === 10) return '55' + d;
  return d;
}

function brl(n) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
  } catch {
    return String(n);
  }
}

async function loadEnvToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
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

async function generateRandomOrcamentoPdf(params) {
  const {
    orcNumber = `TEST-${Date.now()}`,
    clientName = 'Cliente Teste',
    clientWhats = '',
  } = params || {};

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TE PINTURA AUTOMOTIVA', 10, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Orçamento Nº: ${orcNumber}`, 10, 26);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 10, 32);
  if (clientName) doc.text(`Cliente: ${clientName}`, 10, 38);
  if (clientWhats) doc.text(`WhatsApp: ${clientWhats}`, 10, 44);

  const items = [
    { desc: 'Pintura de para-choque', unit: 350 },
    { desc: 'Polimento capô', unit: 180 },
    { desc: 'Retoque lateral', unit: 220 },
  ];
  const subtotal = items.reduce((a, it) => a + (Number(it.unit) || 0), 0);
  const discount = 50;
  const addition = 0;
  const total = Math.max(0, subtotal - discount + addition);

  doc.autoTable({
    startY: 52,
    head: [['Descrição', 'Preço']].map(r => r.map(h => String(h))),
    body: items.map(it => [it.desc, brl(it.unit)]),
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [18, 24, 39], textColor: 255 },
    columnStyles: { 1: { halign: 'right' } },
    theme: 'grid',
  });

  const afterTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 60;
  doc.setFontSize(11);
  doc.text(`Subtotal: ${brl(subtotal)}`, pageW - 10, afterTableY, { align: 'right' });
  doc.text(`Desconto: ${brl(discount)}`, pageW - 10, afterTableY + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${brl(total)}`, pageW - 10, afterTableY + 12, { align: 'right' });

  // Return Node Buffer
  const ab = doc.output('arraybuffer');
  return Buffer.from(ab);
}

async function main() {
  const rawPhone = process.argv[2] || '';
  const waPhone = normalizeWhatsAppNumberBR(rawPhone);
  const orcNumber = `RND-${Date.now()}`;
  const token = await loadEnvToken();
  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN not set. Add it to .env.local or env.');
    process.exit(1);
  }

  const buf = await generateRandomOrcamentoPdf({ orcNumber, clientName: 'Teste', clientWhats: rawPhone });

  const fileName = `orcamento-TEPintura-${orcNumber}.pdf`;
  const filePath = path.resolve(process.cwd(), fileName);
  await fs.writeFile(filePath, buf);
  console.log('Local PDF generated:', filePath);

  const key = `quotes/${Date.now()}-${safeName(fileName)}`;
  const { url } = await put(key, buf, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: false,
    token,
  });
  console.log('Uploaded to:', url);

  if (waPhone) {
    const msg = `Orçamento TE Pintura Nº ${orcNumber}\n` +
      `Cliente: Teste\n` +
      `PDF: ${url}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(waPhone)}&text=${encodeURIComponent(msg)}`;
    console.log('WhatsApp link:', waUrl);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
