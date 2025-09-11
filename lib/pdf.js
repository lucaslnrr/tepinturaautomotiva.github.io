'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** ===== Helpers & palette (JS only, no TS) ===== */
const BRAND = {
  primary: [18, 24, 39],   // #121827
  accent:  [250, 204, 21], // #FACC15
  ink:     [15, 23, 42],
  border:  [224, 224, 224],
  soft:    [246, 247, 251],
};

function brl(v) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
      .format(Number(v || 0));
  } catch {
    return String(v);
  }
}
function parseBR(x) {
  if (typeof x === 'number') return x;
  if (!x) return 0;
  return Number(String(x).replace(/\./g, '').replace(',', '.')) || Number(x) || 0;
}
function pad2(n) { return String(n).padStart(2, '0'); }

async function loadLogoImage() {
  try {
    if (typeof window === 'undefined') return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    return await new Promise((resolve) => {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = '/icons/icon-512.png'; // optimized icon for smaller PDFs
    });
  } catch {
    return null;
  }
}

/**
 * Gera PDF A4 com 2 vias (Cliente/Empresa). Use { duplicate:false } para 1 via.
 * data:
 *  - meta: { type, number, date, validade, seller, pagamento, prazo, status, obs }
 *  - company: { name, tagline, address, contacts, cnpj }
 *  - client: { name, whatsapp, email }
 *  - vehicle: { marca, modelo, ano, cor, placa, km }
 *  - items: [ { desc, unit, qty }, ... ]
 *  - totals: { discount, addition }
 */
export async function buildPdfA4(data, opts = {}) {
  const duplicate = (opts && 'duplicate' in opts) ? !!opts.duplicate : false;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();  // 297
  const margin = 10;

  // Ensure essential company fields exist for header rendering
  try {
    const company = data.company || (data.company = {});
    if (!company.cnpj) company.cnpj = 'CNPJ: 58.469.653/0001-02';
  } catch (_) {}

  // Altura de cada via: metade da página (quando duplicado), com gap para corte.
  const cutGap = 6;
  const slipH = duplicate ? (pageH - (margin * 2) - cutGap) / 2 : (pageH - (margin * 2));

  // No logo: render header with company name only
  const logoImg = null;

  // Via superior
  renderSlip(doc, data, { x: margin, y: margin, w: pageW - margin * 2, h: slipH }, logoImg);

  if (duplicate) {
    // Linha de corte pontilhada
    const cutY = margin + slipH + cutGap / 2;
    if (typeof doc.setLineDash === 'function') {
      doc.setLineDash([1.5, 1.5], 0);
    }
    doc.setDrawColor(170);
    doc.line(margin, cutY, pageW - margin, cutY);
    if (typeof doc.setLineDash === 'function') {
      doc.setLineDash([]);
    }
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('recorte aqui', pageW / 2, cutY - 1.2, { align: 'center' });

    // Via inferior
    renderSlip(
      doc,
      data,
      { x: margin, y: margin + slipH + cutGap, w: pageW - margin * 2, h: slipH },
      logoImg,
      true
    );
  }

  return doc.output('blob');
}

