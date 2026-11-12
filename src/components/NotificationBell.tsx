import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Download, RefreshCw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationsContext';
import { useNavigation } from '../context/NavigationContext';
import { deliveryLabel } from '../lib/delivery';
import { notificationSection } from '../lib/notifications';
import type { AdminSection } from '../lib/navigation';
import { useHistoryOverlay } from '../hooks/useHistoryOverlay';

function Inbox({ close }: { close: () => void }) {
  useHistoryOverlay(true, close);
  const { user, language } = useApp();
  const { items, unreadCount, error, loading, load, markRead, pushEnabled, pushAvailable, togglePush, install, installAvailable } = useNotifications();
  const { navigate } = useNavigation();
  const dialog = useRef<HTMLDialogElement>(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const fr = language === 'FR';
  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; opener?.focus({ preventScroll: true }); };
  }, []);
  const action = async (callback: () => Promise<void>) => {
    setBusy(true); setActionError('');
    try { await callback(); } catch { setActionError(fr ? 'Action impossible. Vérifiez vos autorisations et réessayez.' : 'Unable to complete the action. Check permissions and retry.'); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} aria-labelledby="inbox-title" onCancel={event => { event.preventDefault(); close(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-lg border border-white/15 bg-neutral-950 p-0 text-white backdrop:bg-black/80">
    <div className="flex max-h-[85dvh] flex-col"><div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-5"><h2 id="inbox-title" className="text-xl">Notifications</h2><button onClick={close} aria-label={fr ? 'Fermer les notifications' : 'Close notifications'} title={fr ? 'Fermer' : 'Close'} className="flex size-11 items-center justify-center rounded border border-white/20"><X size={18} /></button></div>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-5">
        {(error || actionError) && <p role="alert" className="mb-4 text-sm text-red-400">{actionError || error}</p>}
        <div className="mb-5 flex flex-wrap gap-3"><button disabled={!unreadCount || busy} onClick={() => void action(() => markRead())} className="inline-flex min-h-11 items-center gap-2 rounded border border-white/20 px-3 text-sm disabled:opacity-40"><CheckCheck size={16} />{fr ? 'Tout marquer comme lu' : 'Mark all as read'}</button><button onClick={() => void load()} aria-label={fr ? 'Actualiser les notifications' : 'Refresh notifications'} title={fr ? 'Actualiser' : 'Refresh'} className="flex size-11 items-center justify-center rounded border border-white/20"><RefreshCw size={18} /></button></div>
        {loading && !items.length ? <p role="status" className="text-sm text-neutral-400">{fr ? 'Chargement…' : 'Loading…'}</p> : !items.length && !error ? <p className="text-sm text-neutral-400">{fr ? 'Aucune notification.' : 'No notifications.'}</p> : <ul className="divide-y divide-white/10">{items.map(item => <li key={item.id} className="py-4"><button className="w-full text-left" onClick={() => void action(async () => {
          await markRead(item.id);
          close();
          const section = notificationSection(item.kind) as AdminSection | undefined;
          navigate({ view: user?.isAdmin ? 'god' : item.targetView === 'driver' || item.kind.startsWith('driver_') ? 'driver' : 'account', ...(user?.isAdmin && section ? { adminSection: section } : {}), ...(item.order_id ? { orderId: item.order_id } : {}), panel: null });
        })}><span className={`block text-sm leading-6 ${item.read_at ? 'text-neutral-400' : 'font-semibold text-amber-300'}`}>{deliveryLabel(item.kind, language)}</span>{item.order_id && <span className="mt-1 block break-all text-xs text-neutral-400">{item.order_id}</span>}<span className="mt-2 block text-xs text-neutral-500">{new Date(item.created_at).toLocaleString(fr ? 'fr-FR' : 'en-GB')}</span></button></li>)}</ul>}
        <div className="mt-5 space-y-4 border-t border-white/10 pt-5">{pushAvailable && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={pushEnabled} disabled={busy} onChange={event => void action(() => togglePush(event.target.checked))} className="size-5 accent-amber-400" />{fr ? 'Notifications sur cet appareil' : 'Notifications on this device'}</label>}
          {installAvailable && <button onClick={() => void action(install)} className="inline-flex min-h-11 items-center gap-2 rounded border border-white/20 px-3 text-sm"><Download size={18} />{fr ? 'Installer StevenBmj' : 'Install StevenBmj'}</button>}
        </div>
      </div>
    </div>
  </dialog>;
}

export default function NotificationBell() {
  const { user, language } = useApp();
  const { unreadCount, error } = useNotifications();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [user?.id]);
  if (!user) return null;
  return <><button id="btn-notifications" onClick={() => setOpen(true)} aria-label={language === 'FR' ? (error ? 'Notifications, état indisponible' : `Notifications, ${unreadCount} non lue`) : (error ? 'Notifications, status unavailable' : `Notifications, ${unreadCount} unread`)} title="Notifications" className="relative flex size-11 shrink-0 items-center justify-center text-neutral-300 hover:text-amber-400">
    <Bell size={18} aria-hidden="true" />{unreadCount > 0 && <span data-notification-count className="absolute right-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
  </button>{open && <Inbox key={user.id} close={() => setOpen(false)} />}</>;
}
