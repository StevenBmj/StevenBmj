import products from '../../api/products';
import settings from '../../api/settings';
import shop from '../../api/shop';
import login from '../../api/auth/login';
import register from '../../api/auth/register';
import activate from '../../api/auth/activate';
import google from '../../api/auth/google';
import session from '../../api/auth/session';
import users from '../../api/auth/users';
import userById from '../../api/auth/users/[id]';
import reset from '../../api/auth/request-reset-code';
import chat from '../../api/gemini/chat';
import assistant from '../../api/assistant';
import { reply } from './security';

const handlers: Record<string, any> = {
  '/api/products': products, '/api/settings': settings, '/api/shop': shop,
  '/api/auth/login': login, '/api/auth/register': register,
  '/api/auth/activate': activate, '/api/auth/google': google,
  '/api/auth/session': session, '/api/auth/users': users,
  '/api/auth/request-reset-code': reset, '/api/auth/admin/change-password': reset,
  '/api/gemini/chat': chat,
  '/api/assistant': assistant,
};

export async function dispatchApi(req: any, res: any) {
  try {
    const url = new URL(req.originalUrl || req.url, 'http://local.invalid');
    // Resolve the same rewrites as Vercel, with path parameters taking precedence.
    const config = await import('../../vercel.json');
    let route = url.pathname;
    const query = Object.fromEntries(url.searchParams);
    for (const rule of config.default.rewrites) {
      if (!rule.source.startsWith('/api/')) continue;
      const names = [...rule.source.matchAll(/:(\w+)/g)].map(m => m[1]);
      const pattern = rule.source.replace(/:(\w+)/g, '([^/]+)');
      const match = route.match(new RegExp(`^${pattern}$`));
      if (!match) continue;
      let target = rule.destination;
      names.forEach((name, i) => { target = target.replace(`:${name}`, encodeURIComponent(decodeURIComponent(match[i + 1]))); });
      const rewritten = new URL(target, url);
      route = rewritten.pathname;
      Object.assign(query, Object.fromEntries(rewritten.searchParams));
      break;
    }
    let handler = handlers[route];
    const userMatch = route.match(/^\/api\/auth\/users\/([^/]+)$/);
    if (userMatch) { handler = userById; query.id = decodeURIComponent(userMatch[1]); }
    if (!handler) return reply(res, 404, { error: 'Ressource introuvable.' });
    req.query = query;
    return await handler(req, res);
  } catch {
    if (!res.headersSent) return reply(res, 503, { error: 'Service temporairement indisponible.' });
  }
}
