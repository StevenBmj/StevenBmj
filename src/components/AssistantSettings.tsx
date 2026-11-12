import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import AssistantPanel from './AssistantPanel';

type KeyInfo = { id: string; scope: 'client' | 'admin'; label: string; suffix: string; model: string;
  speechModel: string; speechVoice: string; enabled: boolean; lastUsedAt: string | null };

export default function AssistantSettings() {
  const { language } = useApp();
  const fr = language === 'FR';
  const [scope, setScope] = useState<'client' | 'admin'>('client');
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [ready, setReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [tested, setTested] = useState('');
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({ label: '', apiKey: '', model: 'openai/gpt-4o-mini', speechModel: '', speechVoice: '' });
  const inputClass = 'mt-2 w-full min-w-0 rounded border border-white/15 bg-neutral-950 px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-300';

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await apiFetch('/api/assistant/keys');
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      setKeys(data.keys); setReady(data.configured === true);
    } catch { setError(fr ? 'Configuration indisponible. Réessayez.' : 'Configuration unavailable. Please retry.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function mutate(method: string, body: any, id: string) {
    if (busy) return;
    setBusy(id); setError(''); setTested('');
    try {
      const response = await apiFetch('/api/assistant/keys', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, scope }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(fr ? (data.error || 'Enregistrement impossible.') : 'Unable to complete this action. Check the key and server configuration.');
        return;
      }
      if (body.action === 'test') setTested(id);
      else {
        if (method === 'POST') setForm(previous => ({ ...previous, apiKey: '', label: '' }));
        await load();
      }
    } catch { setError(fr ? 'Connexion interrompue. Réessayez.' : 'Connection interrupted. Please retry.'); }
    finally { setBusy(''); }
  }
  return <section className="space-y-8 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
      <h2 className="text-xl text-white font-medium">{fr ? 'Assistants & clés API' : 'Assistants & API keys'}</h2>
      <button type="button" onClick={load} title={fr ? 'Actualiser' : 'Refresh'} aria-label={fr ? 'Actualiser' : 'Refresh'} className="h-11 w-11 flex items-center justify-center rounded border border-white/15"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
    </div>
    <div role="tablist" aria-label={fr ? 'Périmètre' : 'Scope'} className="flex border-b border-white/10">
      {(['client', 'admin'] as const).map(value => <button type="button" role="tab" aria-selected={scope === value} key={value}
        onClick={() => { setScope(value); setForm(previous => ({ ...previous, apiKey: '' })); setError(''); }}
        className={`min-h-11 px-4 border-b-2 text-sm ${scope === value ? 'border-amber-300 text-amber-300' : 'border-transparent text-neutral-400'}`}>
        {value === 'client' ? (fr ? 'Conseiller client' : 'Customer advisor') : (fr ? 'Assistant administrateur' : 'Administration assistant')}</button>)}
    </div>
    {ready === false && <p role="alert" className="text-sm text-amber-200">{fr ? 'AI_ENCRYPTION_KEY n’est pas configurée sur le serveur.' : 'AI_ENCRYPTION_KEY is not configured on the server.'}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <form onSubmit={event => { event.preventDefault(); void mutate('POST', form, 'new'); }} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm text-neutral-300">{fr ? 'Nom de la clé' : 'Key name'}<input required maxLength={60} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className={inputClass} /></label>
        <label className="text-sm text-neutral-300">OpenRouter<div className="relative"><input required type={visible ? 'text' : 'password'} autoComplete="off" spellCheck={false} maxLength={220}
          value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value.trim() })} placeholder="sk-or-v1-..." className={`${inputClass} pr-12`} />
          <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? (fr ? 'Masquer la clé' : 'Hide key') : (fr ? 'Afficher la clé' : 'Show key')}
            title={visible ? (fr ? 'Masquer la clé' : 'Hide key') : (fr ? 'Afficher la clé' : 'Show key')} className="absolute right-0 bottom-0 h-11 w-11 flex items-center justify-center text-neutral-400">{visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div></label>
        <label className="text-sm text-neutral-300">{fr ? 'Modèle de conversation' : 'Chat model'}<input required maxLength={160} value={form.model} onChange={e => setForm({ ...form, model: e.target.value.trim() })} className={inputClass} /></label>
        <label className="text-sm text-neutral-300">{fr ? 'Modèle vocal (facultatif, MP3)' : 'Speech model (optional, MP3)'}<input maxLength={160} value={form.speechModel} onChange={e => setForm({ ...form, speechModel: e.target.value.trim() })} className={inputClass} /></label>
        <label className="text-sm text-neutral-300">{fr ? 'Voix (selon le modèle)' : 'Voice (model-specific)'}<input maxLength={80} value={form.speechVoice} onChange={e => setForm({ ...form, speechVoice: e.target.value.trim() })} className={inputClass} /></label>
      </div>
      <button type="submit" disabled={!!busy || ready !== true} className="min-h-11 inline-flex items-center gap-2 rounded bg-amber-300 px-4 text-sm font-medium text-black disabled:opacity-40">{busy === 'new' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{fr ? 'Ajouter la clé' : 'Add key'}</button>
    </form>
    <ul className="divide-y divide-white/10 border-y border-white/10">
      {!loading && keys.filter(key => key.scope === scope).length === 0 && <li className="py-5 text-sm text-neutral-400">{fr ? 'Aucune clé pour cet assistant.' : 'No key configured for this assistant.'}</li>}
      {keys.filter(key => key.scope === scope).map(key => <li key={key.id} className="py-4 flex flex-wrap items-center gap-3">
        <KeyRound className="w-4 h-4 text-amber-300 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm text-white break-words">{key.label} <span className="text-neutral-500">••••{key.suffix}</span></p><p className="text-xs text-neutral-400 break-all mt-1">{key.model}{key.speechModel ? ` · ${key.speechModel}` : ''}</p></div>
        <label className="flex items-center gap-2 text-xs text-neutral-300"><input type="checkbox" checked={key.enabled} disabled={!!busy} onChange={e => void mutate('PATCH', { id: key.id, enabled: e.target.checked }, key.id)} className="accent-amber-300" />{fr ? 'Active' : 'Enabled'}</label>
        <button type="button" disabled={!!busy} onClick={() => void mutate('POST', { id: key.id, action: 'test' }, key.id)} title={fr ? 'Tester la clé' : 'Test key'} aria-label={fr ? 'Tester la clé' : 'Test key'} className="h-11 w-11 flex items-center justify-center rounded hover:bg-white/10">{tested === key.id ? <Check className="w-4 h-4 text-emerald-300" /> : <ShieldCheck className="w-4 h-4" />}</button>
        <button type="button" disabled={!!busy} onClick={() => { if (window.confirm(fr ? 'Supprimer cette clé ?' : 'Delete this key?')) void mutate('DELETE', { id: key.id }, key.id); }} title={fr ? 'Supprimer la clé' : 'Delete key'} aria-label={fr ? 'Supprimer la clé' : 'Delete key'} className="h-11 w-11 flex items-center justify-center rounded text-red-300 hover:bg-white/10"><Trash2 className="w-4 h-4" /></button>
      </li>)}
    </ul>
    {scope === 'admin' && <AssistantPanel scope="admin" />}
  </section>;
}
