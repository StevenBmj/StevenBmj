import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist';
import type { Order } from '../types';
import type { InvoiceFile } from '../lib/invoicePdf';
import { invoiceModel } from '../lib/invoice';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let assets: Promise<{ logo: string; font: string }> | null = null;
async function localAssets() {
  if (!assets) assets = (async () => {
    const encode = (buffer: ArrayBuffer) => {
      let binary = '';
      for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
      return btoa(binary);
    };
    const logo = await fetch('/logo.png');
    const font = await fetch('/fonts/NotoSans-Regular.ttf');
    if (!logo.ok || !font.ok) throw new Error('Invoice assets unavailable');
    return { logo: `data:image/png;base64,${encode(await logo.arrayBuffer())}`, font: encode(await font.arrayBuffer()) };
  })().catch(error => { assets = null; throw error; });
  return assets;
}

function InvoicePage({ pdf, page, language }: { pdf: PDFDocumentProxy; page: number; language: 'FR' | 'EN' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let rendering: { cancel: () => void } | null = null;
    const render = async () => {
      const source = await pdf.getPage(page);
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const viewport = source.getViewport({ scale: 1.5 });
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const task = source.render({ canvas, viewport });
      rendering = task;
      await task.promise;
      if (!cancelled) setRendered(true);
    };
    void render().catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; rendering?.cancel(); };
  }, [pdf, page]);
  if (failed) return <p role="alert">{language === 'FR' ? 'Cette page ne peut pas etre affichee.' : 'This page could not be displayed.'}</p>;
  return <canvas ref={canvasRef} data-invoice-page={page} data-rendered={rendered} role="img"
    aria-label={`${language === 'FR' ? 'Facture, page' : 'Invoice, page'} ${page}`}
    className="block w-full h-auto" style={{ aspectRatio: '210 / 297' }} />;
}

export default function InvoicePreview({ order, language, onReady }: {
  order: Order; language: 'FR' | 'EN'; onReady?: (file: InvoiceFile | null) => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [hash, setHash] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useEffect(() => {
    let cancelled = false;
    let blobUrl = '';
    let document: PDFDocumentProxy | null = null;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    setPdf(null); setHash(''); setError(false); onReadyRef.current?.(null);
    const prepare = async () => {
      const { createInvoicePdf } = await import('../lib/invoicePdf');
      const loaded = await localAssets();
      const QRCode = await import('qrcode');
      const payload = order.verificationToken ? `${window.location.origin}/verification/${encodeURIComponent(order.verificationToken)}` : `STEVENBMJ:${order.id}`;
      const qr = await QRCode.toDataURL(payload, { width: 240, margin: 1, errorCorrectionLevel: 'M' });
      const bytes = createInvoicePdf(order, language, { ...loaded, qr });
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer)), b => b.toString(16).padStart(2, '0')).join('');
      const viewer = await import('pdfjs-dist');
      viewer.GlobalWorkerOptions.workerSrc = workerUrl;
      // PDF.js transfers the supplied buffer; keep the original bytes for download.
      loadingTask = viewer.getDocument({ data: bytes.slice() });
      document = await loadingTask.promise;
      if (cancelled) { await loadingTask.destroy(); return; }
      blobUrl = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
      setHash(digest); setPdf(document);
      onReadyRef.current?.({ bytes, sha256: digest, url: blobUrl, orderId: order.id, language, filename: `facture-stevenbmj-${order.id.replace(/[^a-z0-9_-]/gi, '').slice(0, 100)}.pdf` });
    };
    void prepare().catch(error => {
      if (import.meta.env.DEV) console.error('Invoice preparation failed', error);
      if (!cancelled) setError(true);
    });
    return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); void loadingTask?.destroy(); };
  }, [order, language, attempt]);
  let model: ReturnType<typeof invoiceModel> | null = null;
  try { model = invoiceModel(order); } catch { /* The preparation error is shown above. */ }
  return <div id="invoice-card" data-pdf-sha256={hash} className="w-full min-w-0">
    {error ? <div role="alert" className="py-8 text-center text-sm text-red-300">
      <p>{language === 'FR' ? 'La facture ne peut pas etre preparee. Reessayez.' : 'The invoice could not be prepared. Please retry.'}</p>
      <button type="button" onClick={() => setAttempt(value => value + 1)} className="inline-flex items-center gap-2 mt-4 min-h-11 px-4 border border-white/15 rounded">
        <RefreshCw className="w-4 h-4" />{language === 'FR' ? 'Reessayer' : 'Retry'}
      </button>
    </div> : pdf ? <div className="space-y-4">
      {Array.from({ length: pdf.numPages }, (_, page) => <InvoicePage key={page} pdf={pdf} page={page + 1} language={language} />)}
    </div> : <div role="status" className="aspect-[210/297] bg-neutral-950 flex items-center justify-center text-neutral-400 text-sm">
      {language === 'FR' ? 'Preparation de la facture...' : 'Preparing invoice...'}
    </div>}
    <div className="sr-only">
      <p>{order.id} - {order.customerName} - {order.email} - {order.address}, {order.city}</p>
      {order.items.map((item, i) => <p key={i}>{item.quantity} x {item.productName} {item.selectedSize} - {model?.format(Math.round(item.price * 100) * item.quantity, language)}</p>)}
      <p>{order.notes}</p><p>Total: {model?.format(model.pricing.totalCents, language)}</p>
    </div>
  </div>;
}
