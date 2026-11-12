import { useEffect, useRef, useState } from 'react';
import { Download, Plus, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { downloadCsv, downloadReportPdf } from '../lib/reportExport';
import type { readCashReport } from '../server/cashReports';

type Ledger = Awaited<ReturnType<typeof readCashReport>>;
const field = 'mt-2 min-h-11 w-full rounded border border-white/20 bg-black px-3 py-2 text-base text-white';
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/20 px-4 py-2 text-sm disabled:opacity-50';

export default function LedgerReports() {
  const { language } = useApp();
  const fr = language === 'FR';
  const [filter, setFilter] = useState('month');
  const [dates, setDates] = useState({ from: '', to: '', compareFrom: '', compareTo: '' });
  const [compare, setCompare] = useState(false);
  const [data, setData] = useState<Ledger | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', currency: 'EUR', category: 'other', description: '', date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Porto-Novo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) });
  const request = useRef({ key: '', id: '' });
  const [page, setPage] = useState(0);
  const money = (minor: number, currency: string) => new Intl.NumberFormat(fr ? 'fr-FR' : 'en-GB', { style: 'currency', currency }).format(minor / (currency === 'XOF' ? 1 : 100));
  const labels: Record<string, string> = fr ? { inventory: 'Achats de stock', delivery: 'Livraison', fees: 'Frais', rent: 'Loyer', tax: 'Taxes', other: 'Autre' } : { inventory: 'Inventory purchases', delivery: 'Delivery', fees: 'Fees', rent: 'Rent', tax: 'Taxes', other: 'Other' };
  useEffect(() => {
    if (filter === 'custom' && (!dates.from || !dates.to) || compare && (!dates.compareFrom || !dates.compareTo)) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ resource: 'ledger', ...(filter === 'custom' ? { from: dates.from, to: dates.to } : { filter }) });
    if (compare) { query.set('compareFrom', dates.compareFrom); query.set('compareTo', dates.compareTo); }
    setData(null); setLoading(true); setError(''); setPage(0);
    void apiFetch(`/api/shop?${query}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!data.report?.current || !data.report?.previous) throw new Error();
      if (!controller.signal.aborted) setData(data);
    }).catch(() => { if (!controller.signal.aborted) setError(fr ? 'Rapport indisponible. Vérifiez la période et réessayez.' : 'Report unavailable. Check the period and retry.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, dates.from, dates.to, dates.compareFrom, dates.compareTo, compare, attempt]);

  const exportData = async (pdf: boolean) => {
    if (!data || busy || loading || error) return;
    setBusy(true); setError('');
    try {
      const headers = fr ? ['Période', 'Devise', 'Encaissements', 'Remboursements', 'Charges', 'Solde de trésorerie'] : ['Period', 'Currency', 'Receipts', 'Refunds', 'Expenses', 'Net cash flow'];
      const rows = [data.report.current, data.report.previous].flatMap(period => period.totals.map(total => [
        `${period.from} - ${period.to}`, total.currency, money(total.receiptsMinor, total.currency), money(total.refundsMinor, total.currency), money(total.expensesMinor, total.currency), money(total.netCashMinor, total.currency),
      ]));
      const name = `stevenbmj-tresorerie-${data.report.current.from}-${data.report.current.to}`;
      if (pdf) await downloadReportPdf(fr ? 'Flux de trésorerie enregistrés' : 'Recorded cash flow', `${data.report.current.from} - ${data.report.current.to} · ${data.report.timeZone}`, headers, rows, `${name}.pdf`);
      else downloadCsv([headers, ...rows], `${name}.csv`);
    } catch { setError(fr ? 'Export impossible. Réessayez.' : 'Export failed. Please retry.'); }
    finally { setBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    const payload = { amountMinor: Math.round(Number(form.amount) * (form.currency === 'XOF' ? 1 : 100)), currency: form.currency, category: form.category, description: form.description, date: form.date };
    const key = JSON.stringify(payload);
    if (request.current.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/shop?resource=ledger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, requestId: request.current.id }) });
      if (!response.ok) throw new Error();
      setForm(value => ({ ...value, amount: '', description: '' })); setShowForm(false); setAttempt(value => value + 1);
    } catch { setError(fr ? 'Charge non enregistrée. Vérifiez les champs puis réessayez.' : 'Expense not saved. Check the fields and retry.'); }
    finally { setBusy(false); }
  };
  const journal = data ? [
    ...data.payments.map(entry => ({ id: entry.id, date: entry.created_at.slice(0, 10), label: `${entry.kind === 'payment' ? (fr ? 'Paiement' : 'Payment') : (fr ? 'Remboursement' : 'Refund')} · ${entry.order_id} · ${entry.reference}`, amount: entry.amount_minor, currency: entry.currency })),
    ...data.expenses.map(entry => ({ id: entry.id, date: entry.incurred_on, label: `${labels[entry.category] || ''} · ${entry.description}`, amount: entry.amount_minor, currency: entry.currency })),
  ].sort((a, b) => b.date.localeCompare(a.date)) : [];

  return <section className="min-w-0 space-y-6" aria-label={fr ? 'Comptabilité de gestion' : 'Management accounting'}>
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5"><h2 className="text-2xl font-medium">{fr ? 'Comptabilité de gestion' : 'Management accounting'}</h2><div className="flex flex-wrap gap-3"><button onClick={() => setAttempt(value => value + 1)} aria-label={fr ? 'Actualiser la comptabilité' : 'Refresh accounting'} title={fr ? 'Actualiser' : 'Refresh'} className={button}><RefreshCw size={18} /></button><button disabled={!data || loading || busy || !!error} onClick={() => void exportData(false)} className={button}><Download size={16} />CSV</button><button disabled={!data || loading || busy || !!error} onClick={() => void exportData(true)} className={button}><Download size={16} />PDF</button></div></div>
    <div className="flex flex-wrap items-end gap-4"><label className="text-sm">{fr ? 'Période' : 'Period'}<select value={filter} onChange={event => setFilter(event.target.value)} className={field}>
      {(['day', 'week', 'month', 'year', 'custom'] as const).map((value, index) => <option key={value} value={value}>{(fr ? ['Aujourd’hui', 'Cette semaine', 'Ce mois', 'Cette année', 'Dates personnalisées'] : ['Today', 'This week', 'This month', 'This year', 'Custom dates'])[index]}</option>)}
    </select></label>{filter === 'custom' && (['from', 'to'] as const).map(key => <label key={key} className="text-sm">{key === 'from' ? (fr ? 'Du' : 'From') : (fr ? 'Au' : 'To')}<input type="date" value={dates[key]} onChange={event => setDates({ ...dates, [key]: event.target.value })} className={field} /></label>)}<label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={compare} onChange={event => setCompare(event.target.checked)} className="size-5 accent-amber-400" />{fr ? 'Choisir la comparaison' : 'Custom comparison'}</label></div>
    {compare && <div className="flex flex-wrap gap-4">{(['compareFrom', 'compareTo'] as const).map(key => <label key={key} className="text-sm">{key === 'compareFrom' ? (fr ? 'Comparer du' : 'Compare from') : (fr ? 'Comparer au' : 'Compare to')}<input type="date" value={dates[key]} onChange={event => setDates({ ...dates, [key]: event.target.value })} className={field} /></label>)}</div>}
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}{loading && <p role="status" className="text-sm text-neutral-400">{fr ? 'Chargement des écritures…' : 'Loading entries…'}</p>}
    {data && !loading && <><p className="text-sm text-neutral-400">{data.report.current.from} → {data.report.current.to} · {data.report.timeZone}<br />{fr ? 'Comparaison :' : 'Comparison:'} {data.report.previous.from} → {data.report.previous.to}</p>
      {data.report.truncated && <p role="alert" className="text-sm text-amber-300">{fr ? 'Rapport partiel : réduisez la période.' : 'Partial report: choose a shorter period.'}</p>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{fr ? 'Flux de trésorerie par devise' : 'Cash flow by currency'}</caption><thead><tr>{(fr ? ['Devise', 'Encaissements', 'Remboursements', 'Charges', 'Solde', 'Période précédente'] : ['Currency', 'Receipts', 'Refunds', 'Expenses', 'Net cash', 'Previous period']).map(label => <th key={label} className="whitespace-nowrap border-b border-white/10 p-3 font-medium text-neutral-400">{label}</th>)}</tr></thead><tbody>{data.report.current.totals.map(total => <tr key={total.currency}><th className="p-3">{total.currency}</th>{[total.receiptsMinor, total.refundsMinor, total.expensesMinor, total.netCashMinor, data.report.previous.totals.find(value => value.currency === total.currency)?.netCashMinor || 0].map((value, index) => <td key={index} className="whitespace-nowrap border-b border-white/10 p-3 tabular-nums">{money(value, total.currency)}</td>)}</tr>)}</tbody></table></div>
      <p className="text-sm leading-7 text-neutral-400">{fr ? 'Base : paiements et remboursements vérifiés par l’administration, et charges saisies. Les anciennes commandes sans écriture de paiement ne sont pas incluses. Le solde de trésorerie n’est pas un bénéfice comptable ; bilan et résultat nécessitent notamment les soldes d’ouverture, les coûts de revient et les règles fiscales.' : 'Basis: administrator-verified payments and refunds, and recorded expenses. Historical orders without payment entries are not included. Net cash flow is not accounting profit; a balance sheet and income statement also require opening balances, cost of goods and tax rules.'}</p>
    </>}
    <div className="border-t border-white/10 pt-6"><button onClick={() => setShowForm(value => !value)} className={button}><Plus size={18} />{fr ? 'Enregistrer une charge' : 'Record expense'}</button></div>
    {showForm && <form onSubmit={submit} className="max-w-2xl space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">{fr ? 'Montant payé' : 'Amount paid'}<input required min={form.currency === 'XOF' ? '1' : '0.01'} max="1000000000" type="number" step={form.currency === 'XOF' ? '1' : '0.01'} value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} className={field} /></label><label className="text-sm">{fr ? 'Devise' : 'Currency'}<select value={form.currency} onChange={event => setForm({ ...form, currency: event.target.value })} className={field}>{['EUR', 'USD', 'XOF'].map(value => <option key={value}>{value}</option>)}</select></label><label className="text-sm">{fr ? 'Catégorie' : 'Category'}<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className={field}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm">Date<input required type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className={field} /></label></div><label className="block text-sm">{fr ? 'Libellé et référence du justificatif' : 'Description and evidence reference'}<input required minLength={3} maxLength={500} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={field} /></label><button disabled={busy} className={`${button} bg-amber-400 text-black`}>{fr ? 'Enregistrer la charge' : 'Save expense'}</button></form>}
    <section className="space-y-4 border-t border-white/10 pt-6"><h3 className="text-lg">{fr ? 'Journal des écritures' : 'Entry journal'}</h3>{!journal.length ? <p className="text-sm text-neutral-400">{fr ? 'Aucune écriture sur cette période.' : 'No entries for this period.'}</p> : <><ul className="divide-y divide-white/10">{journal.slice(page * 30, page * 30 + 30).map(entry => <li key={entry.id} className="flex flex-wrap justify-between gap-3 py-4 text-sm"><div className="min-w-0"><p className="text-xs text-neutral-400">{entry.date}</p><p className="mt-1 break-words">{entry.label}</p></div><p className="tabular-nums">{money(Number(entry.amount), entry.currency)}</p></li>)}</ul><div className="flex items-center gap-3"><button disabled={page === 0} className={button} onClick={() => setPage(value => value - 1)}>{fr ? 'Précédent' : 'Previous'}</button><span className="text-sm">{page + 1}/{Math.ceil(journal.length / 30)}</span><button disabled={(page + 1) * 30 >= journal.length} className={button} onClick={() => setPage(value => value + 1)}>{fr ? 'Suivant' : 'Next'}</button></div></>}</section>
  </section>;
}
