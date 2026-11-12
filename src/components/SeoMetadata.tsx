import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import { pageMetadata, structuredMetadata } from '../lib/seo';

export default function SeoMetadata() {
  const { language, products, productsLoading, settings } = useApp();
  const { route } = useNavigation();
  useEffect(() => {
    if (route.view === 'produit' && productsLoading) return;
    const product = products.find(product => product.id === route.productId);
    const meta = pageMetadata(window.location.pathname, language, product);
    if (settings?.seoIndexable === false || document.head.querySelector('meta[name="deployment-noindex"]')) meta.indexable = false;
    document.title = meta.title;
    document.documentElement.lang = meta.language;
    const values = { description: meta.description, robots: meta.indexable && !route.panel ? 'index,follow' : 'noindex,nofollow', 'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.canonical, 'og:image': meta.image, 'twitter:title': meta.title, 'twitter:description': meta.description, 'twitter:image': meta.image };
    for (const [name, value] of Object.entries(values)) {
      const attribute = name.startsWith('og:') ? 'property' : 'name';
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, name); document.head.append(tag); }
      tag.content = value;
    }
    document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', meta.canonical);
    // The server document describes the initially opened page, not subsequent client-side navigation.
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
    const structured = structuredMetadata(meta, product);
    if (structured) { const node = document.createElement('script'); node.type = 'application/ld+json'; node.textContent = JSON.stringify(structured); document.head.append(node); }
  }, [route.view, route.productId, route.panel, language, products, productsLoading, settings?.seoIndexable]);
  return null;
}
