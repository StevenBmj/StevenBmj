import { useEffect, useState } from 'react';
import { Archive, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import AdminMfa from './AdminMfa';

export default function SecurityConsole() {
  const { language } = useApp();
  const fr = language === 'FR';
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [archives, setArchives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await apiFetch(`/api/security-logs${archives ? '?archived=1' : ''}`);
      if (!response.ok) throw new Error();
      setLogs(await response.json());
    } catch { setError(fr ? 'Journaux indisponibles. Réessayez.' : 'Logs unavailable. Please retry.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => window.clearInterval(timer);
  }, [archives]);
  const archive = async () => {
    if (!window.confirm(fr ? 'Archiver tous les journaux actifs ? Ils resteront consultables dans les archives.' : 'Archive all active logs? They will remain available in the archive.')) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/security-logs', { method: 'DELETE' });
      if (!response.ok) throw new Error();
      await load();
    } catch { setError(fr ? 'Archivage impossible.' : 'Archiving failed.'); }
    finally { setLoading(false); }
  };
  const visible = logs.filter(log => {
    const matches = `${log.event} ${log.status} ${log.ip || ''} ${log.country || ''} ${log.city || ''}`.toLowerCase().includes(search.toLowerCase());
    const instant = new Date(log.timestamp);
    const day = Number.isFinite(instant.getTime()) ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Porto-Novo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant) : String(log.timestamp);
    return matches && (!date || day === date);
  });
  const blockedCount = logs.filter(log => ['BLOCKED', 'ATTACK_BLOCKED', 'ACCESS_REFUSED', 'RATE_LIMITED'].includes(log.status)).length;
  return <section className="min-w-0 space-y-6" aria-label={fr ? 'Journaux de sécurité' : 'Security logs'}>
    <AdminMfa />
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5"><h2 className="flex items-center gap-3 text-2xl font-medium"><ShieldAlert size={22} />{fr ? 'Sécurité et accès' : 'Security and access'}</h2><button disabled={loading} onClick={() => void load()} aria-label={fr ? 'Actualiser les journaux' : 'Refresh logs'} title={fr ? 'Actualiser' : 'Refresh'} className="flex size-11 items-center justify-center rounded border border-white/20"><RefreshCw size={18} /></button></div>
    <div className="grid gap-4 border-b border-white/10 pb-5 sm:grid-cols-3"><div><p className="text-sm text-neutral-400">{fr ? 'Événements chargés' : 'Loaded events'}</p><p className="mt-2 text-xl">{logs.length}</p></div><div><p className="text-sm text-neutral-400">{fr ? 'Refus et limitations enregistrés' : 'Recorded refusals and rate limits'}</p><p className="mt-2 text-xl">{blockedCount}</p></div><div><p className="text-sm text-neutral-400">{fr ? 'Événements filtrés' : 'Matching events'}</p><p className="mt-2 text-xl">{visible.length}</p></div></div>
    <div className="flex flex-wrap items-end gap-4"><label className="min-w-0 flex-1 text-sm"><span className="flex items-center gap-2"><Search size={16} />{fr ? 'Rechercher' : 'Search'}</span><input value={search} onChange={event => setSearch(event.target.value)} className="mt-2 min-h-11 w-full rounded border border-white/20 bg-black px-3 text-base" /></label><label className="text-sm">Date<input type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-2 block min-h-11 rounded border border-white/20 bg-black px-3 text-base" /></label><button onClick={() => { setSearch(''); setDate(''); }} className="min-h-11 rounded border border-white/20 px-4 text-sm">{fr ? 'Réinitialiser' : 'Reset'}</button></div>
    <div className="flex flex-wrap items-center justify-between gap-4"><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={archives} onChange={event => setArchives(event.target.checked)} className="size-5 accent-amber-400" />{fr ? 'Inclure les archives' : 'Include archive'}</label><button disabled={loading} onClick={() => void archive()} className="inline-flex min-h-11 items-center gap-2 rounded border border-white/20 px-4 text-sm"><Archive size={16} />{fr ? 'Vider la vue active (archiver)' : 'Clear active view (archive)'}</button></div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}{loading && <p role="status" className="text-sm text-neutral-400">{fr ? 'Chargement…' : 'Loading…'}</p>}
    <ul className="divide-y divide-white/10">{visible.map(log => <li key={log.id} className="space-y-2 py-4 text-sm"><div className="flex flex-wrap justify-between gap-3"><time className="text-xs text-neutral-400">{Number.isFinite(Date.parse(log.timestamp)) ? new Date(log.timestamp).toLocaleString(fr ? 'fr-FR' : 'en-GB') : log.timestamp}</time><span className={['SECURED', 'READ'].includes(log.status) ? 'text-neutral-400' : 'text-amber-300'}>{log.status}</span></div><p className="break-words">{log.event}</p><p className="break-words text-xs text-neutral-400">IP : {log.ip || (fr ? 'inconnue' : 'unknown')}{log.country || log.city ? ` · ${[log.city, log.country].filter(Boolean).join(', ')} (${fr ? 'approximatif' : 'approximate'})` : ''}{log.archivedAt ? ` · ${fr ? 'Archivé' : 'Archived'}` : ''}</p></li>)}</ul>
    {!visible.length && !loading && <p className="text-sm text-neutral-400">{fr ? 'Aucun événement ne correspond aux filtres.' : 'No events match these filters.'}</p>}
    <p className="text-xs leading-6 text-neutral-400">{fr ? 'Derniers événements enregistrés, limités à 1 000 lignes par chargement. Une IP ou une localisation approximative ne permet pas d’identifier avec certitude une personne.' : 'Most recent recorded events, limited to 1,000 rows per load. An IP address or approximate location does not reliably identify a person.'}</p>
  </section>;
}
