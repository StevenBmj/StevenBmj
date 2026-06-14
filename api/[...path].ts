import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import {
  announcementToRow,
  orderToRow,
  productToRow,
  promoToRow,
  reviewToRow,
  rowToAnnouncement,
  rowToOrder,
  rowToProduct,
  rowToPromo,
  rowToReview,
} from '../src/server/supabaseMappings';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();
const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'stevenbmj123';

function json(res: any, status: number, body: any) {
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are missing.');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function readBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

async function findAuthUserByEmail(supabase: any, email: string) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user: any) => String(user.email || '').toLowerCase() === email.toLowerCase());
    if (found || data.users.length < 1000) return found || null;
    page += 1;
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) return false;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: `"Maison StevenBmj" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
  return true;
}

async function addLog(supabase: any, event: string, status = 'SECURED') {
  await supabase.from('security_logs').insert({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    ip: '0.0.0.0',
    event,
    status,
  });
}

async function getProfileByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

function publicUser(profile: any) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    googleLinked: profile.google_linked,
    vipPoints: profile.vip_points,
    isAdmin: profile.is_admin,
  };
}

async function handleGemini(req: any, res: any, supabase: any) {
  const body = await readBody(req);
  const message = body.message || body.messages?.[body.messages.length - 1]?.text || '';
  const language = body.language || 'FR';
  if (!message) return json(res, 400, { error: 'Session de discussion ou message invalide.' });

  const lowerMsg = message.toLowerCase();
  const recommendedProductId = lowerMsg.includes('tourbillon') ? 'prod-11'
    : lowerMsg.includes('montre') || lowerMsg.includes('watch') ? 'prod-1'
    : lowerMsg.includes('mocassin') || lowerMsg.includes('shoe') ? 'prod-7'
    : lowerMsg.includes('chain') || lowerMsg.includes('chaine') ? 'prod-3'
    : undefined;

  const fallbackReply = language === 'FR'
    ? "Bienvenue chez StevenBmj. Pour une pièce d'exception, je vous recommande La Royale Chronographe Or, nos Mocassins Crêpe Suédés ou la Chaîne Royale Diamond 24k selon votre tenue."
    : "Welcome to StevenBmj. I recommend The Royale Gold Chronograph, our Crepe Suede Loafers, or the Royal Diamond 24k Chain depending on your silhouette.";

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    return json(res, 200, { text: fallbackReply, reply: fallbackReply, recommendedProductId, isMock: true });
  }

  try {
    const { data: products } = await supabase.from('products').select('*').limit(30);
    const catalogue = (products || []).map(rowToProduct).map((p) => `${p.name}: ${p.price} EUR`).join('\n');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: `Tu es STEVEN, assistant luxe officiel StevenBmj. Réponds en ${language}. Catalogue:\n${catalogue}`,
      },
    });
    const reply = response.text || fallbackReply;
    return json(res, 200, { text: reply, reply, recommendedProductId });
  } catch {
    return json(res, 200, { text: fallbackReply, reply: fallbackReply, recommendedProductId, isFallback: true });
  }
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = getSupabase();
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    const path = url.pathname.replace(/^\/api/, '') || '/';
    const method = req.method || 'GET';

    if (method === 'GET' && path === '/health') {
      return json(res, 200, { ok: true, supabase: true, timestamp: new Date().toISOString() });
    }

    if (method === 'GET' && path === '/products') {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return json(res, 200, (data || []).map(rowToProduct));
    }

    if (method === 'POST' && path === '/products') {
      const body = await readBody(req);
      if (!body.name || !body.price) return json(res, 400, { error: 'Le nom et le prix sont obligatoires.' });
      const product = { ...body, id: body.id || `prod-${Date.now()}` };
      const { error } = await supabase.from('products').upsert(productToRow(product), { onConflict: 'id' });
      if (error) throw error;
      await addLog(supabase, `Produit sauvegardé: ${product.name}`);
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      return json(res, 200, { success: true, products: (data || []).map(rowToProduct) });
    }

    const productDelete = path.match(/^\/products\/(.+)$/);
    if (method === 'DELETE' && productDelete) {
      await supabase.from('products').delete().eq('id', decodeURIComponent(productDelete[1]));
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      return json(res, 200, { success: true, products: (data || []).map(rowToProduct) });
    }

    if (method === 'GET' && path === '/settings') {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      if (error) throw error;
      return json(res, 200, data?.data || {});
    }

    if (method === 'POST' && path === '/settings') {
      const body = await readBody(req);
      const current = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      const merged = { ...(current.data?.data || {}), ...body };
      const { error } = await supabase.from('app_settings').upsert({ id: 'default', data: merged }, { onConflict: 'id' });
      if (error) throw error;
      return json(res, 200, { success: true, settings: merged });
    }

    if (method === 'GET' && path === '/promos') {
      const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return json(res, 200, (data || []).map(rowToPromo));
    }

    if (method === 'POST' && path === '/promos') {
      const body = await readBody(req);
      const promo = { ...body, code: String(body.code || '').toUpperCase(), active: body.active !== false };
      if (!promo.code || !promo.discountPercentage) return json(res, 400, { error: 'Paramètres de promo invalides.' });
      const { error } = await supabase.from('promo_codes').upsert(promoToRow(promo), { onConflict: 'code' });
      if (error) throw error;
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: true });
      return json(res, 200, { success: true, promos: (data || []).map(rowToPromo) });
    }

    const promoToggle = path.match(/^\/promos\/(.+)\/toggle$/);
    if (method === 'POST' && promoToggle) {
      const code = decodeURIComponent(promoToggle[1]).toUpperCase();
      const current = await supabase.from('promo_codes').select('*').eq('code', code).single();
      if (current.error) return json(res, 404, { error: 'Code promo introuvable' });
      await supabase.from('promo_codes').update({ active: !current.data.active }).eq('code', code);
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: true });
      return json(res, 200, { success: true, promos: (data || []).map(rowToPromo) });
    }

    const promoDelete = path.match(/^\/promos\/(.+)$/);
    if (method === 'DELETE' && promoDelete) {
      await supabase.from('promo_codes').delete().eq('code', decodeURIComponent(promoDelete[1]).toUpperCase());
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: true });
      return json(res, 200, { success: true, promos: (data || []).map(rowToPromo) });
    }

    if (method === 'GET' && path === '/orders') {
      const { data, error } = await supabase.from('orders').select('*').order('date', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(rowToOrder));
    }

    if (method === 'POST' && path === '/orders') {
      const body = await readBody(req);
      if (!body.customerName || !body.whatsapp || !body.address || !body.city || !body.items?.length) {
        return json(res, 400, { error: 'Tous les champs de livraison obligatoires doivent être remplis.' });
      }
      const order = {
        id: `SBMJ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        customerName: body.customerName,
        whatsapp: body.whatsapp,
        email: body.email || `${String(body.customerName).toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        address: body.address,
        city: body.city,
        notes: body.notes,
        items: body.items,
        totalPrice: body.totalPrice,
        currency: body.currency || 'EUR',
        status: 'pending',
        date: new Date().toISOString(),
      };
      for (const item of body.items) {
        const product = await supabase.from('products').select('stock').eq('id', item.productId).maybeSingle();
        if (product.data) await supabase.from('products').update({ stock: Math.max(0, Number(product.data.stock || 0) - Number(item.quantity || 0)) }).eq('id', item.productId);
      }
      const { error } = await supabase.from('orders').insert(orderToRow(order as any));
      if (error) throw error;
      return json(res, 200, { success: true, order });
    }

    const orderUpdate = path.match(/^\/orders\/(.+)$/);
    if (method === 'PUT' && orderUpdate) {
      const body = await readBody(req);
      await supabase.from('orders').update({ status: body.status }).eq('id', decodeURIComponent(orderUpdate[1]));
      const { data } = await supabase.from('orders').select('*').eq('id', decodeURIComponent(orderUpdate[1])).single();
      return json(res, 200, { success: true, order: rowToOrder(data) });
    }

    if (method === 'POST' && path === '/auth/register') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!body.name || !email || !body.password) return json(res, 400, { error: 'Tous les champs sont requis.' });
      if (await getProfileByEmail(supabase, email)) return json(res, 400, { error: 'Cette adresse e-mail est déjà enregistrée.' });
      const isAdmin = email === ADMIN_EMAIL;
      const activationCode = isAdmin ? '' : Math.floor(100000 + Math.random() * 900000).toString();
      const auth = await supabase.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
        user_metadata: { name: body.name },
      });
      if (auth.error || !auth.data.user) return json(res, 400, { error: auth.error?.message || 'Création impossible.' });
      const profile = {
        id: auth.data.user.id,
        name: body.name,
        email,
        google_linked: false,
        vip_points: 100,
        is_admin: isAdmin,
        is_confirmed: isAdmin,
        activation_code: activationCode,
        reset_code: '',
        date_joined: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').insert(profile);
      if (error) throw error;
      if (!isAdmin) {
        await sendEmail(email, 'Activation de votre compte Maison StevenBmj', `<p>Votre code d'activation StevenBmj est :</p><h2>${activationCode}</h2>`);
      }
      return json(res, 200, { success: true, requiresActivation: !isAdmin, email, user: isAdmin ? publicUser(profile) : null });
    }

    if (method === 'POST' && path === '/auth/login') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const auth = await supabase.auth.signInWithPassword({ email, password: String(body.password || '') });
      if (auth.error || !auth.data.user) return json(res, 401, { error: 'Identifiants incorrects.' });
      const profile = await getProfileByEmail(supabase, email);
      if (!profile) return json(res, 401, { error: 'Profil client introuvable.' });
      if (!profile.is_confirmed) return json(res, 403, { error: 'UNCONFIRMED_ACCOUNT', email, message: "Votre compte de prestige n'est pas encore activé. Entrez le code d'activation envoyé par courriel." });
      return json(res, 200, { success: true, user: publicUser(profile) });
    }

    if (method === 'POST' && path === '/auth/activate') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const profile = await getProfileByEmail(supabase, email);
      if (!profile) return json(res, 404, { error: 'Compte client introuvable.' });
      if (profile.activation_code !== String(body.code || '').trim()) return json(res, 400, { error: 'Le code de confirmation saisi est erroné.' });
      const { data, error } = await supabase.from('profiles').update({ is_confirmed: true, activation_code: '' }).eq('email', email).select('*').single();
      if (error) throw error;
      return json(res, 200, { success: true, message: 'Votre compte a été activé avec succès !', user: publicUser(data) });
    }

    if (method === 'POST' && path === '/auth/google') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return json(res, 400, { error: 'E-mail de compte Google requis.' });
      let profile = await getProfileByEmail(supabase, email);
      if (!profile) {
        const auth = await supabase.auth.admin.createUser({
          email,
          password: `google-linked-${Date.now()}`,
          email_confirm: true,
          user_metadata: { name: body.name || email.split('@')[0] },
        });
        if (auth.error || !auth.data.user) return json(res, 400, { error: auth.error?.message || 'Création impossible.' });
        profile = {
          id: auth.data.user.id,
          name: body.name || email.split('@')[0],
          email,
          google_linked: true,
          vip_points: email === ADMIN_EMAIL ? 99999 : 200,
          is_admin: email === ADMIN_EMAIL,
          is_confirmed: true,
          activation_code: '',
          reset_code: '',
          date_joined: new Date().toISOString(),
        };
        await supabase.from('profiles').insert(profile);
      } else {
        const updated = await supabase.from('profiles').update({ google_linked: true, is_confirmed: true }).eq('email', email).select('*').single();
        profile = updated.data || profile;
      }
      return json(res, 200, { success: true, user: publicUser(profile) });
    }

    if (method === 'GET' && path === '/auth/users') {
      const { data, error } = await supabase.from('profiles').select('*').order('date_joined', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(publicUser));
    }

    if (method === 'POST' && path === '/auth/request-reset-code') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const profile = await getProfileByEmail(supabase, email);
      if (!profile && email !== ADMIN_EMAIL) return json(res, 404, { error: "Aucun compte client n'existe sous cet identifiant." });
      if (email === ADMIN_EMAIL) {
        const current = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
        await supabase.from('app_settings').upsert({ id: 'default', data: { ...(current.data?.data || {}), adminResetCode: code } }, { onConflict: 'id' });
      } else {
        await supabase.from('profiles').update({ reset_code: code }).eq('email', email);
      }
      await sendEmail(email, 'Code de modification de mot de passe StevenBmj', `<p>Votre code de sécurité est :</p><h2>${code}</h2>`);
      return json(res, 200, { success: true, message: 'Un code de validation a été transmis à votre adresse e-mail.' });
    }

    if (method === 'POST' && path === '/auth/client/change-password') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const profile = await getProfileByEmail(supabase, email);
      if (!profile) return json(res, 404, { error: 'Compte client introuvable.' });
      if (profile.reset_code !== String(body.code || '').trim()) return json(res, 403, { error: 'Le code de sécurité SMTP est incorrect ou a expiré.' });
      await supabase.auth.admin.updateUserById(profile.id, { password: body.newPassword });
      await supabase.from('profiles').update({ reset_code: '' }).eq('email', email);
      return json(res, 200, { success: true, message: 'Votre mot de passe a été modifié avec succès.' });
    }

    if (method === 'POST' && path === '/auth/admin/change-password') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (email !== ADMIN_EMAIL) return json(res, 403, { error: 'Souveraineté refusée.' });
      const settings = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      if (settings.data?.data?.adminResetCode !== String(body.code || '').trim()) return json(res, 403, { error: 'Le code de sécurité administrateur est invalide.' });
      const authUser = await findAuthUserByEmail(supabase, ADMIN_EMAIL);
      if (authUser) await supabase.auth.admin.updateUserById(authUser.id, { password: body.newPassword || ADMIN_INITIAL_PASSWORD });
      await supabase.from('app_settings').upsert({ id: 'default', data: { ...(settings.data?.data || {}), adminPassword: body.newPassword, adminResetCode: '' } }, { onConflict: 'id' });
      return json(res, 200, { success: true, message: "Mot de passe d'administration réinitialisé avec succès." });
    }

    if (method === 'POST' && path === '/auth/client/delete-account') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const profile = await getProfileByEmail(supabase, email);
      if (!profile) return json(res, 404, { error: 'Compte client introuvable.' });
      await supabase.auth.admin.deleteUser(profile.id);
      return json(res, 200, { success: true, message: 'Votre compte de prestige a été supprimé définitivement.' });
    }

    const userDelete = path.match(/^\/auth\/users\/(.+)$/);
    if (method === 'DELETE' && userDelete) {
      await supabase.auth.admin.deleteUser(decodeURIComponent(userDelete[1]));
      return json(res, 200, { success: true, message: 'Le compte client a été supprimé avec succès.' });
    }

    if (method === 'DELETE' && path === '/auth/users') {
      const { data } = await supabase.from('profiles').select('id');
      for (const profile of data || []) await supabase.auth.admin.deleteUser(profile.id);
      return json(res, 200, { success: true, message: 'Tous les comptes clients ont été supprimés avec succès.' });
    }

    if (method === 'GET' && path === '/reviews') {
      const { data, error } = await supabase.from('reviews').select('*').eq('status', 'approved').order('date', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(rowToReview));
    }

    if (method === 'GET' && path === '/reviews/admin') {
      const { data, error } = await supabase.from('reviews').select('*').order('date', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(rowToReview));
    }

    if (method === 'POST' && path === '/reviews') {
      const body = await readBody(req);
      const review = { id: `rev-${Date.now()}`, customerName: body.customerName, rating: Number(body.rating || 5), text: body.text, status: 'pending', date: new Date().toISOString() };
      const { error } = await supabase.from('reviews').insert(reviewToRow(review));
      if (error) throw error;
      return json(res, 200, { success: true, review });
    }

    const reviewApprove = path.match(/^\/reviews\/(.+)\/approve$/);
    if (method === 'PUT' && reviewApprove) {
      await supabase.from('reviews').update({ status: 'approved' }).eq('id', decodeURIComponent(reviewApprove[1]));
      const { data } = await supabase.from('reviews').select('*').order('date', { ascending: false });
      return json(res, 200, { success: true, reviews: (data || []).map(rowToReview) });
    }

    const reviewDelete = path.match(/^\/reviews\/(.+)$/);
    if (method === 'DELETE' && reviewDelete) {
      await supabase.from('reviews').delete().eq('id', decodeURIComponent(reviewDelete[1]));
      const { data } = await supabase.from('reviews').select('*').order('date', { ascending: false });
      return json(res, 200, { success: true, reviews: (data || []).map(rowToReview) });
    }

    if (method === 'GET' && path === '/announcements') {
      const { data, error } = await supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(rowToAnnouncement));
    }

    if (method === 'POST' && path === '/announcements') {
      const body = await readBody(req);
      const ann = { id: `ann-${Date.now()}`, text: body.text, textEn: body.textEn || body.text, expiresAt: new Date(Date.now() + Number(body.durationMinutes || 1440) * 60000).toISOString(), active: true };
      const { error } = await supabase.from('announcements').insert(announcementToRow(ann));
      if (error) throw error;
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      return json(res, 200, { success: true, announcements: (data || []).map(rowToAnnouncement) });
    }

    const annDelete = path.match(/^\/announcements\/(.+)$/);
    if (method === 'DELETE' && annDelete) {
      await supabase.from('announcements').delete().eq('id', decodeURIComponent(annDelete[1]));
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      return json(res, 200, { success: true, announcements: (data || []).map(rowToAnnouncement) });
    }

    if (method === 'GET' && path === '/security-logs') {
      const { data, error } = await supabase.from('security_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (error) throw error;
      return json(res, 200, data || []);
    }

    if (method === 'DELETE' && path === '/security-logs') {
      await supabase.from('security_logs').delete().not('id', 'is', null);
      return json(res, 200, { success: true, logs: [] });
    }

    if (method === 'GET' && path === '/analytics') {
      return json(res, 200, [
        { name: 'Lundi / Mon', ventes: 18000, benefices: 7500, pertes: 0, revenus: 18000, visiteurs: 450, clics: 1200, conversion: 3.8 },
        { name: 'Mardi / Tue', ventes: 29500, benefices: 12100, pertes: 0, revenus: 29500, visiteurs: 520, clics: 1530, conversion: 4.2 },
      ]);
    }

    if (method === 'POST' && path === '/gemini/chat') {
      return handleGemini(req, res, supabase);
    }

    return json(res, 404, { error: `API route not found: ${method} ${path}` });
  } catch (error: any) {
    return json(res, 500, {
      error: 'Erreur serveur API',
      message: error?.message || String(error),
    });
  }
}
