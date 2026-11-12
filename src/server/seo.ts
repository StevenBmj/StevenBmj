import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'cheerio';
import { XMLBuilder } from 'fast-xml-parser';
import { adminClient } from './security.js';
import { pageMetadata, publicPages, SITE_ORIGIN, structuredMetadata } from '../lib/seo.js';

let cached: { origin: string; at: number; products: any[] } | undefined;
let indexingCache: { origin: string | undefined; expires: number; enabled: boolean } | undefined;
let indexingRead: { origin: string | undefined; promise: Promise<boolean> } | undefined;
let indexingVersion = 0;

export function invalidateSeoIndexingCache() {
  indexingVersion++;
  indexingCache = undefined;
  indexingRead = undefined;
}

async function indexingEnabled() {
  const origin = process.env.SUPABASE_URL;
  if (indexingCache && indexingCache.origin === origin && indexingCache.expires > Date.now()) return indexingCache.enabled;
  if (indexingRead && indexingRead.origin === origin) return indexingRead.promise;
  const version = indexingVersion;
  const promise = (async () => {
    const result = await adminClient().from('app_settings').select('data').eq('id', 'default').abortSignal(AbortSignal.timeout(1200)).maybeSingle();
    if (result.error) throw new Error('Indexing configuration unavailable');
    const enabled = result.data?.data?.seoIndexable !== false;
    if (version === indexingVersion) indexingCache = { origin, expires: Date.now() + 30000, enabled };
    return enabled;
  })();
  indexingRead = { origin, promise };
  try { return await promise; }
  finally { if (indexingRead?.promise === promise) indexingRead = undefined; }
}
async function products() {
  if (cached?.origin === process.env.SUPABASE_URL && Date.now() - cached.at < 60000) return cached.products;
  const response = await adminClient().from('products').select('id,name,name_en,description,description_en,price,promo_price,stock,images').limit(1000).abortSignal(AbortSignal.timeout(4000));
  if (response.error) throw new Error('public_catalogue_unavailable');
  cached = { origin: process.env.SUPABASE_URL!, at: Date.now(), products: response.data || [] };
  return cached.products;
}

export async function servePage(req: any, res: any, page: string, template?: string) {
  if (!['GET', 'HEAD'].includes(req.method)) { res.status(405); res.end(); return; }
  const url = new URL(req.originalUrl || req.url, SITE_ORIGIN);
  const language = url.searchParams.get('lang') === 'en' ? 'EN' : 'FR';
  const path = `/${page.replace(/^\//, '')}`.replace(/\/$/, '') || '/';
  if (path === '/sitemap.xml') {
    const catalogue = await products();
    const paths = [...publicPages, ...catalogue.map(product => `/produit/${encodeURIComponent(product.id)}`)];
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xml = builder.build({ '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' }, urlset: { '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9', url: paths.flatMap(path => [{ loc: `${SITE_ORIGIN}${path}` }, { loc: `${SITE_ORIGIN}${path}?lang=en` }]) } });
    res.setHeader('Content-Type', 'application/xml; charset=utf-8'); res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60'); res.status(200); res.end(req.method === 'HEAD' ? '' : xml); return;
  }
  let product: any;
  let catalogueUnavailable = false;
  if (path.startsWith('/produit/')) {
    let id = '';
    try { id = decodeURIComponent(path.slice('/produit/'.length)); } catch { /* Invalid product links return 404. */ }
    try { product = (await products()).find(product => product.id === id); }
    catch { catalogueUnavailable = true; }
  }
  const meta = pageMetadata(path, language, product);
  // Metadata failure must not replace the usable storefront with an error page.
  let indexingDisabled = catalogueUnavailable || process.env.VERCEL_ENV === 'preview';
  if (meta.indexable && !indexingDisabled) {
    try { indexingDisabled = !await indexingEnabled(); }
    catch { indexingDisabled = true; }
  }
  if (indexingDisabled || url.searchParams.has('panel')) meta.indexable = false;
  const privatePage = /^\/(god|compte|livraisons|verification)(\/|$)/.test(path);
  const status = catalogueUnavailable ? 503 : publicPages.includes(path) || !!product || privatePage ? 200 : 404;
  const $ = load(template || readFileSync(resolve('dist/index.html'), 'utf8'));
  $('html').attr('lang', meta.language); $('title').text(meta.title);
  if (indexingDisabled) $('<meta>').attr({ name: 'deployment-noindex', content: 'true' }).appendTo('head');
  $('meta[name="description"]').attr('content', meta.description);
  $('meta[name="robots"]').attr('content', meta.indexable ? 'index,follow' : 'noindex,nofollow');
  $('link[rel="canonical"]').attr('href', meta.canonical);
  for (const [name, value] of Object.entries({ 'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.canonical, 'og:image': meta.image, 'twitter:title': meta.title, 'twitter:description': meta.description, 'twitter:image': meta.image })) {
    const key = name.startsWith('og:') ? 'property' : 'name';
    const tag = $(`meta[${key}="${name}"]`); if (tag.length) tag.attr('content', value); else $('<meta>').attr({ [key]: name, content: value }).appendTo('head');
  }
  $('link[rel="alternate"][hreflang]').remove();
  for (const [locale, suffix] of [['fr', ''], ['en', '?lang=en'], ['x-default', '']]) $('<link>').attr({ rel: 'alternate', hreflang: locale, href: `${SITE_ORIGIN}${path}${suffix}` }).appendTo('head');
  $('script[type="application/ld+json"]').remove();
  const data = structuredMetadata(meta, product);
  if (meta.indexable) $('<script>').attr('type', 'application/ld+json').text(JSON.stringify(data).replace(/</g, '\\u003c')).appendTo('head');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', meta.indexable && !url.searchParams.has('panel') ? 'public, max-age=0, s-maxage=60' : 'no-store');
  res.setHeader('X-Robots-Tag', meta.indexable && !url.searchParams.has('panel') ? 'index, follow' : 'noindex, nofollow');
  res.status(status); res.end(req.method === 'HEAD' ? '' : $.html());
}
