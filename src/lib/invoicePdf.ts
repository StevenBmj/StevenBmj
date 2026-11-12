import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { invoiceModel } from './invoice';
import type { Order } from '../types';

export type InvoiceAssets = { logo: string; font: string; qr: string };
export type InvoiceFile = { bytes: Uint8Array; url: string; filename: string; sha256: string; orderId: string; language: 'FR' | 'EN' };

export function createInvoicePdf(order: Order, language: 'FR' | 'EN', assets: InvoiceAssets) {
  const model = invoiceModel(order);
  const copy = (fr: string, en: string) => language === 'FR' ? fr : en;
  const money = (cents: number) => model.format(cents, language);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', putOnlyUsedFonts: true, compress: true });
  doc.addFileToVFS('NotoSans.ttf', assets.font);
  doc.addFont('NotoSans.ttf', 'Noto', 'normal');
  doc.setFont('Noto');
  doc.setCreationDate(new Date(order.date));
  doc.setProperties({ title: `StevenBmj - ${order.id}`, author: 'StevenBmj', subject: copy('Facture de commande', 'Order invoice') });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 38;
  const gold: [number, number, number] = [245, 184, 65];
  const muted: [number, number, number] = [173, 173, 173];
  const framed = new Set<number>();
  function frame() {
    const page = doc.getCurrentPageInfo().pageNumber;
    if (framed.has(page)) return;
    framed.add(page);
    doc.setFillColor(10, 10, 10); doc.rect(0, 0, width, height, 'F');
    doc.setDrawColor(139, 100, 33); doc.setLineWidth(0.8);
    doc.rect(22, 22, width - 44, height - 44); doc.rect(26, 26, width - 52, height - 52);
    doc.addImage(assets.logo, 'PNG', margin, 39, 42, 42);
    doc.setFont('Noto'); doc.setFontSize(19); doc.setTextColor(245, 245, 245);
    doc.text('STEVENBMJ', margin + 54, 63);
    doc.setFontSize(7); doc.setTextColor(...gold);
    doc.text(copy('HAUTE COUTURE ET JOAILLERIE', 'HAUTE COUTURE AND FINE JEWELRY'), margin + 55, 77);
    doc.setFontSize(9); doc.text(copy('FACTURE DE PRESTIGE', 'PRESTIGE INVOICE'), width - margin, 48, { align: 'right' });
    doc.setTextColor(...muted); doc.setFontSize(7);
    const referenceLines = doc.splitTextToSize(order.id, 200);
    doc.text(referenceLines, width - margin, 63, { align: 'right' });
    doc.text(new Date(order.date).toLocaleDateString(language === 'FR' ? 'fr-FR' : 'en-US', { timeZone: 'Africa/Porto-Novo' }), width - margin, 88, { align: 'right' });
    doc.setDrawColor(86, 65, 30); doc.line(margin, 100, width - margin, 100);
  }
  const common = {
    margin: { top: 115, bottom: 48, left: margin, right: margin },
    styles: { font: 'Noto', fontStyle: 'normal' as const, fontSize: 9, cellPadding: 8, textColor: [235, 235, 235] as [number, number, number], fillColor: [16, 16, 16] as [number, number, number], lineColor: [45, 45, 45] as [number, number, number], overflow: 'linebreak' as const },
    headStyles: { fontStyle: 'normal' as const, fillColor: [24, 24, 24] as [number, number, number], textColor: gold },
    alternateRowStyles: { fillColor: [19, 19, 19] as [number, number, number] },
    rowPageBreak: 'avoid' as const,
    willDrawPage: frame,
  };
  const seller = model.pricing.seller;
  autoTable(doc, { ...common, startY: 115,
    head: [[copy('DESTINATAIRE', 'RECIPIENT'), copy('MAISON DE VENTES', 'RETAIL HOUSE')]],
    body: [[ [order.customerName, `WhatsApp: ${order.whatsapp}`, order.email || '', `${order.address}, ${order.city}`].filter(Boolean).join('\n'),
      [seller.name, seller.address, `WhatsApp: ${seller.phone}`, `Email: ${seller.email}`].join('\n') ]],
    columnStyles: { 0: { cellWidth: (width - margin * 2) / 2 }, 1: { cellWidth: (width - margin * 2) / 2 } },
  });
  const lastY = () => (doc as any).lastAutoTable.finalY as number;
  autoTable(doc, { ...common, startY: lastY() + 18, showHead: 'everyPage',
    head: [[copy('CRÉATION / SÉLECTION', 'CREATION / SELECTION'), copy('QTÉ', 'QTY'), copy('PRIX UNITAIRE', 'UNIT PRICE'), copy('MONTANT', 'AMOUNT')]],
    body: order.items.map(item => [`${item.productName}${item.selectedSize ? `\n${copy('Taille', 'Size')}: ${item.selectedSize}` : ''}`, String(item.quantity), money(Math.round(item.price * 100)), money(Math.round(item.price * 100) * item.quantity)]),
    columnStyles: { 0: { cellWidth: width - margin * 2 - 229 }, 1: { cellWidth: 35, halign: 'center' }, 2: { cellWidth: 97, halign: 'right' }, 3: { cellWidth: 97, halign: 'right' } },
  });
  if (order.notes) autoTable(doc, { ...common, startY: lastY() + 14,
    head: [[copy('NOTES DE LIVRAISON', 'DELIVERY NOTES')]], body: [[order.notes]],
  });
  const rows = [[copy('Sous-total', 'Subtotal'), money(model.pricing.subtotalCents)]];
  if (model.pricing.discountCents > 0) rows.push([`${copy('Réduction', 'Discount')}${model.pricing.promoCode ? ` (${model.pricing.promoCode})` : ''}`, `-${money(model.pricing.discountCents)}`]);
  rows.push([copy('Livraison', 'Shipping'), money(model.pricing.shippingCents)], [copy('TOTAL FACTURE', 'INVOICE TOTAL'), money(model.pricing.totalCents)],
    [copy('Paiement', 'Payment'), order.paymentStatus === 'paid' ? copy('Confirmé', 'Confirmed') : order.paymentStatus === 'refunded' ? copy('Remboursé', 'Refunded') : order.paymentStatus === 'pending' ? copy('À régler', 'To be paid') : copy('Non renseigné', 'Not recorded')]);
  autoTable(doc, { ...common, startY: lastY() + 18, body: rows, pageBreak: 'avoid',
    columnStyles: { 0: { cellWidth: width - margin * 2 - 160 }, 1: { cellWidth: 160, halign: 'right', textColor: gold } },
  });
  let y = lastY() + 18;
  if (y + 88 > height - 48) { doc.addPage(); frame(); y = 119; }
  doc.addImage(assets.qr, 'PNG', margin, y, 64, 64);
  doc.setTextColor(...gold); doc.setFontSize(9);
  doc.text(copy('RÉFÉRENCE DE LA COMMANDE', 'ORDER REFERENCE'), margin + 78, y + 21);
  doc.setTextColor(...muted); doc.setFontSize(8);
  doc.text(copy('Maison StevenBmj', 'House of StevenBmj'), margin + 78, y + 40);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setTextColor(...muted); doc.setFont('Noto'); doc.setFontSize(7);
    doc.text(`${page} / ${pages}`, width - margin, height - 34, { align: 'right' });
    doc.text('StevenBmj', margin, height - 34);
  }
  return new Uint8Array(doc.output('arraybuffer'));
}
