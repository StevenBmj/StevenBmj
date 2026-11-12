import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fallbackRoute, initialHistoryRoutes, pagePaths, readRoute, routeHref, type Panel, type Route } from '../lib/navigation';
import { activeHistoryOverlays, historyOverlayKey } from '../lib/historyOverlay';

const stateKey = '__stevenbmjNavigation';
function historyIndex() {
  const value = window.history.state?.[stateKey];
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

type Navigation = {
  route: Route;
  canGoBack: boolean;
  navigate: (target: Route, replace?: boolean) => void;
  setView: (view: string) => void;
  back: () => void;
  openPanel: (panel: Exclude<Panel, null>) => void;
  closePanel: () => void;
};
const NavigationContext = createContext<Navigation | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(() => readRoute(window.location));
  const [index, setIndex] = useState(historyIndex);
  const historyCursor = useRef(index);
  const routeCursor = useRef(route);

  useEffect(() => {
    if (window.history.state?.__sbmjHistoryVersion !== 2) {
      const steps = initialHistoryRoutes(readRoute(window.location));
      steps.forEach((step, position) => {
        const state = { [stateKey]: position, __sbmjHistoryVersion: 2 };
        window.history[position ? 'pushState' : 'replaceState'](state, '', routeHref(step));
      });
      setIndex(steps.length - 1);
      historyCursor.current = steps.length - 1;
    }
    const restore = () => {
      const nextIndex = historyIndex();
      const nextRoute = readRoute(window.location);
      const overlay = window.history.state?.[historyOverlayKey];
      if (overlay && !activeHistoryOverlays.has(overlay)) {
        window.history.go(nextIndex < historyCursor.current ? -1 : 1);
        return;
      }
      if (!activeHistoryOverlays.size && nextIndex > 1 && nextIndex === historyCursor.current
        && routeHref(nextRoute) === routeHref(routeCursor.current)) {
        window.history.back();
        return;
      }
      historyCursor.current = nextIndex;
      routeCursor.current = nextRoute;
      setRoute(nextRoute); setIndex(nextIndex);
    };
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, []);

  const navigate = useCallback((target: Route, replace = false) => {
    const current = readRoute(window.location);
    target = { ...target, ...(target.language || current.language ? { language: target.language || current.language } : {}) };
    const href = routeHref(target);
    if (routeHref(current) === href) return;
    const next = replace ? historyIndex() : historyIndex() + 1;
    window.history[replace ? 'replaceState' : 'pushState']({ [stateKey]: next, __sbmjHistoryVersion: 2 }, '', href);
    setIndex(next);
    historyCursor.current = next;
    setRoute(target);
    routeCursor.current = target;
    if (current.view !== target.view || current.productId !== target.productId) window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const back = useCallback(() => {
    if (historyIndex() > 0) window.history.back();
    else navigate(fallbackRoute(readRoute(window.location)), true);
  }, [navigate]);

  const openPanel = useCallback((panel: Exclude<Panel, null>) => navigate({ ...readRoute(window.location), panel }), [navigate]);
  const closePanel = useCallback(() => {
    if (readRoute(window.location).panel) back();
  }, [back]);
  const setView = useCallback((view: string) => {
    if (Object.hasOwn(pagePaths, view)) navigate({ view: view as keyof typeof pagePaths, panel: null });
  }, [navigate]);

  return <NavigationContext.Provider value={{ route, canGoBack: index > 1, navigate, back, setView, openPanel, closePanel }}>
    {children}
  </NavigationContext.Provider>;
}

export function useNavigation() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('NavigationProvider is required');
  return value;
}
