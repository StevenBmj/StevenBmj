import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { fallbackRoute, pagePaths, readRoute, routeHref, type Panel, type Route } from '../lib/navigation';

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

  useEffect(() => {
    window.history.replaceState({ ...window.history.state, [stateKey]: historyIndex() }, '', window.location.href);
    const restore = () => { setRoute(readRoute(window.location)); setIndex(historyIndex()); };
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, []);

  const navigate = useCallback((target: Route, replace = false) => {
    const current = readRoute(window.location);
    const href = routeHref(target);
    if (routeHref(current) === href) return;
    const next = replace ? historyIndex() : historyIndex() + 1;
    window.history[replace ? 'replaceState' : 'pushState']({ [stateKey]: next }, '', href);
    setIndex(next);
    setRoute(target);
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

  return <NavigationContext.Provider value={{ route, canGoBack: index > 0, navigate, back, setView, openPanel, closePanel }}>
    {children}
  </NavigationContext.Provider>;
}

export function useNavigation() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('NavigationProvider is required');
  return value;
}
