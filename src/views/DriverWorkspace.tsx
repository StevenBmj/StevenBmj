import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { deliveryLabel } from '../lib/delivery';
import OrderWorkspace from '../components/OrderWorkspace';
import CountryPhoneField from '../components/CountryPhoneField';

export default function DriverWorkspace() {
  const { user, language, authLoading, openAuth } = useApp();
  const [profile, setProfile] = useState<any>(undefined);
  const [phone, setPhone] = useState(user?.whatsapp || '');
  const [zone, setZone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fr = language === 'FR';
  useEffect(() => {
    const controller = new AbortController();
    if (user) void apiFetch('/api/shop?resource=driver-profile', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!controller.signal.aborted) setProfile(data.profile);
    }).catch(() => { if (!controller.signal.aborted) setError(fr ? 'Profil indisponible.' : 'Profile unavailable.'); });
    else setProfile(undefined);
    return () => controller.abort();
  }, [user?.id]);
  const save = async (body: any, method: string) => {
    setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/shop?resource=driver-profile', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setProfile(data.profile);
    } catch { setError(fr ? 'Modification impossible. Vérifiez vos coordonnées et vos missions en cours.' : 'Unable to save. Check your details and current assignments.'); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
    <div className="space-y-4 border-b border-white/10 pb-6"><h1 className="text-2xl font-medium">{fr ? 'Espace livreur' : 'Driver workspace'}</h1>
      {!user && !authLoading && <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded bg-amber-400 px-4 text-sm text-black" onClick={() => openAuth('login')}>{fr ? 'Se connecter' : 'Sign in'}</button><button className="min-h-11 rounded border border-white/20 px-4 text-sm" onClick={() => openAuth('register')}>{fr ? 'Créer un compte' : 'Create an account'}</button></div>}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {user && profile === undefined && !error && <p role="status">{fr ? 'Chargement…' : 'Loading…'}</p>}
      {profile && <><p className="text-sm text-amber-300">{deliveryLabel(profile.status, language)}</p><p className="text-sm text-neutral-300">{profile.phone} · {profile.zone}</p></>}
      {profile?.status === 'approved' && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" disabled={busy} checked={profile.available} onChange={event => void save({ available: event.target.checked }, 'PATCH')} className="size-5 accent-amber-400" />{fr ? 'Disponible pour une nouvelle mission' : 'Available for a new assignment'}</label>}
    </div>
    {user && profile === null && <form className="max-w-xl space-y-5" onSubmit={event => { event.preventDefault(); void save({ phone, zone }, 'POST'); }}>
      <h2 className="text-xl">{fr ? 'Candidature livreur' : 'Driver application'}</h2>
      <p className="text-sm leading-6 text-neutral-400">{fr ? 'L’équipe doit approuver votre candidature avant toute affectation.' : 'The team must approve your application before any assignment.'}</p>
      <CountryPhoneField id="driver-phone" value={phone} onChange={setPhone} language={language} />
      <label className="block text-sm">{fr ? 'Zone de livraison' : 'Delivery area'}<input required minLength={2} maxLength={160} value={zone} onChange={event => setZone(event.target.value)} className="mt-2 min-h-11 w-full rounded border border-white/20 bg-black px-3 text-base" /></label>
      <button disabled={busy} className="min-h-11 rounded bg-amber-400 px-4 text-sm font-semibold text-black disabled:opacity-50">{fr ? 'Envoyer ma candidature' : 'Submit application'}</button>
    </form>}
    {profile?.status === 'approved' && <OrderWorkspace role="driver" />}
  </div>;
}
