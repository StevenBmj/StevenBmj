import { createClient } from '@supabase/supabase-js';

export default async function handler(_req: any, res: any) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return res.status(500).json({
        ok: false,
        hasUrl: Boolean(url),
        hasServiceKey: Boolean(key),
      });
    }

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.status(200).json({ ok: true, count });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: error?.message || String(error),
    });
  }
}
