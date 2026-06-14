import { json, readBody, supabaseAdmin } from './_supabase';

export default async function handler(req: any, res: any) {
  try {
    const supabase = supabaseAdmin();
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      if (error) throw error;
      return json(res, 200, data?.data || {});
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const current = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      const merged = { ...(current.data?.data || {}), ...body };
      const { error } = await supabase.from('app_settings').upsert({ id: 'default', data: merged }, { onConflict: 'id' });
      if (error) throw error;
      return json(res, 200, { success: true, settings: merged });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
