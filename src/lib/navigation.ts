export const pagePaths = {
  home: '/', boutique: '/boutique', about: '/about', contact: '/contact', aide: '/aide', god: '/god', account: '/compte', driver: '/livraisons',
} as const;

export type PageView = keyof typeof pagePaths | 'produit' | 'verification';
export type Panel = 'panier' | 'commande' | null;
export const adminSections = ['analytics', 'products', 'orders', 'drivers', 'ledger', 'promos', 'users', 'settings', 'security', 'announcements', 'reviews', 'assistants'] as const;
export type AdminSection = typeof adminSections[number];
export type Route = { view: PageView; productId?: string; verificationToken?: string; orderId?: string; adminSection?: AdminSection; language?: 'FR' | 'EN'; anchor?: 'faq'; panel: Panel };

export function initialHistoryRoutes(route: Route): Route[] {
  const locale = route.language ? { language: route.language } : {};
  const home: Route = { view: 'home', panel: null, ...locale };
  const routes: Route[] = [home, home];
  if (route.view === 'produit') routes.push({ view: 'boutique', panel: null, ...locale });
  if (route.view !== 'home') routes.push({ ...route, panel: null });
  if (route.panel) routes.push(route);
  return routes;
}

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
  const orderId = url.searchParams.get('order');
  const section = url.searchParams.get('section') as AdminSection;
  return { view, ...(view === 'aide' && url.hash === '#faq' ? { anchor: 'faq' as const } : {}), ...(url.searchParams.get('lang') === 'en' ? { language: 'EN' as const } : {}), ...(productId ? { productId } : {}), ...(view === 'god' && adminSections.includes(section) ? { adminSection: section } : {}), ...(['account', 'driver', 'god'].includes(view) && orderId && /^[a-z0-9-]{1,100}$/i.test(orderId) ? { orderId } : {}), panel: panel === 'panier' || panel === 'commande' ? panel : null };
}

export function routeHref(route: Route) {
  const path = route.view === 'verification' && route.verificationToken ? `/verification/${encodeURIComponent(route.verificationToken)}` : route.view === 'produit' && route.productId
    ? `/produit/${encodeURIComponent(route.productId)}` : pagePaths[route.view as keyof typeof pagePaths] || '/';
  const query = new URLSearchParams();
  if (route.language === 'EN') query.set('lang', 'en');
  if (route.panel) query.set('panel', route.panel);
  if (route.orderId && ['account', 'driver', 'god'].includes(route.view)) query.set('order', route.orderId);
  if (route.view === 'god' && route.adminSection && adminSections.includes(route.adminSection)) query.set('section', route.adminSection);
  return `${path}${query.size ? `?${query}` : ''}${route.view === 'aide' && route.anchor === 'faq' ? '#faq' : ''}`;
}

export function fallbackRoute(route: Route): Route {
  if (route.panel) return { ...route, panel: null };
  return { view: route.view === 'produit' ? 'boutique' : 'home', panel: null };
}
