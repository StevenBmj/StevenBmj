import { useEffect, useState } from 'react';
import { Mail, RefreshCw, Search } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import VipMessageComposer from './VipMessageComposer';
import { orderMoney } from '../lib/delivery';

export default function CustomerManagement() {
  const { language, preparedVipMessage, setPreparedVipMessage } = useApp(); const fr = language === 'FR';
  const [filter, setFilter] = useState('year');
  const [dates, setDates] = useState({ from: '', to: '' });
  const [ranking, setRanking] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setError('');
    void apiFetch('/api/auth/users', { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); return response.json(); }).then(data => { if (!controller.signal.aborted) setUsers(data); }).catch(() => { if (!controller.signal.aborted) setError(fr ? 'Liste des comptes indisponible.' : 'Account list unavailable.'); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    setRanking(null); if (filter === 'custom' && (!dates.from || !dates.to)) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ resource: 'vip-customers', ...(filter === 'custom' ? dates : { filter }) });
    void apiFetch(`/api/shop?${query}`, { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); return response.json(); }).then(data => { if (!controller.signal.aborted) setRanking(data); }).catch(() => { if (!controller.signal.aborted) setError(fr ? 'Classement indisponible. Vérifiez les dates.' : 'Ranking unavailable. Check the dates.'); });
    return () => controller.abort();
  }, [filter, dates.from, dates.to, attempt]);
  const matches = (value: any) => `${value.name || value.customerName} ${value.email} ${value.whatsapp}`.toLowerCase().includes(search.toLowerCase());
  const field = 'mt-2 min-h-11 rounded border border-white/20 bg-black px-3 py-2 text-base';
  const control = 'inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/20 px-3 text-sm';
  return <section className="min-w-0 space-y-6" aria-label={fr ? 'Clientèle et fidélité' : 'Customers and loyalty'}>
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5"><h2 className="text-2xl">{fr ? 'Clientèle et fidélité' : 'Customers and loyalty'}</h2><button className={control} onClick={() => setAttempt(value => value + 1)} title={fr ? 'Actualiser' : 'Refresh'} aria-label={fr ? 'Actualiser les clients' : 'Refresh customers'}><RefreshCw size={18} /></button></div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <label className="flex min-w-0 items-center gap-3"><Search size={18} /><input aria-label={fr ? 'Rechercher un client' : 'Search customers'} className={`${field} w-full min-w-0`} value={search} onChange={event => setSearch(event.target.value)} /></label>
    {preparedVipMessage && !recipient && <div className="space-y-3 border-l border-amber-400 pl-4"><p className="whitespace-pre-wrap break-words text-sm">{preparedVipMessage}</p><button className={control} onClick={() => setPreparedVipMessage('')}>{fr ? 'Abandonner ce brouillon' : 'Discard draft'}</button></div>}
    {recipient && <VipMessageComposer key={recipient.email || recipient.whatsapp} initialMessage={preparedVipMessage} recipient={recipient} close={() => setRecipient(null)} />}
    <div className="flex flex-wrap items-end gap-4"><label className="text-sm">{fr ? 'Période des achats payés' : 'Paid purchase period'}<select className={`${field} block`} value={filter} onChange={event => setFilter(event.target.value)}>{['day', 'week', 'month', 'year', 'custom'].map((value, index) => <option value={value} key={value}>{(fr ? ['Aujourd’hui', 'Cette semaine', 'Ce mois', 'Cette année', 'Dates personnalisées'] : ['Today', 'This week', 'This month', 'This year', 'Custom dates'])[index]}</option>)}</select></label>{filter === 'custom' && (['from', 'to'] as const).map(key => <label key={key} className="text-sm">{key === 'from' ? (fr ? 'Du' : 'From') : (fr ? 'Au' : 'To')}<input type="date" value={dates[key]} onChange={event => setDates({ ...dates, [key]: event.target.value })} className={`${field} block`} /></label>)}</div>
    <section className="space-y-4"><h3 className="text-lg">{fr ? 'Meilleurs clients par devise' : 'Top customers by currency'}</h3>{ranking && <p className="text-sm text-neutral-400">{ranking.from} → {ranking.to}{ranking.truncated ? (fr ? ' · Résultats partiels' : ' · Partial results') : ''}</p>}<ul className="divide-y divide-white/10">{ranking?.customers.filter(matches).map((customer: any) => <li key={`${customer.email}:${customer.currency}`} className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="break-words text-sm">{customer.customerName}</p><p className="mt-1 break-all text-xs text-neutral-400">{customer.email}</p></div><p className="text-sm tabular-nums">{customer.orders} · {orderMoney(customer.paidCents / 100, customer.currency, language)}</p><button className={control} onClick={() => setRecipient(customer)}><Mail size={16} />{fr ? 'Message' : 'Message'}</button></li>)}</ul>{ranking?.customers.length === 0 && <p className="text-sm text-neutral-400">{fr ? 'Aucun achat payé pour cette période.' : 'No paid purchases in this period.'}</p>}</section>
    <section className="space-y-4 border-t border-white/10 pt-6"><h3 className="text-lg">{fr ? 'Comptes enregistrés' : 'Registered accounts'}</h3><ul className="divide-y divide-white/10">{users.filter(matches).map(account => <li key={account.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="break-words text-sm">{account.name}</p><p className="mt-1 break-all text-xs text-neutral-400">{account.email}</p><p className="mt-1 text-xs text-neutral-400">{account.isAdmin ? (fr ? 'Administration' : 'Administrator') : account.isConfirmed ? (fr ? 'Adresse vérifiée' : 'Email verified') : (fr ? 'Validation en attente' : 'Verification pending')}</p></div>{!account.isAdmin && account.isConfirmed && <button className={control} onClick={() => setRecipient({ customerName: account.name, email: account.email, whatsapp: account.whatsapp })}><Mail size={16} />Message</button>}</li>)}</ul></section>
  </section>;
}
