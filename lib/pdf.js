'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

async function loadLogoImage() {
  try {
    if (typeof window === 'undefined') return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    return await new Promise((resolve) => {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = '/tepinturalogo.png';
    });
  } catch (_) { return null; }
}

export async function buildPdf(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 8;

  // Header band
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageW, 20, 'F');
  let titleX = margin;
  const logoImg = await loadLogoImage();
  if (logoImg) {
    const targetH = 12; // mm
    const ratio = logoImg.naturalWidth && logoImg.naturalHeight ? (logoImg.naturalWidth / logoImg.naturalHeight) : (3);
    const targetW = Math.min(34, targetH * ratio);
    doc.addImage(logoImg, 'PNG', margin, 3.5, targetW, targetH, undefined, 'FAST');
    titleX = margin + targetW + 3;
  }
  doc.setTextColor(250, 204, 21);
  doc.setFontSize(14);
  doc.text('TE PINTURA AUTOMOTIVA', titleX, 13);
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.text('Pintura automotiva - Funilaria - Reparos - Vitrificacao', titleX, 18);
  if (data.company?.contacts) {
    const contacts = String(data.company.contacts || '').replace(/\u0007/g, ' - ');
    doc.text(contacts, pageW - margin, 18, { align: 'right' });
  }

  // Number badge on header (top-right)
  const numBoxW = 46;
  const numBoxH = 10;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageW - margin - numBoxW, 4, numBoxW, numBoxH, 2, 2, 'F');
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(9);
  doc.text('No', pageW - margin - numBoxW + 3, 10);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text(String(data.meta.number || ''), pageW - margin - 4, 11, { align: 'right' });
  doc.setFont(undefined, 'normal');

  // Meta box
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.roundedRect(margin, 24, pageW - margin * 2, 18, 2, 2);
  doc.text(`Orcamento No: ${data.meta.number}`, margin + 3, 31);
  doc.text(`Data: ${data.meta.date}`, margin + 3, 37);
  doc.text(`Validade: ${data.meta.validade} dias`, pageW - margin - 3, 31, { align: 'right' });
  doc.text(`Atendido por: ${data.meta.seller || ''}`, pageW - margin - 3, 37, { align: 'right' });

  // Client box
  const topClient = 46;
  doc.roundedRect(margin, topClient - 6, pageW - margin * 2, 18, 2, 2);
  doc.text(`Cliente: ${data.client.name || ''}`, margin + 3, topClient);
  doc.text(`WhatsApp: ${data.client.whatsapp || ''}`, margin + 3, topClient + 6);
  doc.text(`E-mail: ${data.client.email || ''}`, margin + 3, topClient + 12);

  // Vehicle box
  const topCar = topClient + 20;
  doc.roundedRect(margin, topCar - 6, pageW - margin * 2, 18, 2, 2);
  const v = data.vehicle || {};
  doc.text(`Veiculo: ${v.marca || ''} / ${v.modelo || ''}  Ano: ${v.ano || ''}  Cor: ${v.cor || ''}`, margin + 3, topCar);
  doc.text(`Placa: ${v.placa || ''}`, margin + 3, topCar + 6);
  doc.text(`KM: ${v.km || ''}`, pageW - margin - 3, topCar + 6, { align: 'right' });
  doc.text(`Cond. Pagto: ${data.meta.pagamento || ''}`, margin + 3, topCar + 12);
  doc.text(`Prazo Execucao: ${data.meta.prazo || ''}`, pageW - margin - 3, topCar + 12, { align: 'right' });

  // Items table (no quantity; only description + price)
  const body = (data.items || []).map((it, idx) => [
    String(idx + 1).padStart(2, '0'),
    it.desc || '',
    brl(parseBR(it.unit || 0)),
  ]);

  autoTable(doc, {
    startY: topCar + 16,
    margin: { left: margin, right: margin },
    head: [['#', 'Descricao do Servico/Peca', 'Valor (R$)']],
    body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 1.6, valign: 'middle', lineColor: [220,220,220], lineWidth: 0.2 },
    headStyles: { fillColor: [236, 239, 241], textColor: 0, lineWidth: 0.2, lineColor: [200,200,200] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
    },
  });

  // Totals
  let y = doc.lastAutoTable.finalY || topCar + 16;
  const subtotal = (data.items || []).reduce((acc, it) => acc + parseBR(it.unit || 0), 0);
  const desconto = parseBR(data.totals?.discount || 0);
  const acrescimo = parseBR(data.totals?.addition || 0);
  const total = Math.max(0, subtotal - desconto + acrescimo);

  // Totals block
  y += 4;
  const boxW = 62;
  const boxX = pageW - margin - boxW;
  const boxH = 24;
  doc.setDrawColor(220);
  doc.roundedRect(boxX, y - 3, boxW, boxH, 2, 2);
  doc.setFontSize(10);
  doc.text(`Subtotal: ${brl(subtotal)}`, boxX + boxW - 3, y, { align: 'right' });
  doc.text(`Desconto: ${brl(desconto)}`, boxX + boxW - 3, y + 6, { align: 'right' });
  doc.text(`Acrescimo: ${brl(acrescimo)}`, boxX + boxW - 3, y + 12, { align: 'right' });
  // Total highlight bar
  doc.setFillColor(250, 204, 21);
  doc.rect(boxX, y + 14, boxW, 8, 'F');
  doc.setTextColor(17, 24, 39);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL: ${brl(total)}`, boxX + boxW - 3, y + 20, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0);

  // Observations (lined area)
  y += 28;
  doc.setFontSize(9);
  doc.text('Observacoes:', margin, y);
  let oy = y + 3;
  doc.setDrawColor(220);
  doc.setLineWidth(0.2);
  for (let i = 0; i < 5; i++) {
    oy += 6;
    doc.line(margin, oy, pageW - margin, oy);
  }
  // Print initial text on first line if short
  const obs = (data.meta?.obs || '').trim();
  if (obs) {
    const preview = doc.splitTextToSize(obs, pageW - margin * 2)[0] || '';
    doc.text(preview, margin + 1, y + 9);
  }

  // Signatures
  const ySign = 192;
  doc.line(margin + 4, ySign, margin + 60, ySign);
  doc.text('Cliente', margin + 4, ySign + 5);
  doc.line(pageW - margin - 60, ySign, pageW - margin - 4, ySign);
  doc.text('Visto da empresa', pageW - margin - 56, ySign + 5);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Orcamento nao configura ordem de servico. Validade: ${data.meta.validade} dias.`,
    margin,
    202
  );
  const footerRight = `www.seusite.com - @tepintura - ${data.company?.contacts || ''}`.replace(/\u0007/g, ' - ');
  doc.text(footerRight, pageW - margin, 202, { align: 'right' });

  return doc.output('blob');
}

function brl(v) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));
  } catch (e) {
    return String(v);
  }
}

function parseBR(x) {
  if (typeof x === 'number') return x;
  if (!x) return 0;
  return Number(String(x).replace(/\./g, '').replace(',', '.')) || Number(x) || 0;
}
