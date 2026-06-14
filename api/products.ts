import { json, supabaseAdmin } from './_supabase';

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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToProduct));
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
