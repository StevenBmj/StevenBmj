export function downloadCsv(rows: (string | number)[][], filename: string) {
  const content = '\ufeff' + rows.map(row => row.map(value => {
    const safe = typeof value === 'string' && /^[=+@\-\t\r]/.test(value) ? `'${value}` : String(value);
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadReportPdf(title: string, period: string, headers: string[], rows: (string | number)[][], filename: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const font = await fetch('/fonts/NotoSans-Regular.ttf');
  if (!font.ok) throw new Error('Font unavailable');
  let binary = '';
  for (const value of new Uint8Array(await font.arrayBuffer())) binary += String.fromCharCode(value);
  const pdf = new jsPDF();
  pdf.addFileToVFS('NotoSans.ttf', btoa(binary)); pdf.addFont('NotoSans.ttf', 'NotoSans', 'normal'); pdf.setFont('NotoSans');
  pdf.setFontSize(18); pdf.text('StevenBmj', 14, 20);
  pdf.setFontSize(12); pdf.text(title, 14, 31);
  pdf.setFontSize(9); pdf.text(period, 14, 39);
  autoTable(pdf, { startY: 46, head: [headers], body: rows, margin: { left: 14, right: 14, bottom: 18 },
    styles: { font: 'NotoSans', fontStyle: 'normal', fontSize: 8, overflow: 'linebreak', cellPadding: 3 },
    headStyles: { fillColor: [25, 25, 25], textColor: [255, 215, 80], fontStyle: 'normal' },
    rowPageBreak: 'avoid', showHead: 'everyPage' });
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) { pdf.setPage(page); pdf.setFontSize(8); pdf.text(`${page} / ${pdf.getNumberOfPages()}`, 196, 288, { align: 'right' }); }
  pdf.save(filename);
}
