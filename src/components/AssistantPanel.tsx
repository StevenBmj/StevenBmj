import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, Check, LoaderCircle, Send, ShoppingBag, Volume2, VolumeX, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import Logo from './Logo';

type Message = { role: 'user' | 'assistant'; content: string; recommendations?: string[];
  contactDraft?: { name: string; email: string; message: string }; speechToken?: string };

export default function AssistantPanel({ scope = 'client', onClose }: { scope?: 'client' | 'admin'; onClose?: () => void }) {
  const { language, products, addToCart, formatPrice, setPreparedContact } = useApp();
  const { navigate, setView } = useNavigation();
  const fr = language === 'FR';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [voice, setVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [added, setAdded] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const pending = useRef<AbortController | null>(null);
  const speechRequest = useRef<AbortController | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef('');
  const voiceEnabled = useRef(false);
  const playback = useRef(0);

  function stopSpeech() {
    playback.current++;
    speechRequest.current?.abort();
    audio.current?.pause(); audio.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = '';
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  useEffect(() => () => { pending.current?.abort(); stopSpeech(); }, []);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => { stopSpeech(); }, [language]);

  async function speak(message: Message) {
    stopSpeech();
    if (!voiceEnabled.current) return;
    const sequence = playback.current;
    const controller = new AbortController(); speechRequest.current = controller;
    setSpeaking(true);
    try {
      const response = await apiFetch('/api/assistant/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: message.speechToken }), signal: controller.signal });
      if (!response.ok) throw new Error('Speech unavailable');
      const data = await response.json();
      if (!voiceEnabled.current || sequence !== playback.current) return;
      const bytes = Uint8Array.from(atob(data.audio), char => char.charCodeAt(0));
      audioUrl.current = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      const player = new Audio(audioUrl.current); audio.current = player;
      player.onended = stopSpeech;
      await player.play();
    } catch {
      if (controller.signal.aborted || !voiceEnabled.current || sequence !== playback.current) return;
      // Device speech keeps output available if no compatible provider voice is configured.
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = fr ? 'fr-FR' : 'en-US'; utterance.rate = 1;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else setSpeaking(false);
    }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !input.trim()) return;
    const content = input.trim();
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages(previous => [...previous, { role: 'user', content }]);
    setInput(''); setBusy(true); setError(''); stopSpeech();
    const controller = new AbortController(); pending.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 42000);
    try {
      const response = await apiFetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, language, message: content, history }), signal: controller.signal });
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (typeof data.reply !== 'string') throw new Error('Invalid response');
      const message: Message = { role: 'assistant', content: data.reply, recommendations: data.recommendations,
        contactDraft: data.contactDraft, speechToken: data.speechToken };
      setMessages(previous => [...previous, message]);
      void speak(message);
    } catch {
      setError(fr ? 'Le conseiller est indisponible pour le moment. Réessayez ou contactez la boutique.'
        : 'The advisor is currently unavailable. Please retry or contact the store.');
      setInput(content);
    } finally { clearTimeout(timer); setBusy(false); }
  }
  const title = scope === 'admin' ? (fr ? 'Assistant de gestion' : 'Management assistant') : (fr ? 'Votre conseiller' : 'Your shopping advisor');
  return <section aria-label={title} className={`flex min-w-0 flex-col overflow-hidden border border-white/15 rounded-lg bg-neutral-950 shadow-2xl ${scope === 'admin' ? 'h-[min(680px,80dvh)] w-full' : 'h-[min(640px,calc(100dvh-100px))] w-[min(410px,calc(100vw-24px))]'}`}>
    <header className="flex items-center gap-3 border-b border-white/10 p-3 sm:p-4 shrink-0">
      <Logo size={34} />
      <div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{title}</p><p className="text-xs text-neutral-400">StevenBmj · {fr ? 'Assistant IA' : 'AI assistant'}</p></div>
      <button type="button" aria-label={voice ? (fr ? 'Couper la voix' : 'Mute voice') : (fr ? 'Activer la voix' : 'Enable voice')}
        title={voice ? (fr ? 'Couper la voix' : 'Mute voice') : (fr ? 'Activer la voix' : 'Enable voice')}
        aria-pressed={voice} onClick={() => {
          voiceEnabled.current = !voice; setVoice(!voice);
          if (voice) stopSpeech();
          else { const last = [...messages].reverse().find(m => m.role === 'assistant'); if (last) void speak(last); }
        }} className={`h-11 w-11 shrink-0 rounded flex items-center justify-center hover:bg-white/10 ${voice ? 'text-amber-300' : 'text-neutral-400'}`}>
        {voice ? <Volume2 className={`w-5 h-5 ${speaking ? 'animate-pulse' : ''}`} /> : <VolumeX className="w-5 h-5" />}
      </button>
      {onClose && <button id="btn-chatbot-close" type="button" onClick={onClose} aria-label={fr ? 'Fermer le conseiller' : 'Close advisor'} title={fr ? 'Fermer' : 'Close'} className="h-11 w-11 flex items-center justify-center text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>}
    </header>
    <div ref={list} role="log" aria-live="polite" className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-5 text-sm leading-relaxed">
      {messages.length === 0 && <div className="py-5 space-y-4"><Bot className="h-7 w-7 text-amber-300" />
        <p className="text-neutral-200">{scope === 'admin' ? (fr ? 'Bonjour. Quel point souhaitez-vous examiner dans votre activité ?' : 'Hello. What would you like to review in your business?')
          : (fr ? 'Bonjour et bienvenue chez StevenBmj. Pour vous, pour un cadeau ou pour une occasion particulière ?' : 'Welcome to StevenBmj. Are you shopping for yourself, a gift or a special occasion?')}</p>
        <div className="flex flex-wrap gap-2">{(scope === 'admin' ? (fr ? ['Résumer les commandes', 'Analyser les ventes'] : ['Summarize orders', 'Review sales'])
          : (fr ? ['Trouver un cadeau', 'Voir les montres', 'Choisir une tenue'] : ['Find a gift', 'Explore watches', 'Choose an outfit'])).map(text => <button type="button" key={text} onClick={() => setInput(text)} className="min-h-11 px-3 border border-white/15 rounded text-xs text-neutral-300 hover:border-amber-300">{text}</button>)}</div>
      </div>}
      {messages.map((message, index) => <div key={index} className={`min-w-0 ${message.role === 'user' ? 'ml-8 text-white' : 'mr-2 text-neutral-200'}`}>
        <p className={`whitespace-pre-wrap break-words ${message.role === 'user' ? 'bg-neutral-800 p-3 rounded-lg' : ''}`}>{message.content}</p>
        {scope === 'client' && message.recommendations?.map(id => {
          const product = products.find(p => p.id === id && p.stock > 0);
          return product && <article key={id} className="mt-3 border border-white/10 rounded p-2 flex items-center gap-3">
            <button type="button" onClick={() => { navigate({ view: 'produit', productId: id, panel: null }); onClose?.(); }} className="shrink-0" title={fr ? 'Voir l’article' : 'View item'}>
              <img src={product.images[0]} alt={fr ? product.name : product.nameEn || product.name} loading="lazy" className="w-14 h-16 rounded object-cover" /></button>
            <div className="min-w-0 flex-1"><p className="text-xs break-words">{fr ? product.name : product.nameEn || product.name}</p><p className="text-xs text-amber-300 mt-1">{formatPrice(product.promoPrice ?? product.price)}</p></div>
            <button type="button" onClick={() => { addToCart(product); setAdded(`${index}:${id}`); }} title={fr ? 'Ajouter au panier' : 'Add to cart'} aria-label={fr ? 'Ajouter au panier' : 'Add to cart'} className="h-11 w-11 shrink-0 flex items-center justify-center rounded bg-amber-300 text-black">
              {added === `${index}:${id}` ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}</button>
          </article>;
        })}
        {scope === 'client' && message.contactDraft && <button type="button" onClick={() => { setPreparedContact(message.contactDraft!); setView('contact'); onClose?.(); }}
          className="mt-3 flex items-center gap-2 min-h-11 text-amber-300 text-xs">{fr ? 'Vérifier le message de contact' : 'Review contact message'}<ArrowRight className="h-4 w-4" /></button>}
      </div>)}
      {busy && <p role="status" className="flex items-center gap-2 text-xs text-neutral-400"><LoaderCircle className="w-4 h-4 animate-spin" />{fr ? 'Le conseiller vous répond...' : 'Your advisor is replying...'}</p>}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </div>
    <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3 shrink-0">
      <label htmlFor={`assistant-input-${scope}`} className="sr-only">{fr ? 'Votre message' : 'Your message'}</label>
      <textarea id={`assistant-input-${scope}`} rows={2} maxLength={1800} value={input} onChange={e => setInput(e.target.value)}
        placeholder={fr ? 'Votre question...' : 'Your question...'} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
        className="min-w-0 flex-1 resize-none rounded border border-white/15 bg-neutral-900 text-white text-sm px-3 py-2 focus:outline-none focus:border-amber-300" />
      <button id="btn-chatbot-send" type="submit" disabled={busy || !input.trim()} aria-label={fr ? 'Envoyer' : 'Send'} title={fr ? 'Envoyer' : 'Send'} className="h-11 w-11 shrink-0 rounded bg-amber-300 text-black disabled:opacity-40 flex items-center justify-center"><Send className="w-4 h-4" /></button>
    </form>
  </section>;
}
