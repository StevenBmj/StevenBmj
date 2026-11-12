import { dispatchApi } from '../src/server/apiRouter.js';
import { reply } from '../src/server/security.js';
import { servePage } from '../src/server/seo.js';

export default async function handler(req: any, res: any) {
  const url = new URL(req.originalUrl || req.url, 'http://local.invalid');
  const page = !url.pathname.startsWith('/api') ? url.pathname : ['/api', '/api/', '/api/index'].includes(url.pathname) ? req.query?.__page ?? url.searchParams.get('__page') : null;
  if (typeof page === 'string' && page.length <= 400 && !page.includes('..')) {
    try { return await servePage(req, res, page); }
    catch { return reply(res, 503, { error: 'Page temporairement indisponible.' }); }
  }
  if (['/api', '/api/', '/api/index'].includes(url.pathname)) {
    const path = req.query?.__path || url.searchParams.get('__path');
    if (typeof path !== 'string' || path.length > 400 || !/^[a-zA-Z0-9_/-]+$/.test(path)) return reply(res, 404, { error: 'Ressource introuvable.' });
    url.pathname = `/api/${path}`;
    url.searchParams.delete('__path');
    req.originalUrl = `${url.pathname}${url.search}`;
  }
  return dispatchApi(req, res);
}
