import { useEffect, useState } from 'react';
import { Download, LoaderCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import type { salesReport } from '../server/reports';

type Report = ReturnType<typeof salesReport>;
type PeriodFilter = 'day' | 'week' | 'month' | 'year' | 'custom';

export default function SalesReports() {
  const { language } = useApp();
  const fr = language === 'FR';
  const [filter, setFilter] = useState<PeriodFilter>('month');
  const [dates, setDates] = useState({ from: '', to: '', compareFrom: '', compareTo: '' });
  const [customCompare, setCustomCompare] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const field = 'block w-full mt-1 bg-neutral-950 rounded border border-white/15 px-3 min-h-11 text-sm text-white';
  useEffect(() => {
    if (filter === 'custom' && (!dates.from || !dates.to)) return;
    if (customCompare && (!dates.compareFrom || !dates.compareTo)) return;
    const controller = new AbortController();
    const query = new URLSearchParams(filter === 'custom' ? { from: dates.from, to: dates.to } : { filter });
    if (customCompare) { query.set('compareFrom', dates.compareFrom); query.set('compareTo', dates.compareTo); }
    setLoading(true); setError(false);
    void apiFetch(`/api/analytics?${query}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Report unavailable');
      const data = await response.json();
      if (!data.current || !data.previous) throw new Error('Invalid report');
      if (!controller.signal.aborted) setReport(data);
    }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, dates.from, dates.to, dates.compareFrom, dates.compareTo, customCompare, attempt]);

  const money = (cents: number, currency: string) => currency === 'UNKNOWN' ? `${(cents / 100).toFixed(2)} (?)`
    : new Intl.NumberFormat(fr ? 'fr-FR' : 'en-US', { style: 'currency', currency }).format(cents / 100);
  function exportCsv() {
    if (!report || loading || error) return;
    const rows: (string | number)[][] = [['period', 'from', 'to', 'currency', 'orders', 'cancelled', 'ordered', 'paid', 'pending', 'refunded', 'unknown']];
    for (const [name, period] of Object.entries({ current: report.current, previous: report.previous })) {
      for (const value of period.totals) rows.push([name, period.from, period.to, value.currency, value.orders, value.cancelled,
        value.orderedCents / 100, value.paidCents / 100, value.pendingCents / 100, value.refundedCents / 100, value.unknownCents / 100]);
    }
    const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `stevenbmj-ventes-${report.current.from}-${report.current.to}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="space-y-6 min-w-0" aria-label={fr ? 'Rapports des ventes' : 'Sales reports'}>
    <div className="flex flex-wrap justify-between items-center gap-3 border-b border-white/10 pb-4">
      <h2 className="text-xl font-medium text-white">{fr ? 'Rapports des ventes' : 'Sales reports'}</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAttempt(value => value + 1)} aria-label={fr ? 'Actualiser les rapports' : 'Refresh reports'} title={fr ? 'Actualiser' : 'Refresh'} className="h-11 w-11 rounded border border-white/15 flex items-center justify-center"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        <button type="button" onClick={exportCsv} disabled={!report || loading || error} className="min-h-11 rounded border border-white/15 px-3 flex items-center gap-2 text-sm disabled:opacity-40"><Download className="w-4 h-4" />CSV</button>
      </div>
    </div>
    <div className="flex flex-wrap gap-4 items-end">
      <label className="text-xs text-neutral-400">{fr ? 'Période' : 'Period'}
        <select value={filter} onChange={event => { const next = event.target.value as PeriodFilter; if (next === 'custom' && report) setDates(value => ({ ...value, from: value.from || report.current.from, to: value.to || report.current.to })); setFilter(next); }} className={field}>
          <option value="day">{fr ? 'Aujourd’hui' : 'Today'}</option><option value="week">{fr ? 'Cette semaine' : 'This week'}</option>
          <option value="month">{fr ? 'Ce mois' : 'This month'}</option><option value="year">{fr ? 'Cette année' : 'This year'}</option>
          <option value="custom">{fr ? 'Dates personnalisées' : 'Custom dates'}</option>
        </select>
      </label>
      {filter === 'custom' && (['from', 'to'] as const).map(key => <label key={key} className="text-xs text-neutral-400">{key === 'from' ? (fr ? 'Du' : 'From') : (fr ? 'Au' : 'To')}<input type="date" value={dates[key]} onChange={event => setDates({ ...dates, [key]: event.target.value })} className={field} /></label>)}
      <label className="min-h-11 flex items-center gap-2 text-xs text-neutral-300"><input type="checkbox" checked={customCompare} className="accent-amber-300" onChange={event => {
        if (event.target.checked && report) setDates(value => ({ ...value, compareFrom: value.compareFrom || report.previous.from, compareTo: value.compareTo || report.previous.to }));
        setCustomCompare(event.target.checked);
      }} />{fr ? 'Choisir la comparaison' : 'Custom comparison'}</label>
    </div>
    {customCompare && <div className="flex flex-wrap gap-4">{(['compareFrom', 'compareTo'] as const).map(key => <label key={key} className="text-xs text-neutral-400">{key === 'compareFrom' ? (fr ? 'Comparer du' : 'Compare from') : (fr ? 'Comparer au' : 'Compare to')}<input type="date" value={dates[key]} onChange={event => setDates({ ...dates, [key]: event.target.value })} className={field} /></label>)}</div>}
    {loading && <p role="status" className="flex items-center gap-2 text-sm text-neutral-400"><LoaderCircle className="w-4 h-4 animate-spin" />{fr ? 'Chargement des rapports...' : 'Loading reports...'}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{fr ? 'Rapport indisponible. Vérifiez les dates et réessayez.' : 'Report unavailable. Check the dates and retry.'}</p>}
    {report && !error && <div className={`space-y-7 ${loading ? 'opacity-50' : ''}`}>
      <div className="text-xs text-neutral-400 space-y-1"><p>{report.current.from} → {report.current.to} · {report.timeZone}</p><p>{fr ? 'Comparaison' : 'Comparison'} : {report.previous.from} → {report.previous.to}</p></div>
      {report.truncated && <p role="alert" className="text-sm text-amber-200">{fr ? 'Rapport partiel : réduisez la période.' : 'Partial report: use a shorter period.'}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left"><caption className="sr-only">{fr ? 'Montants par devise' : 'Amounts by currency'}</caption>
          <thead className="text-xs text-neutral-400 border-b border-white/10"><tr>{(fr ? ['Devise', 'Commandes', 'Montant commandé', 'Paiements confirmés', 'En attente', 'Remboursé', 'Non renseigné', 'Évolution des paiements'] : ['Currency', 'Orders', 'Ordered amount', 'Confirmed payments', 'Pending', 'Refunded', 'Unknown', 'Payment change']).map(label => <th key={label} className="py-3 pr-5 font-normal whitespace-nowrap">{label}</th>)}</tr></thead>
          <tbody>{report.current.totals.map(total => {
            const previous = report.previous.totals.find(value => value.currency === total.currency)?.paidCents || 0;
            const delta = previous ? `${((total.paidCents - previous) / previous * 100).toFixed(1)}%` : null;
            return <tr key={total.currency} className="border-b border-white/10"><th className="py-4 pr-5 font-medium">{total.currency}</th><td className="py-4 pr-5">{total.orders}</td>
              {[total.orderedCents, total.paidCents, total.pendingCents, total.refundedCents, total.unknownCents].map((amount, i) => <td key={i} className={`py-4 pr-5 whitespace-nowrap tabular-nums ${i === 1 ? 'text-emerald-300' : 'text-neutral-300'}`}>{money(amount, total.currency)}</td>)}
              <td className="py-4 pr-5 tabular-nums">{delta || '—'}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <dl className="grid sm:grid-cols-2 gap-4 text-sm border-b border-white/10 pb-6">
        <div><dt className="text-neutral-400">{fr ? 'Bénéfice net' : 'Net profit'}</dt><dd className="mt-1">{fr ? 'Non renseigné : coûts et charges manquants' : 'Unknown: costs and expenses missing'}</dd></div>
        <div><dt className="text-neutral-400">{fr ? 'Visites et conversion' : 'Visits and conversion'}</dt><dd className="mt-1">{fr ? 'Non mesurées' : 'Not measured'}</dd></div>
      </dl>
      <div className="grid xl:grid-cols-2 gap-8">
        <div><h3 className="text-sm font-medium mb-4">{fr ? 'Meilleurs clients · commandes payées' : 'Top customers · paid orders'}</h3>
          {report.current.topCustomers.length === 0 ? <p className="text-sm text-neutral-400">{fr ? 'Aucun paiement confirmé pour cette période.' : 'No confirmed payments for this period.'}</p> : <ul className="divide-y divide-white/10">{report.current.topCustomers.slice(0, 10).map(customer => <li key={`${customer.email}:${customer.currency}`} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><div className="min-w-0"><p className="break-words">{customer.customerName}</p><p className="text-xs text-neutral-500 break-all">{customer.email}</p></div><span className="text-amber-300 tabular-nums">{money(customer.paidCents, customer.currency)}</span></li>)}</ul>}
        </div>
        <div><h3 className="text-sm font-medium mb-4">{fr ? 'Produits · commandes payées' : 'Products · paid orders'}</h3>
          {report.current.topProducts.length === 0 ? <p className="text-sm text-neutral-400">{fr ? 'Aucun article payé pour cette période.' : 'No paid items for this period.'}</p> : <ul className="divide-y divide-white/10">{report.current.topProducts.slice(0, 10).map(product => <li key={`${product.id}:${product.currency}`} className="flex justify-between gap-3 py-3 text-sm"><span className="break-words min-w-0">{product.name}</span><span className="shrink-0 text-neutral-300">{product.quantity} ×</span></li>)}</ul>}
        </div>
      </div>
      <p className="text-xs text-neutral-500">{fr ? 'Base : date de commande et statut du paiement enregistré.' : 'Basis: order date and recorded payment status.'}</p>
    </div>}
  </section>;
}
