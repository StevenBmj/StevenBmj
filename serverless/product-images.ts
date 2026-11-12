import { authRateLimit, readJson, reply, requireUser } from '../src/server/security.js';
import { rasterData, storeCatalogueImage } from '../src/server/catalogueMedia.js';

export default async function handler(req: any, res: any) {
  try {
    const actor = await requireUser(req, res, true);
    if (!actor) return;
    if (req.method !== 'POST') return reply(res, 405, { error: 'method_not_allowed' });
    if (!await authRateLimit(req, res, 'catalogue-image', 30, 300, actor.profile.id)) return;
    const body = await readJson(req, 4_100_000);
    if (typeof body.image !== 'string') return reply(res, 400, { error: 'invalid_image' });
    try { rasterData(body.image); } catch { return reply(res, 400, { error: 'invalid_image' }); }
    const url = await storeCatalogueImage(actor.client, body.image);
    return reply(res, 201, { url });
  } catch { return reply(res, 503, { error: 'image_upload_unavailable' }); }
}
