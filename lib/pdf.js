'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function buildPdf(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 8;

  // Header band
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setTextColor(250, 204, 21);
  doc.setFontSize(14);
  doc.text('TE PINTURA AUTOMOTIVA', margin, 13);
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.text('Pintura automotiva - Funilaria - Reparos - Vitrificacao', margin, 18);
  if (data.company?.contacts) {
    const contacts = String(data.company.contacts || '').replace(/\u0007/g, ' - ');
    doc.text(contacts, pageW - margin, 18, { align: 'right' });
  }

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
  doc.text(`Placa: ${v.placa || ''}   Chassi: ${v.chassi || ''}`, margin + 3, topCar + 6);
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
    head: [['#', 'Descricao do Servico/Peca', 'Valor']],
    body,
    styles: { fontSize: 9, cellPadding: 1.6, valign: 'middle' },
    headStyles: { fillColor: [243, 244, 246], textColor: 0 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
    },
  });

  // Totals
  let y = doc.lastAutoTable.finalY || topCar + 16;
  const subtotal = (data.items || []).reduce((acc, it) => acc + parseBR(it.unit || 0), 0);
  const desconto = parseBR(data.totals?.discount || 0);
  const acrescimo = parseBR(data.totals?.addition || 0);
  const total = Math.max(0, subtotal - desconto + acrescimo);

  y += 4;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${brl(subtotal)}`, pageW - margin, y, { align: 'right' });
  doc.text(`Desconto: ${brl(desconto)}`, pageW - margin, y + 6, { align: 'right' });
  doc.text(`Acrescimo: ${brl(acrescimo)}`, pageW - margin, y + 12, { align: 'right' });
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL: ${brl(total)}`, pageW - margin, y + 18, { align: 'right' });
  doc.setFont(undefined, 'normal');

  // Observations
  y += 26;
  doc.setFontSize(9);
  doc.text('Observacoes:', margin, y);
  const obs = data.meta?.obs || '';
  const lines = doc.splitTextToSize(obs, pageW - margin * 2);
  doc.text(lines, margin, y + 5);

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