/** Renderiza uma via dentro de (x,y,w,h) */
function renderSlip(doc, data, box, logoImg) {
  const x = box.x, y = box.y, w = box.w, h = box.h;
  const innerPad = 6;
  const lineH = 4; // ritmo vertical consistente
  const docW = doc.internal.pageSize.getWidth();

  // Moldura sutil
  doc.setDrawColor(...BRAND.border);
  doc.roundedRect(x - 1.5, y - 1.5, w + 3, h + 3, 2, 2);

  // ====== HEADER (grid 3 colunas com altura dinâmica) ======
  const leftColW = logoImg ? Math.min(40, Math.max(28, w * 0.16)) : 0;
  const rightColW = Math.min(92, Math.max(80, w * 0.36));
  const midColW = w - leftColW - rightColW - innerPad * 2;

  const meta = data.meta || {};
  const tipo = String(meta.type || 'ORÇAMENTO').toUpperCase();
  const num = String(meta.number || '');

  const companyName = data.company?.name || 'TE PINTURA AUTOMOTIVA';
  const companyTag  = data.company?.tagline || 'Pintura automotiva • Funilaria • Reparos • Vitrificação';
  const rightInfoRaw = [data.company?.address, data.company?.contacts]
    .filter(Boolean)
    .join(' • ')
    .replace(/\u0007/g, ' • ');

  // Prepare text wraps *antes* de desenhar o fundo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const nameLines = doc.splitTextToSize(companyName, midColW);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const tagLines  = doc.splitTextToSize(companyTag, midColW);

  doc.setFontSize(8.6);
  const rightLines = doc.splitTextToSize(rightInfoRaw, rightColW);
  const hadAddress = !!(data.company && data.company.address);
  const addressText = hadAddress
    ? String(data.company.address)
    : String((data.company && data.company.contacts) || '');
  const addrLines  = doc.splitTextToSize(addressText, midColW);

  const logoTargetH = 13.5;
  const logoRatio = (logoImg?.naturalWidth && logoImg?.naturalHeight)
    ? (logoImg.naturalWidth / logoImg.naturalHeight)
    : 3;
  const logoTargetW = logoImg ? Math.min(36, logoTargetH * logoRatio) : 0;

  // calcula a altura mínima do header considerando as colunas
  const cnpjText = (data.company && data.company.cnpj) ? String(data.company.cnpj) : '';
  const contentHeights = [
    // left col (logo)
    logoImg ? logoTargetH + 9 : 18,
    // mid col (name + tag)
    6 + nameLines.length * (lineH + 1) + tagLines.length * (lineH - 0.2) + (cnpjText ? (lineH - 0.2) : 0) + (addrLines.length ? addrLines.length * (lineH - 0.2) : 0) + 6,
    // right col (info)
    6 + rightLines.length * (lineH - 0.2) + 8
  ];
  const badgeH = 14 + 9; // badge height + spacing buffer
  const headerH = Math.max(26, Math.max(...contentHeights), badgeH);

  // Fundo do header
  doc.setFillColor(...BRAND.primary);
  doc.rect(x, y, w, headerH, 'F');

  // ---- Left: logo
  let cursorY = y + 5.5;
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', x + innerPad, cursorY, logoTargetW, logoTargetH, undefined, 'FAST');
  }

  // ---- Middle: name + tagline
  const midX = x + innerPad + leftColW;
  let midY = y + 8;
  doc.setTextColor(...BRAND.accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  for (const ln of nameLines) {
    doc.text(ln, midX, midY);
    midY += lineH + 1;
  }

  doc.setTextColor(255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const ln of tagLines) {
    doc.text(ln, midX, midY);
    midY += lineH - 0.2;
  }
  if (cnpjText) {
    doc.setTextColor(255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.text(cnpjText, midX, midY);
    midY += lineH - 0.2;
  }

  // Address under CNPJ in middle column (left-aligned)
  if (addrLines && addrLines.length) {
    doc.setTextColor(255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    for (const ln of addrLines) {
      doc.text(ln, midX, midY, { align: 'left' });
      midY += lineH - 0.2;
    }
  }

  // ---- Right: info + badge
  const rightX = x + w - innerPad - rightColW;
  // Avoid overlapping the badge area on the right side
  let rightY = Math.max(y + 8, y + 6 + 14 + 2);
  doc.setTextColor(255);
  doc.setFontSize(8.6);
  // Only contacts on the right column (address moved under CNPJ)
  {
    const contactsRaw = hadAddress && (data.company && data.company.contacts)
      ? String(data.company.contacts).replace(/\u0007/g, ' \u0007 ')
      : '';
    const rightLinesContacts = doc.splitTextToSize(contactsRaw, rightColW);
    for (const ln of rightLinesContacts) {
      doc.text(ln, rightX + rightColW, rightY, { align: 'right' });
      rightY += lineH - 0.2;
    }
  }

  // Badge (tipo + número)
  const badgeW = 52, badgeHReal = 14;
  const badgeX = x + w - innerPad - badgeW;
  const badgeY = y + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeHReal, 2, 2, 'F');

  doc.setTextColor(...BRAND.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(tipo, badgeX + 3, badgeY + 5);
  doc.setFontSize(12);
  doc.text(num, badgeX + badgeW - 3, badgeY + 11, { align: 'right' });

  // ====== META ======
  const yMeta = y + headerH + 4;
  doc.setDrawColor(...BRAND.border);
  doc.roundedRect(x, yMeta, w, 16, 2, 2);
  doc.setTextColor(...BRAND.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  doc.text(`Data: ${meta.date || ''}`, x + innerPad, yMeta + 6);
  doc.text(`Validade: ${meta.validade || ''} dias`, x + innerPad, yMeta + 12);
  const sellerU = (meta.seller ? String(meta.seller).toUpperCase() : '');
  doc.text(`Atendido por: ${sellerU}`, x + w - innerPad, yMeta + 6, { align: 'right' });

  const status = (meta.status || '').toString().toUpperCase();
  if (status) {
    doc.setTextColor(...BRAND.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${status}`, x + w - innerPad, yMeta + 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.ink);
  }

  // ====== CLIENTE ======
  const yClient = yMeta + 20;
  doc.roundedRect(x, yClient, w, 16, 2, 2);
  const emailNorm = (data.client?.email ? String(data.client.email).toLowerCase() : '');
  const clientNameU = (data.client?.name ? String(data.client.name).toUpperCase() : '');
  doc.text(`Cliente: ${clientNameU}`, x + innerPad, yClient + 6);
  doc.text(`WhatsApp: ${data.client?.whatsapp || ''}`, x + innerPad, yClient + 12);
  doc.text(`E-mail: ${emailNorm}`, x + w / 2, yClient + 12);

  // ====== VEÍCULO (altura dinâmica, com wrap) ======
  let yCar = yClient + 20;
  const v = data.vehicle || {};
  const marcaU = (v.marca ? String(v.marca).toUpperCase() : '');
  const modeloU = (v.modelo ? String(v.modelo).toUpperCase() : '');
  const corU = (v.cor ? String(v.cor).toUpperCase() : '');
  const placaU = (v.placa ? String(v.placa).toUpperCase() : '');
  const vehicleTop = yCar;
  const vehicleLeftW = w - innerPad * 2;

  const vLine1 = `Veículo: ${marcaU} / ${modeloU}   Ano: ${v.ano || ''}   Cor: ${corU}`;
  doc.setFontSize(9.5);
  const vLine1Wrap = doc.splitTextToSize(vLine1, vehicleLeftW);
  let vCursor = vehicleTop + 6;

  // desenha depois de calcular a altura:
  const vBlockExtraRows = 2; // placa/km + pagamento/prazo
  const vBlockH = Math.max(18, 6 + vLine1Wrap.length * (lineH) + vBlockExtraRows * 6 + 4);

  // box
  doc.roundedRect(x, vehicleTop, w, vBlockH, 2, 2);

  // conteúdo
  for (const ln of vLine1Wrap) {
    doc.text(ln, x + innerPad, vCursor);
    vCursor += lineH;
  }
  const yRow2 = vCursor + 2;
  doc.text(`Placa: ${placaU}`, x + innerPad, yRow2);
  doc.text(`KM: ${v.km || ''}`, x + w - innerPad, yRow2, { align: 'right' });

  const yRow3 = yRow2 + 6;
  const pagamentoU = (meta.pagamento ? String(meta.pagamento).toUpperCase() : '');
  doc.text(`Cond. Pagto: ${pagamentoU}`, x + innerPad, yRow3);
  doc.text(`Prazo Execução: ${meta.prazo || ''}`, x + w - innerPad, yRow3, { align: 'right' });

  // ====== ITENS + TOTAIS (lado a lado) ======
  const items = Array.isArray(data.items) ? data.items : [];
  const rows = items.map((it, idx) => {
    const q = Number(it && it.qty != null ? it.qty : 1);
    const unit = parseBR(it && it.unit);
    const tot = Math.max(0, q * unit);
    return [pad2(idx + 1), (it && it.desc) || '', q, brl(unit), brl(tot)];
  });

  const tableStartY = vehicleTop + vBlockH + 6;

  // Larguras: tabela à esquerda, painel de totais à direita
  const sideGap = 4;
  const totalsW = Math.min(86, Math.max(76, w * 0.36));
  const tableW = w - totalsW - sideGap;

  const tableLeft = x;
  const totalsX = x + w - totalsW;

  // Ajuste de margem direita para respeitar a largura do slip
  const rightMarginForTable = Math.max(0, docW - (tableLeft + tableW));

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: tableLeft, right: rightMarginForTable },
    tableWidth: tableW,
    head: [['#', 'Descrição do Serviço/Peça', 'Qtd', 'Unit. (R$)', 'Total (R$)']],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 1.8,
      lineColor: BRAND.border,
      lineWidth: 0.2,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: BRAND.soft,
      textColor: BRAND.ink,
      lineColor: BRAND.border,
      lineWidth: 0.2,
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: tableW - (9 + 12 + 22 + 24) - 2, cellPadding: 1.5 }, // desc ocupa o restante
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' }
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });

  const lastTableY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (tableStartY + 10);

  // Totais (fixo na direita, começa alinhado ao topo da tabela)
  const subtotal = items.reduce((acc, it) => {
    const q = Number(it && it.qty != null ? it.qty : 1);
    const u = parseBR(it && it.unit);
    return acc + q * u;
  }, 0);
  const desconto = parseBR(data.totals && data.totals.discount);
  const acrescimo = parseBR(data.totals && data.totals.addition);
  const total = Math.max(0, subtotal - desconto + acrescimo);

  let yTotals = tableStartY;
  const totalsInnerPad = innerPad;
  const totalsPanelH = 34; // subtotal/desc/acréscimo + barra TOTAL
  doc.setDrawColor(...BRAND.border);
  doc.roundedRect(totalsX, yTotals - 3, totalsW, totalsPanelH, 2, 2);

  doc.setFontSize(9.8);
  doc.setTextColor(...BRAND.ink);
  doc.text(`Subtotal: ${brl(subtotal)}`, totalsX + totalsW - totalsInnerPad, yTotals, { align: 'right' });
  doc.text(`Desconto: ${brl(desconto)}`,  totalsX + totalsW - totalsInnerPad, yTotals + 6, { align: 'right' });
  doc.text(`Acréscimo: ${brl(acrescimo)}`, totalsX + totalsW - totalsInnerPad, yTotals + 12, { align: 'right' });

  // Barra TOTAL
  doc.setFillColor(...BRAND.accent);
  doc.rect(totalsX, yTotals + 18, totalsW, 9.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.2);
  doc.setTextColor(...BRAND.primary);
  doc.text(`TOTAL: ${brl(total)}`, totalsX + totalsW - totalsInnerPad, yTotals + 25.2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.ink);

  // ====== OBSERVAÇÕES ======
  const obsTop = Math.max(lastTableY, yTotals - 3 + totalsPanelH) + 6;
  const safeBottom = y + h - 22;

  doc.setFontSize(9.5);
  doc.text('Observações / Condições:', x, obsTop);

  const obsText = (meta.obs || '').toString().trim() ||
    '• Valores válidos conforme período informado. • Orçamento não configura OS sem aceite formal do cliente. • Serviços sujeitos à análise de peças e estado da pintura.';
  const obsWrap = doc.splitTextToSize(obsText, w);
  doc.setFontSize(8.8);

  let obsCursor = obsTop + 5;
  for (const line of obsWrap) {
    if (obsCursor > safeBottom - 12) break;
    doc.text(line, x, obsCursor);
    obsCursor += 4.2;
  }

  // ====== ASSINATURAS ======
  const ySign = Math.min(y + h - 16, obsCursor + 8);
  doc.setDrawColor(...BRAND.border);
  doc.line(x + 4, ySign, x + w / 2 - 6, ySign);
  doc.text('Assinatura do Cliente', x + 4, ySign + 5);

  doc.line(x + w / 2 + 6, ySign, x + w - 4, ySign);
  doc.text('Visto da Empresa', x + w / 2 + 6, ySign + 5);

  // ====== RODAPÉ ======
  doc.setFontSize(8);
  doc.setTextColor(120);
  const leftFoot = `${tipo} nº ${num} — Validade: ${meta.validade || ''} dias.`;
  doc.text(leftFoot, x, y + h - 5.5);
  const rightFoot = (data.company?.contacts || '').toString().replace(/\u0007/g, ' • ');
  if (rightFoot) doc.text(rightFoot, x + w, y + h - 5.5, { align: 'right' });
}

// Backwards-compatible export expected by the app
export async function buildPdf(data) {
  return buildPdfA4(data, { duplicate: false });
}

export default buildPdf;
