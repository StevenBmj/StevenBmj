import { useEffect, useRef } from 'react';
import { activeHistoryOverlays, historyOverlayKey } from '../lib/historyOverlay';

export function useHistoryOverlay(active: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  const id = useRef(crypto.randomUUID());
  useEffect(() => {
    if (!active) return;
    const key = id.current;
    const existing = window.history.state?.[historyOverlayKey];
    const reusable = existing && !activeHistoryOverlays.has(existing);
    activeHistoryOverlays.add(key);
    if (reusable || existing !== key) {
      window.history[reusable ? 'replaceState' : 'pushState']({ ...window.history.state, [historyOverlayKey]: key }, '', window.location.href);
    }
    const restore = () => {
      if (window.history.state?.[historyOverlayKey] !== key) closeRef.current();
    };
    window.addEventListener('popstate', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      activeHistoryOverlays.delete(key);
      // Retire the entry synchronously; reopening must not race an asynchronous Back.
    };
  }, [active]);
}
