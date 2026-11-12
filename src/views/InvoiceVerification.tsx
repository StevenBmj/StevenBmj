import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function InvoiceVerification({ token }: { token: string }) {
  const { language } = useApp();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError(false);
    const load = async () => {
      const response = await apiFetch(`/api/invoices/verify?token=${encodeURIComponent(token)}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Unavailable');
      setResult(await response.json());
    };
    void load().catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [token]);
  useEffect(() => {
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  const fr = language === 'FR';
  return <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <h1 className="text-xl font-medium text-white">{fr ? 'Verification de facture' : 'Invoice verification'}</h1>
    {error ? <p role="alert" className="flex items-center gap-2 mt-6 text-red-300"><AlertCircle className="w-5 h-5" />{fr ? 'Cette reference est introuvable ou indisponible.' : 'This reference was not found or is unavailable.'}</p>
      : !result ? <p role="status" className="mt-6 text-neutral-400">{fr ? 'Verification...' : 'Verifying...'}</p>
      : <div className="mt-6 border-y border-white/10 py-6 space-y-4">
        <p className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="w-5 h-5" />{fr ? 'Commande enregistree chez StevenBmj' : 'Order registered with StevenBmj'}</p>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 text-sm">
          <dt className="text-neutral-400">{fr ? 'Reference' : 'Reference'}</dt><dd className="break-words">{result.id}</dd>
          <dt className="text-neutral-400">Date</dt><dd>{new Date(result.date).toLocaleDateString(fr ? 'fr-FR' : 'en-US')}</dd>
          <dt className="text-neutral-400">Total</dt><dd>{new Intl.NumberFormat(fr ? 'fr-FR' : 'en-US', { style: 'currency', currency: result.currency === 'CFA' ? 'XOF' : result.currency }).format(result.totalPrice)}</dd>
          <dt className="text-neutral-400">{fr ? 'Paiement' : 'Payment'}</dt><dd>{result.paymentStatus === 'paid' ? (fr ? 'Confirmé' : 'Confirmed') : result.paymentStatus === 'refunded' ? (fr ? 'Remboursé' : 'Refunded') : result.paymentStatus === 'pending' ? (fr ? 'Non confirmé' : 'Not confirmed') : (fr ? 'Non renseigné' : 'Not recorded')}</dd>
        </dl>
      </div>}
  </section>;
}
