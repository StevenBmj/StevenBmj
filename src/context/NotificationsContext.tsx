import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { useApp } from './AppContext';

type Notice = { id: string; kind: string; order_id?: string; read_at: string | null; created_at: string; targetView?: string };
type Snapshot = { userId: string; items: Notice[]; unreadCount: number; sections?: Record<string, number>; pushPublicKey?: string };
const Context = createContext<{
  items: Notice[]; unreadCount: number; error: string; loading: boolean; pushEnabled: boolean; pushAvailable: boolean;
  load: () => Promise<void>; markRead: (id?: string) => Promise<void>; togglePush: (enabled: boolean) => Promise<void>;
  installAvailable: boolean; install: () => Promise<void>; sections: Record<string, number>; markSectionRead: (section: string) => Promise<void>;
} | null>(null);

async function worker() {
  if (!('serviceWorker' in navigator)) throw new Error('unsupported');
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  return navigator.serviceWorker.ready;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, language } = useApp();
  const owner = useRef(user?.id);
  owner.current = user?.id;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pushOwner, setPushOwner] = useState('');
  const [installEvent, setInstallEvent] = useState<any>(null);
  const load = useCallback(async () => {
    const id = user?.id;
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/shop?resource=notifications');
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (owner.current !== id) return;
      if (data.userId !== id || !Array.isArray(data.items) || !Number.isSafeInteger(data.unreadCount) || data.unreadCount < 0) throw new Error();
      setSnapshot(data); setError('');
    } catch { if (owner.current === id) setError(language === 'FR' ? 'Notifications indisponibles. Réessayez.' : 'Notifications unavailable. Please retry.'); }
    finally { if (owner.current === id) setLoading(false); }
  }, [user?.id, language]);

  useEffect(() => {
    setSnapshot(null); setPushOwner(''); setError('');
    if (!user) return;
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(refresh, 20000);
    window.addEventListener('sbmj:notifications-refresh', refresh);
    window.addEventListener('focus', refresh);
    navigator.serviceWorker?.addEventListener('message', refresh);
    let active = true;
    void apiFetch('/api/shop?resource=push-subscription').then(response => response.ok ? response.json() : null)
      .then(data => { if (active && data?.enabled && owner.current === user.id) setPushOwner(user.id); }).catch(() => null);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('sbmj:notifications-refresh', refresh); window.removeEventListener('focus', refresh); navigator.serviceWorker?.removeEventListener('message', refresh); };
  }, [user?.id, load]);

  useEffect(() => {
    const badge = navigator as Navigator & { setAppBadge?: (count: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    const count = user?.id && snapshot?.userId === user.id ? snapshot.unreadCount : 0;
    if (count) void badge.setAppBadge?.(count).catch(() => null);
    else { void badge.clearAppBadge?.().catch(() => null); navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_BADGE' }); }
  }, [user?.id, snapshot]);

  useEffect(() => {
    const prompt = (event: Event) => { event.preventDefault(); setInstallEvent(event); };
    const installed = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', prompt); window.addEventListener('appinstalled', installed);
    if ('serviceWorker' in navigator && import.meta.env.PROD) void worker().catch(() => null);
    return () => { window.removeEventListener('beforeinstallprompt', prompt); window.removeEventListener('appinstalled', installed); };
  }, []);

  const markRead = async (id?: string) => {
    const response = await apiFetch(`/api/shop?resource=notifications${id ? `&id=${encodeURIComponent(id)}` : ''}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? {} : { all: true }),
    });
    if (!response.ok) throw new Error('acknowledgement_failed');
    await load();
  };
  const togglePush = async (enabled: boolean) => {
    const id = user?.id;
    const registration = await worker();
    let subscription = await registration.pushManager.getSubscription();
    if (enabled) {
      if (!snapshot?.pushPublicKey || !id || !('Notification' in window) || await Notification.requestPermission() !== 'granted') throw new Error('permission_required');
      const raw = atob(snapshot.pushPublicKey.replace(/-/g, '+').replace(/_/g, '/'));
      const key = Uint8Array.from(raw, char => char.charCodeAt(0));
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const response = await apiFetch('/api/shop?resource=push-subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: subscription.toJSON(), language }) });
      if (!response.ok || owner.current !== id) throw new Error('subscription_failed');
      setPushOwner(id);
    } else {
      if (subscription) {
        const response = await apiFetch('/api/shop?resource=push-subscription', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        if (!response.ok) throw new Error('unsubscribe_failed');
        await subscription.unsubscribe();
      }
      if (owner.current === id) setPushOwner('');
    }
  };
  const install = async () => { if (!installEvent) return; await installEvent.prompt(); await installEvent.userChoice; setInstallEvent(null); };
  const markSectionRead = async (section: string) => {
    const response = await apiFetch('/api/shop?resource=notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section }) });
    if (!response.ok) throw new Error('acknowledgement_failed');
    await load();
  };
  const current = user?.id && snapshot?.userId === user.id ? snapshot : null;
  return <Context.Provider value={{ items: current?.items || [], unreadCount: current?.unreadCount || 0, error, loading,
    pushEnabled: !!user?.id && pushOwner === user.id, pushAvailable: !!current?.pushPublicKey && 'PushManager' in window && 'Notification' in window,
    load, markRead, markSectionRead, sections: current?.sections || {}, togglePush, installAvailable: !!installEvent, install }}>{children}</Context.Provider>;
}

export function useNotifications() {
  const context = useContext(Context);
  if (!context) throw new Error('NotificationsProvider is required');
  return context;
}
