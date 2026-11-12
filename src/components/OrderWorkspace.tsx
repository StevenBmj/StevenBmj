import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Check, Download, RefreshCw, Search, Truck } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import { deliveryLabel, orderMoney, receiptAgreement, workflowError, type DeliveryOrder, type ReceiptSignature } from '../lib/delivery';
import type { InvoiceFile } from '../lib/invoicePdf';
import SignatureField from './SignatureField';

const InvoicePreview = lazy(() => import('./InvoicePreview'));
const inputClass = 'mt-2 min-h-11 w-full rounded border border-white/20 bg-black px-3 py-2 text-base text-white focus:border-amber-400 focus:outline-none';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/20 px-4 py-2 text-sm text-white hover:border-amber-400 hover:text-amber-400 disabled:cursor-wait disabled:opacity-50';

function DeliveryReceipt({ language, busy, submit }: { language: 'FR' | 'EN'; busy: boolean; submit: (payload: any) => void }) {
  const [signature, setSignature] = useState<ReceiptSignature | null>(null);
  const [firstName, setFirstName] = useState('');
  const [condition, setCondition] = useState('good');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const fr = language === 'FR';
  return <form onSubmit={event => { event.preventDefault(); submit({ action: 'sign', firstName, condition, note, consent, signature, contractVersion: 'receipt-v1' }); }} className="space-y-5 border-t border-white/10 pt-6">
    <h3 className="text-lg font-medium">{fr ? 'Accusé de réception du destinataire' : 'Recipient acknowledgement'}</h3>
    <p className="text-sm leading-7 text-neutral-300">{receiptAgreement[language]}</p>
    <label className="block text-sm">{fr ? 'Prénom du destinataire' : 'Recipient first name'}
      <input id="receipt-firstname" required maxLength={80} minLength={2} value={firstName} onChange={event => setFirstName(event.target.value.normalize('NFC').replace(/[^\p{L}' -]/gu, ''))} autoComplete="given-name" className={inputClass} />
    </label>
    <label className="block text-sm">{fr ? 'État des articles reçus' : 'Condition of the received items'}
      <select value={condition} onChange={event => setCondition(event.target.value)} className={inputClass}>
        <option value="good">{fr ? 'Reçus en bon état' : 'Received in good condition'}</option>
        <option value="issue">{fr ? 'Réserves ou problème à signaler' : 'Concerns or damage to report'}</option>
      </select>
    </label>
    <label className="block text-sm">{fr ? 'Observations' : 'Comments'}
      <textarea required={condition === 'issue'} minLength={condition === 'issue' ? 8 : undefined} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} rows={3} className={inputClass} />
    </label>
    <SignatureField value={signature} onChange={setSignature} language={language} />
    <label className="flex items-start gap-3 text-sm leading-6"><input id="receipt-consent" type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 size-5 shrink-0 accent-amber-400" />
      {fr ? 'J’ai lu ce texte et je signe cet accusé de réception.' : 'I have read this statement and sign this acknowledgement.'}
    </label>
    <button id="btn-submit-receipt" disabled={busy || !signature || !consent} className={`${buttonClass} bg-amber-400 !text-black`}><Check size={18} />{fr ? 'Enregistrer la remise signée' : 'Save signed handover'}</button>
  </form>;
}

export default function OrderWorkspace({ role }: { role: 'client' | 'driver' | 'admin' }) {
  const { language, user, authLoading, openAuth, fetchProducts } = useApp();
  const { route, navigate } = useNavigation();
  const fr = language === 'FR';
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState(route.orderId || '');
  const [history, setHistory] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [formAction, setFormAction] = useState('');
  const [reference, setReference] = useState('');
  const [method, setMethod] = useState('mobile_money');
  const [driverId, setDriverId] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<InvoiceFile | null>(null);
  const mounted = useRef(true);
  const request = useRef({ key: '', id: '' });
  const selected = orders.find(order => order.id === selectedId);

  const load = async () => {
    if (!user) return;
    try {
      const response = await apiFetch(role === 'client' ? '/api/orders' : '/api/shop?resource=deliveries');
      if (!response.ok) throw new Error('load_failed');
      const rows = await response.json();
      if (mounted.current) { setOrders(rows); setError(''); }
      if (role === 'admin') {
        const response = await apiFetch('/api/shop?resource=drivers');
        if (!response.ok) throw new Error('load_failed');
        const rows = await response.json();
        if (mounted.current) setDrivers(rows);
      }
    } catch { if (mounted.current) setError(fr ? 'Chargement impossible. Réessayez.' : 'Unable to load orders. Please retry.'); }
    finally { if (mounted.current) setLoading(false); }
  };
  useEffect(() => {
    mounted.current = true;
    void load();
    const refresh = window.setInterval(() => { if (!document.hidden) void load(); }, 20000);
    return () => { mounted.current = false; window.clearInterval(refresh); };
  }, [role, user?.id]);
  useEffect(() => { if (route.orderId) setSelectedId(route.orderId); }, [route.orderId]);
  useEffect(() => {
    setHistory(null); setShowInvoice(false); setInvoiceFile(null); setFormAction('');
    if (!selected) return;
    const controller = new AbortController();
    void apiFetch(`/api/shop?resource=order-history&id=${encodeURIComponent(selected.id)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setHistory(data); })
      .catch(() => { if (!controller.signal.aborted) setError(fr ? 'Historique indisponible.' : 'History unavailable.'); });
    return () => controller.abort();
  }, [selected?.id, selected?.workflowVersion, language]);

  const submit = async (payload: any) => {
    if (!selected || busy) return;
    const command = { ...payload, version: selected.workflowVersion || 0 };
    const key = JSON.stringify([selected.id, command]);
    if (request.current.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true); setError(''); setFeedback('');
    try {
      const response = await apiFetch(`/api/shop?resource=order-action&id=${encodeURIComponent(selected.id)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...command, requestId: request.current.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrders(previous => previous.map(order => order.id === data.order.id ? data.order : order));
      setFormAction(''); setReference(''); setNote('');
      setFeedback(fr ? 'Mise à jour enregistrée.' : 'Update saved.');
      window.dispatchEvent(new Event('sbmj:notifications-refresh'));
      if (['record_payment', 'reserve_stock', 'refund'].includes(payload.action)) void fetchProducts();
      await load();
    } catch (error: any) { setError(workflowError(error.message, language)); }
    finally { setBusy(false); }
  };

  if (authLoading) return <p role="status">{fr ? 'Vérification de la connexion…' : 'Checking your session…'}</p>;
  if (!user) return <div className="space-y-4 py-8"><h1 className="text-2xl">{fr ? 'Mes commandes' : 'My orders'}</h1><button onClick={() => openAuth('login')} className={buttonClass}>{fr ? 'Se connecter' : 'Sign in'}</button></div>;

  return <section className="min-w-0 space-y-6" aria-label={fr ? 'Suivi des commandes' : 'Order tracking'}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
      <h1 className="text-2xl font-medium">{role === 'admin' ? (fr ? 'Commandes et livraisons' : 'Orders and deliveries') : role === 'driver' ? (fr ? 'Mes livraisons' : 'My deliveries') : (fr ? 'Mes commandes' : 'My orders')}</h1>
      <button title={fr ? 'Actualiser' : 'Refresh'} aria-label={fr ? 'Actualiser les commandes' : 'Refresh orders'} onClick={() => void load()} className={buttonClass}><RefreshCw size={18} /></button>
    </div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    {feedback && <p role="status" className="text-sm text-emerald-400">{feedback}</p>}
    <label className="flex items-center gap-3"><Search size={18} className="shrink-0 text-neutral-400" /><input aria-label={fr ? 'Rechercher une commande' : 'Search orders'} value={search} onChange={event => setSearch(event.target.value)} placeholder={fr ? 'Référence ou nom' : 'Reference or name'} className={inputClass} /></label>
    {loading ? <p role="status">{fr ? 'Chargement…' : 'Loading…'}</p> : !orders.length ? <p className="py-6 text-neutral-400">{fr ? 'Aucune commande pour le moment.' : 'No orders yet.'}</p> : <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
      <div className="min-w-0 space-y-1">
        {orders.filter(order => `${order.id} ${order.customerName}`.toLowerCase().includes(search.toLowerCase())).map(order => <button key={order.id} data-order-id={order.id} onClick={() => { setSelectedId(order.id); navigate({ ...route, orderId: order.id, panel: null }); }}
          className={`block w-full break-words border-b border-white/10 p-4 text-left ${selectedId === order.id ? 'bg-amber-400/10' : 'hover:bg-white/5'}`}>
          <span className="block break-all text-sm font-medium text-white">{order.id}</span>
          <span className="mt-2 block text-sm text-neutral-300">{order.customerName}</span>
          <span className="mt-2 block text-xs text-amber-300">{deliveryLabel(order.fulfilmentStatus || (order.status === 'cancelled' ? 'cancelled' : 'awaiting_payment'), language)}</span>
          <span className="mt-2 block text-sm text-neutral-400">{orderMoney(order.totalPrice, order.currency, language)}</span>
        </button>)}
      </div>
      <div className="min-w-0 space-y-6">
        {!selected ? <p className="py-6 text-neutral-400">{fr ? 'Sélectionnez une commande.' : 'Select an order.'}</p> : <>
          <div className="space-y-3 border-b border-white/10 pb-5">
            <h2 className="break-all text-lg font-medium">{selected.id}</h2>
            <p className="text-sm text-amber-300">{deliveryLabel(selected.fulfilmentStatus || 'awaiting_payment', language)}</p>
            <p className="break-words text-sm leading-7 text-neutral-300">{selected.customerName}<br />{selected.address}, {selected.city}<br />{selected.whatsapp}</p>
            {history?.driverName && <p className="flex items-center gap-2 text-sm"><Truck size={16} />{fr ? 'Livreur :' : 'Driver:'} {history.driverName}</p>}
            <ul className="space-y-2 text-sm">{selected.items.map((item, index) => <li key={index} className="break-words">{item.quantity} × {item.productName}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</li>)}</ul>
            <p className="font-medium">{orderMoney(selected.totalPrice, selected.currency, language)}</p>
            <button className={buttonClass} onClick={() => setShowInvoice(value => !value)}>{fr ? 'Facture PDF' : 'PDF invoice'}</button>
          </div>
          {showInvoice && <div className="space-y-4"><Suspense fallback={<p role="status">{fr ? 'Préparation du PDF…' : 'Preparing PDF…'}</p>}><InvoicePreview order={selected} language={language} onReady={setInvoiceFile} /></Suspense>
            <button disabled={!invoiceFile} className={buttonClass} onClick={() => { if (!invoiceFile) return; const link = document.createElement('a'); link.href = invoiceFile.url; link.download = invoiceFile.filename; link.click(); }}><Download size={16} />{fr ? 'Télécharger la facture' : 'Download invoice'}</button>
          </div>}
          {role === 'admin' && <div className="flex flex-wrap gap-3">
            {selected.fulfilmentStatus === 'legacy' && <div className="w-full space-y-3"><p className="text-sm text-neutral-300">{fr ? 'Historique conservé :' : 'Original status retained:'} {selected.status} · {selected.paymentStatus}. {fr ? 'Aucun paiement ni mouvement de stock historique n’a été inventé.' : 'No historical payment or stock movement has been invented.'}</p>
              {selected.status === 'pending' && ['pending', 'unknown'].includes(selected.paymentStatus || '') && <button className={buttonClass} disabled={busy} onClick={() => { const note = window.prompt(fr ? 'Après vérification, indiquez pourquoi cette commande impayée doit être reprise (8 caractères minimum).' : 'After checking, explain why this unpaid order should be resumed (at least 8 characters).'); if (note && note.trim().length >= 8) void submit({ action: 'adopt', note }); }}>{fr ? 'Reprendre cette commande impayée' : 'Resume this unpaid order'}</button>}
            </div>}
            {selected.fulfilmentStatus === 'awaiting_payment' && <button className={buttonClass} onClick={() => setFormAction('record_payment')}>{fr ? 'Vérifier le paiement' : 'Verify payment'}</button>}
            {selected.fulfilmentStatus === 'stock_issue' && <button disabled={busy} className={buttonClass} onClick={() => void submit({ action: 'reserve_stock' })}>{fr ? 'Réserver le stock' : 'Allocate stock'}</button>}
            {selected.fulfilmentStatus === 'preparing' && <button className={buttonClass} onClick={() => setFormAction('assign')}>{fr ? 'Affecter un livreur' : 'Assign driver'}</button>}
            {selected.paymentStatus === 'paid' && selected.fulfilmentStatus !== 'legacy' && <button className={buttonClass} onClick={() => setFormAction('refund')}>{fr ? 'Enregistrer un remboursement' : 'Record refund'}</button>}
            {selected.fulfilmentStatus === 'awaiting_payment' && <button disabled={busy} className={buttonClass} onClick={() => { if (window.confirm(fr ? 'Annuler cette commande ?' : 'Cancel this order?')) void submit({ action: 'cancel' }); }}>{fr ? 'Annuler la commande' : 'Cancel order'}</button>}
          </div>}
          {formAction && <form className="space-y-4 border-y border-white/10 py-5" onSubmit={event => {
            event.preventDefault();
            const currency = selected.currency === 'CFA' ? 'XOF' : selected.currency;
            void submit({ action: formAction, reference, method, driverId, amountMinor: Math.round(selected.totalPrice * (currency === 'XOF' ? 1 : 100)), currency });
          }}>
            {formAction === 'assign' ? <label className="block text-sm">{fr ? 'Livreur disponible' : 'Available driver'}<select required value={driverId} onChange={event => setDriverId(event.target.value)} className={inputClass}>
              <option value="">{fr ? 'Choisir un livreur' : 'Choose a driver'}</option>{drivers.filter(driver => driver.status === 'approved' && driver.available).map(driver => <option value={driver.user_id} key={driver.user_id}>{driver.name} · {driver.zone}</option>)}
            </select></label> : <>
              <p className="text-sm text-neutral-300">{formAction === 'record_payment' ? (fr ? 'Paiement reçu à confirmer :' : 'Received payment to confirm:') : (fr ? 'Remboursement effectué à enregistrer :' : 'Completed refund to record:')} {orderMoney(selected.totalPrice, selected.currency, language)}</p>
              <label className="block text-sm">{fr ? 'Référence du justificatif' : 'Payment evidence reference'}<input required minLength={3} maxLength={120} value={reference} onChange={event => setReference(event.target.value)} className={inputClass} /></label>
              <label className="block text-sm">{fr ? 'Moyen de paiement' : 'Payment method'}<select value={method} onChange={event => setMethod(event.target.value)} className={inputClass}><option value="mobile_money">Mobile Money</option><option value="bank">{fr ? 'Virement' : 'Bank transfer'}</option><option value="cash">{fr ? 'Espèces' : 'Cash'}</option><option value="other">{fr ? 'Autre' : 'Other'}</option></select></label>
            </>}
            <div className="flex flex-wrap gap-3"><button disabled={busy} className={`${buttonClass} bg-amber-400 !text-black`}>{fr ? 'Confirmer' : 'Confirm'}</button><button type="button" onClick={() => setFormAction('')} className={buttonClass}>{fr ? 'Retour' : 'Back'}</button></div>
          </form>}
          {role === 'driver' && <div className="flex flex-wrap gap-3">
            {({ assigned: ['accept', 'decline'], accepted: ['pickup', 'decline'], collected: ['dispatch'] } as Record<string, string[]>)[selected.fulfilmentStatus]?.map(action => <button key={action} disabled={busy} className={buttonClass} onClick={() => {
              if (action === 'decline') { const reason = window.prompt(fr ? 'Motif du refus :' : 'Reason for declining:'); if (reason) void submit({ action, note: reason }); }
              else void submit({ action });
            }}>{action === 'accept' ? (fr ? 'Accepter' : 'Accept') : action === 'decline' ? (fr ? 'Refuser' : 'Decline') : action === 'pickup' ? (fr ? 'Colis récupéré' : 'Parcel collected') : (fr ? 'Commencer la livraison' : 'Start delivery')}</button>)}
          </div>}
          {role === 'driver' && selected.fulfilmentStatus === 'out_for_delivery' && <DeliveryReceipt key={selected.id} language={language} busy={busy} submit={payload => void submit(payload)} />}
          {history?.proof && <section className="space-y-4 border-t border-white/10 pt-5">
            <h3 className="text-lg">{fr ? 'Accusé de réception signé' : 'Signed acknowledgement'}</h3>
            <p className="text-sm leading-7 text-neutral-300">{receiptAgreement[language]}</p>
            <p className="text-sm">{history.proof.first_name} · {new Date(history.proof.signed_at).toLocaleString(fr ? 'fr-FR' : 'en-GB')}</p>
            <p className="text-sm">{history.proof.condition === 'good' ? (fr ? 'Reçus en bon état' : 'Received in good condition') : (fr ? 'Réserves signalées' : 'Concerns reported')}</p>
            {history.proof.note && <p className="break-words text-sm text-neutral-300">{history.proof.note}</p>}
            <SignatureField key={history.proof.order_id} value={history.proof.signature} language={language} />
          </section>}
          {role === 'client' && selected.fulfilmentStatus === 'signed' && <form className="space-y-4 border-t border-white/10 pt-5" onSubmit={event => { event.preventDefault(); void submit({ action: 'confirm', ...(rating ? { rating: Number(rating) } : {}), note }); }}>
            <label className="block text-sm">{fr ? 'Votre avis (facultatif)' : 'Your feedback (optional)'}<textarea maxLength={1000} value={note} onChange={event => setNote(event.target.value)} className={inputClass} /></label>
            <label className="block text-sm">{fr ? 'Note de satisfaction (facultative)' : 'Satisfaction rating (optional)'}<select value={rating} onChange={event => setRating(event.target.value)} className={inputClass}><option value="">{fr ? 'Sans note' : 'No rating'}</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}/5</option>)}</select></label>
            <div className="flex flex-wrap gap-3"><button disabled={busy} className={buttonClass}>{fr ? 'Confirmer la réception' : 'Confirm receipt'}</button><button type="button" disabled={busy || note.trim().length < 8} className={buttonClass} onClick={() => void submit({ action: 'dispute', note })}>{fr ? 'Signaler un problème' : 'Report a problem'}</button></div>
          </form>}
          {history && <section className="border-t border-white/10 pt-5"><h3 className="mb-4 text-lg">{fr ? 'Historique' : 'History'}</h3><ol className="space-y-4 text-sm">{history.events.length ? history.events.map((event: any) => <li key={event.id} className="border-l border-amber-400/40 pl-4"><p>{deliveryLabel(event.kind, language)}</p><p className="mt-1 text-xs text-neutral-400">{new Date(event.created_at).toLocaleString(fr ? 'fr-FR' : 'en-GB')}</p>{event.details?.note && <p className="mt-2 break-words text-neutral-300">{event.details.note}</p>}</li>) : <li className="text-neutral-400">{fr ? 'Commande enregistrée, en attente de traitement.' : 'Order recorded, awaiting processing.'}</li>}</ol></section>}
        </>}
      </div>
    </div>}
  </section>;
}
