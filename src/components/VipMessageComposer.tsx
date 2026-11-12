import { useRef, useState } from 'react';
import { ExternalLink, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';

export default function VipMessageComposer({ recipient, close }: { recipient: { customerName: string; email?: string; whatsapp?: string }; close: () => void }) {
  const { language } = useApp();
  const fr = language === 'FR';
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const request = useRef({ text: '', id: '' });
  const submit = async () => {
    if (!consent || busy || message.trim().length < 3) return;
    if (request.current.text !== message) request.current = { text: message, id: crypto.randomUUID() };
    setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/vip-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...recipient, message, confirmed: true, consent: true, requestId: request.current.id, language }) });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setResult(data);
    } catch { setError(fr ? 'Résultat indisponible. Réessayez sans modifier le message pour consulter la même demande, sans double envoi.' : 'Result unavailable. Retry without changing the message to check the same request without sending it twice.'); }
    finally { setBusy(false); }
  };
  const control = 'inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/20 px-4 py-2 text-sm disabled:opacity-40';
  return <section className="space-y-5 border-y border-white/15 py-6" aria-label={fr ? 'Message client' : 'Customer message'}>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-lg">{recipient.customerName}</h3><p className="mt-2 break-all text-sm text-neutral-400">{recipient.email}<br />{recipient.whatsapp}</p></div><button onClick={close} aria-label={fr ? 'Fermer le message' : 'Close message'} title={fr ? 'Fermer' : 'Close'} className={control}><X size={18} /></button></div>
    {!result && <><label className="block text-sm">Message<textarea rows={5} minLength={3} maxLength={1500} value={message} onChange={event => setMessage(event.target.value)} className="mt-2 block w-full rounded border border-white/20 bg-black px-3 py-3 text-base" /></label><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 size-5 shrink-0 accent-amber-400" />{fr ? 'Je confirme le destinataire et son accord pour recevoir ce message.' : 'I confirm the recipient and their permission to receive this message.'}</label><button disabled={!consent || busy || message.trim().length < 3} onClick={() => void submit()} className={`${control} bg-amber-400 text-black`}><Send size={16} />{fr ? 'Confirmer ce message' : 'Confirm this message'}</button></>}
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    {result && <div className="space-y-4"><p role="status" className="text-sm">{result.emailStatus === 'accepted' ? (fr ? 'E-mail accepté par le serveur d’envoi. La remise en boîte de réception n’est pas encore confirmée.' : 'Email accepted by the sending server. Inbox delivery is not yet confirmed.') : result.emailStatus === 'sending' ? (fr ? 'Envoi e-mail en cours ou résultat à vérifier. Aucun nouvel envoi automatique.' : 'Email is being sent or its result needs checking. No automatic resend.') : result.emailStatus === 'not_requested' ? (fr ? 'Aucun e-mail demandé.' : 'No email requested.') : (fr ? 'E-mail non accepté. Vérifiez la configuration et le destinataire avant une nouvelle demande.' : 'Email not accepted. Check the configuration and recipient before a new request.')}</p>
      {result.whatsappUrl && <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className={control}><ExternalLink size={16} />{fr ? 'Ouvrir WhatsApp et envoyer manuellement' : 'Open WhatsApp and send manually'}</a>}
      <p className="whitespace-pre-wrap break-words text-sm text-neutral-300">{message}</p>
    </div>}
  </section>;
}
