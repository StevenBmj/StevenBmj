export const SITE_ORIGIN = 'https://stevenbmj.vercel.app';
export const publicPages = ['/', '/boutique', '/about', '/contact', '/aide'];

export function pageMetadata(path: string, language: 'FR' | 'EN', product?: any) {
  const fr = language === 'FR';
  const entries: Record<string, [string, string]> = {
    '/': ['StevenBmj | Mode, montres et accessoires au Bénin', 'StevenBmj | Fashion, watches and accessories in Benin'],
    '/boutique': ['Catalogue | StevenBmj', 'Shop | StevenBmj'], '/about': ['À propos | StevenBmj', 'About | StevenBmj'],
    '/contact': ['Contact | StevenBmj', 'Contact | StevenBmj'], '/aide': ['Services et questions fréquentes | StevenBmj', 'Customer care and FAQ | StevenBmj'],
  };
  const isProduct = path.startsWith('/produit/');
  const available = !!entries[path] || isProduct && !!product;
  const name = product ? (fr ? product.name : product.nameEn || product.name_en || product.name) : '';
  const description = product ? (fr ? product.description : product.descriptionEn || product.description_en || product.description) : '';
  const title = isProduct && product ? `${name} | StevenBmj` : entries[path]?.[fr ? 0 : 1] || (fr ? 'Espace privé | StevenBmj' : 'Private workspace | StevenBmj');
  const canonical = `${SITE_ORIGIN}${path}${fr ? '' : '?lang=en'}`;
  let image = `${SITE_ORIGIN}/logo.png`;
  try { const url = new URL(product?.images?.[0] || '/logo.png', SITE_ORIGIN); if (url.protocol === 'https:') image = url.href; } catch { /* Keep the brand image. */ }
  return { title, description: String(description || (fr ? 'Découvrez StevenBmj, marque béninoise de mode, montres, chaussures et accessoires. Catalogue, services et contact à Cotonou.' : 'Discover StevenBmj, a Beninese fashion, watches, footwear and accessories brand. Shop, customer care and contact in Cotonou.')).slice(0, 300),
    canonical, image, indexable: available, productName: name, language: fr ? 'fr' : 'en' };
}

export function structuredMetadata(meta: ReturnType<typeof pageMetadata>, product?: any) {
  if (!meta.indexable) return null;
  return product ? { '@context': 'https://schema.org', '@type': 'Product', name: meta.productName, description: meta.description, image: meta.image, url: meta.canonical,
    brand: { '@type': 'Brand', name: 'StevenBmj' }, offers: { '@type': 'Offer', priceCurrency: 'EUR', price: Number(product.promoPrice ?? product.promo_price ?? product.price), availability: Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: meta.canonical } }
    : { '@context': 'https://schema.org', '@type': 'Store', name: 'StevenBmj', url: SITE_ORIGIN, logo: `${SITE_ORIGIN}/logo.png`, description: meta.description, address: { '@type': 'PostalAddress', addressLocality: 'Cotonou', addressCountry: 'BJ' } };
}
