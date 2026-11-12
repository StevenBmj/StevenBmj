import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function AdminMfa({ challenge = false }: { challenge?: boolean }) {
  const { language, setUser } = useApp();
  const fr = language === 'FR';
  const [factors, setFactors] = useState<any[] | null>(null);
  const [enrolment, setEnrolment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void apiFetch('/api/auth/mfa', { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setFactors(data.factors); }).catch(() => { if (!controller.signal.aborted) setError(fr ? 'Double authentification indisponible.' : 'Two-factor authentication unavailable.'); });
    return () => controller.abort();
  }, [attempt]);
  const action = async (body: any) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/auth/mfa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (body.action === 'enroll') setEnrolment(data);
      else { setEnrolment(null); setCode(''); setUser(data.user); setAttempt(value => value + 1); }
    } catch (error: any) { setError(error.message === 'recent_login_required' ? (fr ? 'Reconnectez-vous avant d’activer la double authentification.' : 'Sign in again before enabling two-factor authentication.') : (fr ? 'Action refusée. Vérifiez le code actuel et l’heure de votre application.' : 'Action refused. Check your current code and the time in your authenticator app.')); }
    finally { setBusy(false); }
  };
  const factorId = enrolment?.id || factors?.find(factor => factor.type === 'totp' && factor.status === 'verified')?.id;
  const control = 'inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/20 px-4 py-2 text-sm disabled:opacity-40';
  return <section className={`space-y-5 border-b border-white/15 pb-6 ${challenge ? 'mx-auto my-10 max-w-xl px-4' : ''}`} aria-label={fr ? 'Double authentification' : 'Two-factor authentication'}>
    <div className="flex items-center justify-between gap-3"><h2 className="text-xl">{fr ? 'Double authentification' : 'Two-factor authentication'}</h2><button className={control} onClick={() => setAttempt(value => value + 1)} aria-label={fr ? 'Actualiser la double authentification' : 'Refresh two-factor authentication'} title={fr ? 'Actualiser' : 'Refresh'}><RefreshCw size={16} /></button></div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    {factors === null && !error && <p role="status">{fr ? 'Vérification…' : 'Checking…'}</p>}
    {enrolment && <div className="space-y-4"><img src={enrolment.qr.startsWith('data:image/png;base64,') ? enrolment.qr : ''} alt={fr ? 'QR de configuration de votre application d’authentification' : 'Authenticator app setup QR'} width={220} height={220} className="bg-white p-3" /><p className="break-all font-mono text-sm">{enrolment.secret}</p><p className="text-sm text-neutral-400">{fr ? 'Conservez une sauvegarde sûre de votre application d’authentification. Ne partagez pas cette clé.' : 'Keep a secure backup of your authenticator app. Do not share this key.'}</p></div>}
    {factorId && (challenge || enrolment) ? <form className="max-w-sm space-y-4" onSubmit={event => { event.preventDefault(); void action({ action: 'verify', factorId, code }); }}><label className="block text-sm">{fr ? 'Code de l’application d’authentification' : 'Authenticator app code'}<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required minLength={6} maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} className="mt-2 min-h-11 w-full rounded border border-white/20 bg-black px-3 text-base" /></label><button disabled={busy} className={`${control} bg-amber-400 text-black`}><ShieldCheck size={16} />{fr ? 'Vérifier le code' : 'Verify code'}</button></form>
      : challenge && factors?.some(factor => factor.status === 'verified') ? <p role="alert" className="text-sm text-amber-300">{fr ? 'Ce compte utilise un autre type de second facteur. La récupération doit être effectuée par le propriétaire dans Supabase Auth avant de configurer une application d’authentification.' : 'This account uses another second-factor type. The owner must recover access in Supabase Auth before configuring an authenticator app.'}</p>
      : factors?.some(factor => factor.status === 'verified') ? <p role="status" className="text-sm text-emerald-400">{fr ? 'Double authentification activée.' : 'Two-factor authentication enabled.'}</p>
      : factors && <button disabled={busy} className={control} onClick={() => void action({ action: 'enroll' })}><ShieldCheck size={16} />{fr ? 'Activer avec une application d’authentification' : 'Enable with an authenticator app'}</button>}
  </section>;
}
