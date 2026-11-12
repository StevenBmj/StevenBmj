import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { dispatchApi } from './src/server/apiRouter';
import { reply } from './src/server/security';
import { servePage } from './src/server/seo';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb', strict: true }));
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  void dispatchApi(req, res).catch(next);
});
app.use((error: any, req: any, res: any, next: any) => {
  if (res.headersSent) return next(error);
  reply(res, error?.type === 'entity.too.large' ? 413 : 400, { error: 'Requete invalide ou trop volumineuse.' });
});

async function startServer() {
  const httpServer = createHttpServer(app);
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true, hmr: { server: httpServer } }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve('dist');
    app.get('/sitemap.xml', (req, res, next) => { void servePage(req, res, 'sitemap.xml').catch(next); });
    app.use(express.static(dist, { index: false }));
    app.get('*', (req, res, next) => { void servePage(req, res, req.path).catch(next); });
  }
  const port = Number(process.env.PORT || 3000);
  httpServer.listen(port, '0.0.0.0', () => console.log(`StevenBmj: http://localhost:${port}`));
}

if (process.env.VERCEL !== '1') void startServer();
export default app;
