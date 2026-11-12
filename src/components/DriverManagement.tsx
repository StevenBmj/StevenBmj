import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { deliveryLabel } from '../lib/delivery';

export default function DriverManagement() {
  const { language } = useApp();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const fr = language === 'FR';
  const load = async () => {
    setError('');
    try {
      const response = await apiFetch('/api/shop?resource=drivers');
      if (!response.ok) throw new Error();
      setDrivers(await response.json());
    } catch { setError(fr ? 'Chargement des livreurs impossible.' : 'Unable to load drivers.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const review = async (id: string, status: string) => {
    setBusy(id); setError('');
    try {
      const response = await apiFetch(`/api/shop?resource=drivers&id=${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error();
      await load();
      window.dispatchEvent(new Event('sbmj:notifications-refresh'));
    } catch { setError(fr ? 'Modification refusée. Réessayez.' : 'Update refused. Please retry.'); }
    finally { setBusy(''); }
  };
  return <section className="space-y-6"><div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5"><h2 className="text-2xl font-medium">{fr ? 'Livreurs' : 'Drivers'}</h2><button onClick={() => void load()} aria-label={fr ? 'Actualiser les livreurs' : 'Refresh drivers'} title={fr ? 'Actualiser' : 'Refresh'} className="flex size-11 items-center justify-center rounded border border-white/20"><RefreshCw size={18} /></button></div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    {loading ? <p role="status">{fr ? 'Chargement…' : 'Loading…'}</p> : !drivers.length ? <p className="text-sm text-neutral-400">{fr ? 'Aucune candidature livreur.' : 'No driver applications.'}</p> : <div className="divide-y divide-white/10">{drivers.map(driver => <div key={driver.user_id} className="flex flex-wrap items-start justify-between gap-5 py-5"><div className="min-w-0 space-y-2"><h3 className="break-words font-medium">{driver.name}</h3><p className="break-all text-sm text-neutral-400">{driver.email}</p><p className="text-sm">{driver.phone} · {driver.zone}</p><p className="text-sm text-amber-300">{deliveryLabel(driver.status, language)}{driver.status === 'approved' ? ` · ${driver.available ? (fr ? 'Disponible' : 'Available') : (fr ? 'Indisponible' : 'Unavailable')}` : ''}</p></div><div className="flex flex-wrap gap-3">
      {driver.status !== 'approved' && <button disabled={!!busy} onClick={() => void review(driver.user_id, 'approved')} className="min-h-11 rounded border border-emerald-400/40 px-4 text-sm text-emerald-300">{fr ? 'Approuver' : 'Approve'}</button>}
      {driver.status === 'pending' && <button disabled={!!busy} onClick={() => void review(driver.user_id, 'rejected')} className="min-h-11 rounded border border-white/20 px-4 text-sm">{fr ? 'Refuser' : 'Decline'}</button>}
      {driver.status === 'approved' && <button disabled={!!busy} onClick={() => void review(driver.user_id, 'suspended')} className="min-h-11 rounded border border-red-400/40 px-4 text-sm text-red-300">{fr ? 'Suspendre' : 'Suspend'}</button>}
    </div></div>)}</div>}
  </section>;
}
