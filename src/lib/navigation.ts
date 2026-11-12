export const pagePaths = {
  home: '/', boutique: '/boutique', about: '/about', contact: '/contact', aide: '/aide', god: '/god',
} as const;

export type PageView = keyof typeof pagePaths | 'produit' | 'verification';
export type Panel = 'panier' | 'commande' | null;
export type Route = { view: PageView; productId?: string; verificationToken?: string; panel: Panel };

export function readRoute(location: Pick<Location, 'href'>): Route {
  const url = new URL(location.href);
  const path = url.pathname.replace(/\/$/, '') || '/';
  let view: PageView = Object.entries(pagePaths).find(([, value]) => value === path)?.[0] as PageView || 'home';
  let productId: string | undefined;
  const product = path.match(/^\/produit\/([^/]+)$/);
  if (product) {
    try { productId = decodeURIComponent(product[1]); view = 'produit'; }
    catch { /* Malformed deep links fall back to the home page. */ }
  }
  if (url.hash === '#/god' || url.hash === '#god') view = 'god';
  const panel = url.searchParams.get('panel');
  const verification = path.match(/^\/verification\/([a-f0-9-]{36})$/i);
  if (verification) return { view: 'verification', verificationToken: verification[1], panel: null };
  return { view, ...(productId ? { productId } : {}), panel: panel === 'panier' || panel === 'commande' ? panel : null };
}

export function routeHref(route: Route) {
  const path = route.view === 'verification' && route.verificationToken ? `/verification/${encodeURIComponent(route.verificationToken)}` : route.view === 'produit' && route.productId
    ? `/produit/${encodeURIComponent(route.productId)}` : pagePaths[route.view as keyof typeof pagePaths] || '/';
  return route.panel ? `${path}?panel=${route.panel}` : path;
}

export function fallbackRoute(route: Route): Route {
  if (route.panel) return { ...route, panel: null };
  return { view: route.view === 'produit' ? 'boutique' : 'home', panel: null };
}
