import products from '../../serverless/products.js';
import productImages from '../../serverless/product-images.js';
import settings from '../../serverless/settings.js';
import shop from '../../serverless/shop.js';
import login from '../../serverless/auth/login.js';
import register from '../../serverless/auth/register.js';
import activate from '../../serverless/auth/activate.js';
import google from '../../serverless/auth/google.js';
import session from '../../serverless/auth/session.js';
import users from '../../serverless/auth/users.js';
import userById from '../../serverless/auth/users/[id].js';
import reset from '../../serverless/auth/request-reset-code.js';
import chat from '../../serverless/gemini/chat.js';
import assistant from '../../serverless/assistant.js';
import mfa from '../../serverless/auth/mfa.js';
import { reply } from './security.js';
import rewrites from './apiRoutes.json' with { type: 'json' };

const handlers: Record<string, any> = {
  '/api/products': products, '/api/product-images': productImages, '/api/settings': settings, '/api/shop': shop,
  '/api/auth/login': login, '/api/auth/register': register,
  '/api/auth/activate': activate, '/api/auth/google': google,
  '/api/auth/session': session, '/api/auth/users': users,
  '/api/auth/request-reset-code': reset, '/api/auth/admin/change-password': reset,
  '/api/gemini/chat': chat,
  '/api/assistant': assistant,
  '/api/auth/mfa': mfa,
};

export async function dispatchApi(req: any, res: any) {
  try {
    const url = new URL(req.originalUrl || req.url, 'http://local.invalid');
    // Resolve the same rewrites as Vercel, with path parameters taking precedence.
    let route = url.pathname;
    const query = Object.fromEntries(url.searchParams);
    for (const rule of rewrites) {
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
