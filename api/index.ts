import { dispatchApi } from '../src/server/apiRouter';
import { reply } from '../src/server/security';

export default async function handler(req: any, res: any) {
  const url = new URL(req.originalUrl || req.url, 'http://local.invalid');
  if (['/api', '/api/', '/api/index'].includes(url.pathname)) {
    const path = req.query?.__path || url.searchParams.get('__path');
    if (typeof path !== 'string' || path.length > 400 || !/^[a-zA-Z0-9_/-]+$/.test(path)) return reply(res, 404, { error: 'Ressource introuvable.' });
    url.pathname = `/api/${path}`;
    url.searchParams.delete('__path');
    req.originalUrl = `${url.pathname}${url.search}`;
  }
  return dispatchApi(req, res);
}
