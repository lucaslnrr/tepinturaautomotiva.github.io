import { jsPDF } from 'jspdf';

async function main() {
  const origin = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Teste de Orçamento', 20, 20);
  const ab = doc.output('arraybuffer');
  const buf = Buffer.from(ab);
  const base64 = buf.toString('base64');
  const fileName = `teste-${Date.now()}.pdf`;
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

