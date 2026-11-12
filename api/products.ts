import { createClient } from '@supabase/supabase-js';
import { requireUser, readJson, reply } from '../src/server/security';

const json = reply;

function supabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function rowToProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en || '',
    description: row.description || '',
    descriptionEn: row.description_en || '',
    category: row.category,
    images: row.images || [],
    price: Number(row.price || 0),
    promoPrice: row.promo_price == null ? undefined : Number(row.promo_price),
    stock: Number(row.stock || 0),
    rating: Number(row.rating || 0),
    specs: row.specs || [],
    isExclu: Boolean(row.is_exclu),
    isNew: Boolean(row.is_new),
    badge: row.badge || undefined,
    badgeEn: row.badge_en || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
  };
}

const readBody = (req: any) => readJson(req, 2_000_000);

function cleanText(value: any, max = 400) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function productToRow(product: any) {
  const id = cleanText(product.id, 80) || `prod-${Date.now()}`;
  const images = Array.isArray(product.images)
    ? product.images.map((img: any) => String(img || '').trim()).filter(Boolean).slice(0, 8)
    : [];
  return {
    id,
    name: cleanText(product.name, 180),
    name_en: cleanText(product.nameEn || product.name_en || product.name, 180),
    description: cleanText(product.description, 2000),
    description_en: cleanText(product.descriptionEn || product.description_en || product.description, 2000),
    category: cleanText(product.category || 'watches', 40),
    images,
    price: Math.max(0, Number(product.price || 0)),
    promo_price: product.promoPrice === undefined || product.promoPrice === '' || product.promoPrice === null ? null : Math.max(0, Number(product.promoPrice)),
    stock: Math.max(0, Number(product.stock || 0)),
    rating: Math.max(0, Math.min(5, Number(product.rating || 4.8))),
    specs: Array.isArray(product.specs) ? product.specs.slice(0, 20) : [],
    is_exclu: Boolean(product.isExclu),
    is_new: Boolean(product.isNew),
    badge: product.badge ? cleanText(product.badge, 80) : null,
    badge_en: product.badgeEn ? cleanText(product.badgeEn, 80) : null,
    seo_title: product.seoTitle ? cleanText(product.seoTitle, 160) : null,
    seo_description: product.seoDescription ? cleanText(product.seoDescription, 260) : null,
  };
}

async function addSecurityLog(supabase: any, req: any, event: string, status = 'SECURED') {
  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
  await supabase.from('security_logs').insert({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    ip,
    event,
    status,
  }).then(() => null, () => null);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET' && !(await requireUser(req, res, true))) return;
    const supabase = supabaseAdmin();
    const id = cleanText(req.query?.id, 80);

    if (req.method === 'GET') {
      let query = supabase.from('products').select('*').order('created_at', { ascending: true });
      if (id) query = query.eq('id', id);
      const { data, error } = await query;
      if (error) throw error;
      const products = (data || []).map(rowToProduct);
      return json(res, 200, id ? (products[0] || null) : products);
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const row = productToRow(body);
      if (!row.name || !row.description || row.price <= 0 || row.images.length === 0) {
        return json(res, 400, { error: 'Nom, description, prix et image produit sont requis.' });
      }
      const { data, error } = await supabase.from('products').upsert(row, { onConflict: 'id' }).select('*').single();
      if (error) throw error;
      await addSecurityLog(supabase, req, `Produit sauvegarde: ${row.name}`, 'SECURED');
      return json(res, 200, { success: true, product: rowToProduct(data) });
    }

    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'ID produit requis.' });
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await addSecurityLog(supabase, req, `Produit supprime: ${id}`, 'SECURED');
      return json(res, 200, { success: true });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API' });
  }
}
