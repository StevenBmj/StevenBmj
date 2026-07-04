/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import { INITIAL_PRODUCTS } from './src/data/products';
import type { Product, Order, PromoCode, AppSettings } from './src/types';
import {
  ensureAuthUser,
  findAuthUserByEmail,
  getSupabaseAdmin,
  hasSupabaseConfig,
  loadStoreFromSupabase,
  saveStoreToSupabase,
  upsertProfile,
} from './src/server/supabaseStore';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const MAIL_USER = process.env.MAIL_USER || 'stevenbmj202@gmail.com';
const MAIL_APP_PASSWORD = process.env.MAIL_APP_PASSWORD || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();
const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'stevenbmj123';

// Transporter with StevenBmj app credentials
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_APP_PASSWORD
  }
});

// Helper for sending beautiful HTML SMTP emails from haute couture bureau
async function sendCoutureEmail(to: string, subject: string, htmlContent: string) {
  try {
    await mailTransporter.sendMail({
      from: `"Maison StevenBmj" <${MAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #000; color: #fff; padding: 40px 20px; line-height: 1.6; text-align: left; max-width: 600px; margin: 0 auto; border: 1px solid #1a1a1a;">
          <div style="text-align: center; border-bottom: 1px solid #1a1a1a; padding-bottom: 30px; margin-bottom: 30px;">
            <div style="font-size: 26px; font-weight: 300; letter-spacing: 0.25em; text-transform: uppercase; color: #ffffff;">StevenBmj</div>
            <div style="font-size: 8px; font-weight: 400; letter-spacing: 0.4em; color: #cca43b; text-transform: uppercase; margin-top: 5px;">Haute Joaillerie & Couture</div>
          </div>
          <div style="font-size: 13px; font-weight: 300; color: #e5e5e5; letter-spacing: 0.05em;">
            ${htmlContent}
          </div>
          <div style="text-align: center; border-top: 1px solid #1a1a1a; padding-top: 30px; margin-top: 40px; font-size: 9px; font-family: monospace; color: #555555; letter-spacing: 0.2em; text-transform: uppercase;">
            © ${new Date().getFullYear()} Maison StevenBmj • Cotonou, Bénin • Tous droits réservés.
          </div>
        </div>
      `
    });
    console.log(`[Email Sent successfully] To ${to} : ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email Failed dispatching] To ${to} :`, error);
    return false;
  }
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

function isValidPersonName(value: string) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/.test(value.trim()) && !/\d/.test(value);
}

function generateAuthCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(6), (byte) => alphabet[byte % alphabet.length]).join('');
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable JSON bodies with higher limits for luxury asset uploads
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    supabase: hasSupabaseConfig(),
    timestamp: new Date().toISOString(),
  });
});

// Initial State Setup
const DB_FILE = path.join(process.cwd(), 'db_store.json');

const DEFAULT_SETTINGS: AppSettings = {
  homepageHeroTitle: "L'ÉLÉGANCE À L'ÉTAT BRUT",
  homepageHeroTitleEn: "RAW AND PURE ELEGANCE",
  homepageHeroSubtitle: "Découvrez notre collection exclusive de montres de prestige, costumes de créateurs et joallerie de haute facture pour l'homme d'action moderne.",
  homepageHeroSubtitleEn: "Explore our exclusive collection of prestige watches, bespoke tailoring, and majestic fine jewelry curated for the modern master of action.",
  homepageHeroImage1: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600&auto=format&fit=crop",
  homepageHeroImage2: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
  homepageHeroImage3: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1600&auto=format&fit=crop",
  announcementText: "✨ EXPÉDITION PRIVÉE OFFERTE DANS TOUT LE GOLFE DE GUINÉE & À L'INTERNATIONAL SUR TOUTES NOS COLLECTIONS D'EXCEPTION ✨",
  announcementTextEn: "✨ FREE PRIVATE COURIER DELIVERY IN WEST AFRICA & WORLDWIDE ACROSS ALL EXQUISITE COLLECTIONS ✨",
  whatsappContact: "+22955468138",
  taxRate: 0,
  aboutTitle: "MAISON STEVENBMJ — L'OR ET LA COMPLICATION",
  aboutTitleEn: "MAISON STEVENBMJ — RAW PRECIOUS MASS & COMPLICATIONS",
  aboutContent: "Fondée sur le principe de la souveraineté esthétique absolue, la Maison StevenBmj fusionne l'artisanat milanais avec l'ingénierie horlogère suisse de pointe. Chaque pièce de notre catalogue est sculptée dans des matières nobles : or pur 24K, diamants rutilants de pureté VVS1, et cuirs au tannage minéral d'exception.",
  aboutContentEn: "Founded on the principle of absolute aesthetic sovereignty, Maison StevenBmj fuses Milanese sartorial mastery with top-tier Swiss watchmaking. Every single piece in our vault is meticulously carved out of pristine elements: raw 24K gold, blazing VVS1 diamonds, and hand-tanned grade-A full grain leathers.",
  contactTitle: "SALON PRIVÉ & SERVICES CONCIERGERIE",
  contactTitleEn: "PRIVATE VAULT & CONCIERGE SERVICES",
  contactAddress: "Avenue du Prestige, Quartier Akpakpa, Cotonou, Bénin. (En face de la Zone Résidentielle)",
  contactAddressEn: "Prestige Avenue, Akpakpa District, Cotonou, Benin. (Opposite the Residential Enclave)",
  googleMapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.482701053427!2d2.463388!3d6.360155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x102355db7cb9b51%3A0xbc78051743e47fdc!2sAkpakpa%2C%20Cotonou!5e0!3m2!1sfr!2sbj!4v1700000000000",
  adminPassword: "stevenbmj123",
  careTitle: "ATELIER CARE & SOUVERAINETÉ",
  careTitleEn: "ATELIER SOUVERAIN CARE",
  careContent: "Une question sur une taille, un ajustement sur-mesure ou une commande haute couture ? Notre service de conciergerie privée vous répond sous 15 minutes, 24/7.",
  careContentEn: "Any height adjustment or custom sewing request? Our private elite concierge will reply within 15 minutes, 24/7.",
  footerText: "StevenBmj est une marque déposée de la Maison de Haute Couture Souveraine. L'élégance n'est pas une attitude, c'est une complication.",
  footerTextEn: "StevenBmj is a registered trademark of the Sovereign Haute Couture House. Elegance is not an attitude, it is a complication.",
  footerCredits: "© 2026 StevenBmj. Conçu pour l'élite mondiale.",
  footerCreditsEn: "© 2026 StevenBmj. Curated for the global elite.",
  
  // Custom Homepage Section 2 (Philosophie / Story)
  storyTitleFr: "L'Art de Vivre sans Compromis sur le Raffinement",
  storyTitleEn: "The Craft of Absolute and Timeless Masculine Silhouette",
  storyDescFr: "Fondée sur l'excellence horlogère des plus hauts calibres, la Maison StevenBmj imagine un vestiaire d'exception où s'unissent des lignes géométriques avant-gardistes et une orfèvrerie étincelante. Nos diamants sont sertis main et nos mocassins crêpes taillés dans les plus hauts grades de suède d'Italie.",
  storyDescEn: "Formed upon the highest peaks of horological art, the Maison StevenBmj crafts an elite gentlemen vestiary merging sharp architectural lines with glittering hand-paved 18k diamonds and authentic Italian crepe loafers.",
  storyImage: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=600&auto=format&fit=crop",

  // Custom Homepage Fabrics (Section 3)
  fabric1TitleFr: "Tissu de Prestige \"Good Luck\"",
  fabric1TitleEn: "Prestige Fabric \"Good Luck\"",
  fabric1DescFr: "Tissage jacquard de soie d'une brillance spectaculaire aux arabesques dorées, plébiscitée par l'élite et apportant bénédiction et fortune aux chefs d'influence.",
  fabric1DescEn: "Spectacular silk jacquard weave with golden arabesques, favored by elite circles, believed to summon luxury and fortune.",
  fabric1Image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop",

  fabric2TitleFr: "Super-Wax Vlisco Hollandais",
  fabric2TitleEn: "Authentic Vlisco Dutch Super-Wax",
  fabric2DescFr: "L'authentique pièce de coton dense double face à base de cire naturelle. Couleurs inaltérables et tracés millimétriques d'une pureté de design extraordinaire.",
  fabric2DescEn: "The original high-density double-sided cotton wax premium block. Natural waxes and precision designs.",
  fabric2Image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",

  fabric3TitleFr: "Brocart de Soie de Saint-Gall",
  fabric3TitleEn: "Swiss St. Gallen Silk Brocade",
  fabric3DescFr: "Importé du canton historique textile en Suisse. Un satin broché rigide sculpté en reliefs d'or pour dessiner les plus prestigieux apparats souverains de la haute noblesse.",
  fabric3DescEn: "Imported from the historical Swiss textile capital. Stiff satin broché carved with gold relief.",
  fabric3Image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=600&auto=format&fit=crop",

  // Custom Homepage Salons (Section 4 Bento)
  bento1TitleFr: "Horlogerie Royale de Prestige",
  bento1TitleEn: "Royal Horology of Prestige",
  bento1DescFr: "Chronographes automatiques d'influence à remontage automatique, verre saphir inrayable et boîtiers lunettes cannelées.",
  bento1DescEn: "Self-winding automatic influence chronographs, scratch-resistant sapphire crystal and fluted bezels.",
  bento1Image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",

  bento2TitleFr: "Maillons & Or 18k",
  bento2TitleEn: "Chains & 18k Gold",
  bento2DescFr: "Chaînes de cou iconiques, bagues biseautées et bracelets massifs en or pur.",
  bento2DescEn: "Iconic neck chains, heavy bevelled rings and massive pure gold bracelets.",
  bento2Image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",

  bento3TitleFr: "Crepe Loafers & Silouhettes",
  bento3TitleEn: "Crepe Loafers & Silhouettes",
  bento3DescFr: "Mocassins luxurieux à semelle gomme crêpe naturelle, alliance ultime du confort et de l'élégance.",
  bento3DescEn: "Luxurious loafers featuring natural crepe rubber soles, the ultimate alliance of comfort and sharp elegance.",
  bento3Image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop",

  bento4TitleFr: "Tailoring & Costumes sur Mesure",
  bento4TitleEn: "Tailoring & Bespoke Suits",
  bento4DescFr: "Laine extra-fine mérinos, cachemire doublé et vestes structurées croisées aux boutons ciselés d'or.",
  bento4DescEn: "Extra-fine merino wool, full cashmere double lining, and double-breasted jackets.",
  bento4Image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=1600&auto=format&fit=crop",

  faqsJson: JSON.stringify([
    { q: "Quels sont les délais de livraison pour les pièces d'exception ?", qEn: "What are the delivery times for the prestige pieces?", a: "Toutes nos pièces d'exception sont expédiées sous 24h par messagerie privée aérienne chiffrée avec assurance intégrale.", aEn: "All exceptional pieces are shipped within 24 hours under high-security private air cargo with full insurance." },
    { q: "Proposez-vous du sur-mesure pour les costumes et robes ?", qEn: "Do you offer custom tailoring for suits and gowns?", a: "Absolument. Nos maîtres tailleurs milanais ajustent chaque modèle selon vos mesures précises reçues par WhatsApp.", aEn: "Absolutely. Our master tailors in Milan will adjust any garment precisely to your measurements submitted via WhatsApp." },
    { q: "Quelle est l'origine de vos cuirs et métaux précieux ?", qEn: "What is the origin of your leathers and precious metals?", a: "Chaque diamant est certifié pureté VVS1, nos métaux sont de l'or pur 24k ou 18k brossé, et nos cuirs proviennent de tanneries italiennes certifiées.", aEn: "Each diamond is certified VVS1, our metals are pure 18k/24k gold, and all leathers are sourced from certified Italian tanneries." }
  ])
};

let dbStore = {
  products: INITIAL_PRODUCTS as Product[],
  orders: [] as Order[],
  promos: [
    { code: "STEVENBMJ10", discountPercentage: 10, active: true },
    { code: "PRESTIGE20", discountPercentage: 20, active: true, minAmount: 5000 },
    { code: "WELCOMEVIP", discountPercentage: 15, active: true }
  ] as PromoCode[],
  settings: { ...DEFAULT_SETTINGS } as AppSettings,
  logs: [] as { timestamp: string; ip: string; event: string; status: string }[],
  announcements: [] as { id: string; text: string; textEn: string; expiresAt: string; active: boolean }[],
  users: [] as any[],
  reviews: [
    { id: "rev-1", customerName: "Jean-Louis O.", rating: 5, text: "Les mocassins crêpe sont d'un confort impérial. Service client exceptionnel, digne d'un hôtel 5 étoiles.", status: "approved", date: new Date().toISOString() },
    { id: "rev-2", customerName: "Amina K.", rating: 5, text: "L'Absolu parfum a une tenue incroyable. Maison StevenBmj reste l'excellence de la haute parfumerie.", status: "approved", date: new Date().toISOString() },
    { id: "rev-3", customerName: "Marc-Antoine D.", rating: 5, text: "Le chronographe Royale Or est une merveille de précision. Je recommande vivement pour les collectionneurs exigeants.", status: "approved", date: new Date().toISOString() },
    { id: "rev-4", customerName: "Nadia T.", rating: 5, text: "Robe impériale fantastique. La coupe est parfaite.", status: "pending", date: new Date().toISOString() }
  ] as any[]
};

// Log helper to simulate an ethical hacker/cybersecurity firewall screen
function addSecurityLog(event: string, status: 'SECURED' | 'ATTACK_BLOCKED' | 'INFO', ip: string = '127.0.0.1') {
  const timestamp = new Date().toISOString();
  dbStore.logs.unshift({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp, ip, event, status } as any);
  if (dbStore.logs.length > 100) dbStore.logs.pop(); // cap at 100
  saveDb();
}

function ensureSettingsDefaults() {
  if (!dbStore.settings) {
    dbStore.settings = { ...DEFAULT_SETTINGS } as AppSettings;
    return;
  }
  
  // Fill in any key that is missing, undefined, null, or is an empty string
  for (const key in DEFAULT_SETTINGS) {
    const k = key as keyof typeof DEFAULT_SETTINGS;
    if (
      dbStore.settings[k] === undefined ||
      dbStore.settings[k] === null ||
      String(dbStore.settings[k]).trim() === ''
    ) {
      (dbStore.settings as any)[k] = DEFAULT_SETTINGS[k];
    }
  }
}

// Load DB
async function loadDb() {
  if (hasSupabaseConfig()) {
    try {
      const remoteStore = await loadStoreFromSupabase(dbStore);
      if (remoteStore) {
        dbStore = { ...dbStore, ...remoteStore };
        ensureSettingsDefaults();
        console.log("DB Store loaded and synchronized successfully from Supabase.");
        if (!dbStore.products.length) {
          dbStore.products = [...INITIAL_PRODUCTS];
          saveDb();
        }
        return;
      }
    } catch (e) {
      console.error("Error loading Supabase DB. Falling back to local JSON.", e);
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      
      const loadedProducts = parsed.products || [];
      // Smart merging: assure newly declared INITIAL_PRODUCTS are incorporated gracefully
      INITIAL_PRODUCTS.forEach(initP => {
        if (!loadedProducts.some((p: any) => p.id === initP.id)) {
          loadedProducts.push(initP);
        }
      });
      dbStore.products = loadedProducts;
      
      dbStore.orders = parsed.orders || dbStore.orders;
      dbStore.promos = parsed.promos || dbStore.promos;
      dbStore.settings = { ...dbStore.settings, ...parsed.settings };
      ensureSettingsDefaults();
      dbStore.logs = parsed.logs || dbStore.logs;
      dbStore.announcements = parsed.announcements || [];
      dbStore.reviews = parsed.reviews || dbStore.reviews;
      dbStore.users = parsed.users || [];
      
      // Ensure default administrative credentials and seed customer accounts are present and functional
      if (!dbStore.settings.adminPassword || dbStore.settings.adminPassword.trim() === '') {
        dbStore.settings.adminPassword = ADMIN_INITIAL_PASSWORD;
      }

      const hasEliteUser = dbStore.users.some((u: any) => u.email.toLowerCase() === '007killerhunter007@gmail.com');
      if (!hasEliteUser) {
        dbStore.users.push({
          id: "customer_steven_elite",
          name: "Steven Elite",
          email: "007killerhunter007@gmail.com",
          password: "stevenbmj123",
          googleLinked: true,
          vipPoints: 200,
          isAdmin: false,
          isConfirmed: true,
          activationCode: "",
          dateJoined: new Date().toISOString()
        });
      }
      
      console.log("DB Store loaded and synchronized successfully from", DB_FILE);
      saveDb(); // persist newly merged items
    } catch (e) {
      console.error("Error loading DB file. Rewriting...", e);
      saveDb();
    }
  } else {
    saveDb();
  }
}

// Save DB
function saveDb() {
  if (hasSupabaseConfig()) {
    saveStoreToSupabase(dbStore).catch((err) => {
      console.error("Error saving Supabase DB", err);
    });
    return;
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbStore, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving DB file", err);
  }
}

async function deleteSupabaseRows(table: string, column: string, value: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) console.error(`Error deleting from Supabase table ${table}`, error);
}

async function clearSupabaseTable(table: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.from(table).delete().not('id', 'is', null);
  if (error) console.error(`Error clearing Supabase table ${table}`, error);
}

const dbReady = loadDb();

app.use(async (_req, _res, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    next(error);
  }
});

// Secure Rate Limiter for Checkout Form and API
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
function rateLimitMiddleware(req: any, res: any, next: any) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 requests per minute

  const rate = ipRequestCounts.get(ip);
  if (!rate || now > rate.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + limitWindow });
    next();
  } else {
    rate.count++;
    if (rate.count > maxRequests) {
      addSecurityLog(`Rate limit exceeded for IP: ${ip}`, 'ATTACK_BLOCKED', ip);
      return res.status(429).json({ error: "Trop de requêtes. Veuillez patienter une minute. / Too many requests. Please wait." });
    }
    next();
  }
}

// Cyber Intrusion Prevention Shield Firewall Middleware
function cyberFirewallShieldMiddleware(req: any, res: any, next: any) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  
  // 1. Audit URL path for Path Traversal attacks
  const urlDecoded = decodeURIComponent(req.originalUrl || req.url || '').toLowerCase();
  if (urlDecoded.includes('../') || urlDecoded.includes('..\\') || urlDecoded.includes('/etc/passwd') || urlDecoded.includes('/win.ini')) {
    addSecurityLog(`ATTENTAT INTRUSION PARCOUR DE DOSSIER BLOCQUÉ : ${req.originalUrl}`, 'ATTACK_BLOCKED', ip);
    return res.status(403).json({ error: "Cyber Firewall Shield: Path Traversal Attempt Blocked." });
  }

  // 2. Audit query strings and payload request body for typical SQL/NoSQL injections and XSS
  const sqlInjections = [
    "union select", 
    "select * from", 
    "drop table", 
    "insert into", 
    "delete from", 
    "or 1=1", 
    "admin' --", 
    "admin' #", 
    "admin'/*", 
    "'; shutdown", 
    "exec xp_cmdshell", 
    "$where", 
    "{$gt:", 
    "{$ne:"
  ];
  const xssSignatures = [
    "<script>", 
    "</script>", 
    "javascript:", 
    "onerror=", 
    "onload=", 
    "onclick=", 
    "window.location", 
    "alert(", 
    "document.cookie"
  ];

  const inspectValue = (val: any): boolean => {
    if (!val) return false;
    if (typeof val === 'string') {
      const lowVal = val.toLowerCase();
      // Check SQL Injection
      for (const pattern of sqlInjections) {
        if (lowVal.includes(pattern)) {
          addSecurityLog(`ATTENTION INJECTION SQL BLOQUÉE (Valeur: "${val.slice(0, 45)}")`, 'ATTACK_BLOCKED', ip);
          return true;
        }
      }
      // Check XSS
      for (const pattern of xssSignatures) {
        if (lowVal.includes(pattern)) {
          addSecurityLog(`ATTENTION SCRIPT DIRECT XSS BLOQUÉ (Valeur: "${val.slice(0, 45)}")`, 'ATTACK_BLOCKED', ip);
          return true;
        }
      }
    } else if (typeof val === 'object') {
      for (const k in val) {
        if (Object.prototype.hasOwnProperty.call(val, k)) {
          // Avoid checking base64 image data strings as they are innocent
          if (k.toLowerCase().includes('image') || (typeof val[k] === 'string' && val[k].startsWith('data:image/'))) {
            continue;
          }
          if (inspectValue(val[k])) return true;
        }
      }
    }
    return false;
  };

  // Inspect Query params
  if (inspectValue(req.query)) {
    return res.status(403).json({ error: "Cyber Firewall Shield: SQL Injection or XSS detected inside query." });
  }

  // Inspect Request Body (skip if body contains large base64 image data to prevent slow scanning)
  if (req.body) {
    const isImagePayload = Object.keys(req.body).some(k => k.toLowerCase().includes('image') && typeof req.body[k] === 'string' && req.body[k].startsWith('data:image/'));
    if (!isImagePayload && inspectValue(req.body)) {
      return res.status(403).json({ error: "Cyber Firewall Shield: SQL Injection or XSS detected inside payload body." });
    }
  }

  next();
}

// Security Headers Simulation / Check (CSRF and XSS prevention)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cyberFirewallShieldMiddleware);

// --- API ROUTES ---

// SEO CRITICAL DIRECTIVES
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: https://stevenbmj.com/sitemap.xml`);
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const today = new Date().toISOString().split('T')[0];
  
  // Base URLs
  let sitemapLines = [
    `  <url>`,
    `    <loc>https://stevenbmj.com/</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>daily</changefreq>`,
    `    <priority>1.0</priority>`,
    `  </url>`,
    `  <url>`,
    `    <loc>https://stevenbmj.com/#boutique</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>daily</changefreq>`,
    `    <priority>0.9</priority>`,
    `  </url>`,
    `  <url>`,
    `    <loc>https://stevenbmj.com/#vip</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>weekly</changefreq>`,
    `    <priority>0.8</priority>`,
    `  </url>`,
    `  <url>`,
    `    <loc>https://stevenbmj.com/#aide</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>monthly</changefreq>`,
    `    <priority>0.5</priority>`,
    `  </url>`
  ];

  // Dynamic Product URLs
  if (dbStore && dbStore.products) {
    dbStore.products.forEach((p: any) => {
      sitemapLines.push(
        `  <url>`,
        `    <loc>https://stevenbmj.com/#produit?id=${p.id}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>weekly</changefreq>`,
        `    <priority>0.8</priority>`,
        `  </url>`
      );
    });
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLines.join('\n')}
</urlset>`;

  res.send(sitemapXml);
});

// 1. PRODUCTS API
app.get('/api/products', (req, res) => {
  res.json(dbStore.products);
});

// Create/Update Product
app.post('/api/products', rateLimitMiddleware, (req, res) => {
  const productData = req.body as Product;
  
  if (!productData.name || !productData.price) {
    return res.status(400).json({ error: "Le nom et le prix sont obligatoires." });
  }

  const index = dbStore.products.findIndex(p => p.id === productData.id);
  if (index > -1) {
    // Edit existing
    dbStore.products[index] = { ...dbStore.products[index], ...productData };
    addSecurityLog(`Modification produit: ${productData.name}`, 'SECURED');
  } else {
    // Add new
    const id = productData.id || `prod-${Date.now()}`;
    const newProduct: Product = { ...productData, id };
    dbStore.products.push(newProduct);
    addSecurityLog(`Création produit: ${productData.name}`, 'SECURED');
  }
  
  saveDb();
  res.json({ success: true, products: dbStore.products });
});

// Delete Product
app.delete('/api/products/:id', rateLimitMiddleware, async (req, res) => {
  const { id } = req.params;
  const originalCount = dbStore.products.length;
  const item = dbStore.products.find(p => p.id === id);
  dbStore.products = dbStore.products.filter(p => p.id !== id);
  
  if (dbStore.products.length < originalCount) {
    await deleteSupabaseRows('products', 'id', id);
    addSecurityLog(`Suppression produit: ${item?.name || id}`, 'SECURED');
    saveDb();
    res.json({ success: true, products: dbStore.products });
  } else {
    res.status(404).json({ error: "Produit introuvable" });
  }
});

// 2. ORDERS API
app.get('/api/orders', (req, res) => {
  res.json(dbStore.orders);
});

// Create order & auto invoice
app.post('/api/orders', rateLimitMiddleware, (req, res) => {
  const { customerName, whatsapp, email, address, city, notes, items, totalPrice, currency } = req.body;
  
  if (!customerName || !whatsapp || !address || !city || !items || items.length === 0) {
    return res.status(400).json({ error: "Tous les champs de livraison obligatoires doivent être remplis." });
  }

  // Account confirmation safety check
  if (email) {
    const emailKey = email.trim().toLowerCase();
    const user = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey);
    if (user && user.isConfirmed === false) {
      return res.status(403).json({ error: "Votre compte n'est pas encore activé. Veuillez l'activer avec le code reçu par e-mail avant de réaliser des achats d'exception." });
    }
  }

  const orderId = `SBMJ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  
  // Format items with metadata
  const enrichedItems = items.map((cartItem: any) => {
    const parentProd = dbStore.products.find(p => p.id === cartItem.productId);
    return {
      productId: cartItem.productId,
      productName: parentProd ? parentProd.name : cartItem.productName,
      quantity: cartItem.quantity,
      price: cartItem.price,
      selectedSize: cartItem.selectedSize
    };
  });

  const newOrder: Order = {
    id: orderId,
    customerName,
    whatsapp,
    email: email || `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
    address,
    city,
    notes,
    items: enrichedItems,
    totalPrice,
    currency,
    status: 'pending',
    date: new Date().toISOString()
  };

  // Dedux stock
  items.forEach((item: any) => {
    const product = dbStore.products.find(p => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  });

  dbStore.orders.unshift(newOrder);
  addSecurityLog(`Nouvelle commande ${orderId} validée par ${customerName}`, 'SECURED');
  saveDb();

  res.json({ success: true, order: newOrder });
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = dbStore.orders.find(o => o.id === id);
  
  if (order) {
    order.status = status;
    addSecurityLog(`Statut commande ${id} changé pour : ${status}`, 'SECURED');
    saveDb();
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: "Commande introuvable" });
  }
});

// 3. PROMOS API
app.get('/api/promos', (req, res) => {
  const now = Date.now();
  let changed = false;
  dbStore.promos.forEach(p => {
    if (p.active && p.expiresAt && new Date(p.expiresAt).getTime() < now) {
      p.active = false;
      changed = true;
    }
  });
  if (changed) {
    saveDb();
  }
  res.json(dbStore.promos);
});

app.post('/api/promos', (req, res) => {
  const promo = req.body as PromoCode;
  if (!promo.code || !promo.discountPercentage) {
    return res.status(400).json({ error: "Paramètres de promo invalides." });
  }
  const index = dbStore.promos.findIndex(p => p.code.toUpperCase() === promo.code.toUpperCase());
  if (index > -1) {
    dbStore.promos[index] = { ...dbStore.promos[index], ...promo };
  } else {
    dbStore.promos.push({
      code: promo.code.toUpperCase(),
      discountPercentage: Number(promo.discountPercentage),
      minAmount: promo.minAmount ? Number(promo.minAmount) : undefined,
      active: true,
      expiresAt: promo.expiresAt
    });
  }
  saveDb();
  res.json({ success: true, promos: dbStore.promos });
});

app.post('/api/promos/:code/toggle', (req, res) => {
  const code = req.params.code.toUpperCase();
  const index = dbStore.promos.findIndex(p => p.code.toUpperCase() === code);
  if (index > -1) {
    dbStore.promos[index].active = !dbStore.promos[index].active;
    if (dbStore.promos[index].active && dbStore.promos[index].expiresAt && new Date(dbStore.promos[index].expiresAt).getTime() < Date.now()) {
      // If reactivating and it was expired, nullify/clear the old expiry or add 1 day
      dbStore.promos[index].expiresAt = undefined;
    }
    saveDb();
    res.json({ success: true, promos: dbStore.promos });
  } else {
    res.status(404).json({ error: "Code promo introuvable" });
  }
});

app.delete('/api/promos/:code', async (req, res) => {
  dbStore.promos = dbStore.promos.filter(p => p.code.toUpperCase() !== req.params.code.toUpperCase());
  await deleteSupabaseRows('promo_codes', 'code', req.params.code.toUpperCase());
  saveDb();
  res.json({ success: true, promos: dbStore.promos });
});

// 4. SETTINGS API
app.get('/api/settings', (req, res) => {
  ensureSettingsDefaults();
  res.json(dbStore.settings);
});

app.post('/api/settings', (req, res) => {
  dbStore.settings = { ...dbStore.settings, ...req.body };
  ensureSettingsDefaults();
  addSecurityLog("Paramètres généraux mis à jour", 'SECURED');
  saveDb();
  res.json({ success: true, settings: dbStore.settings });
});

// 4.5. ANNOUNCEMENTS API
app.get('/api/announcements', (req, res) => {
  const now = Date.now();
  // Filter out expired announcements to cleanly support deletion timers
  dbStore.announcements = dbStore.announcements.filter(a => {
    if (!a.expiresAt) return true;
    return new Date(a.expiresAt).getTime() > now;
  });
  res.json(dbStore.announcements);
});

app.post('/api/announcements', (req, res) => {
  const { text, textEn, durationMinutes } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Le texte de l'annonce est requis." });
  }

  // Calculate strict expiry date
  const duration = durationMinutes ? Number(durationMinutes) : 1440; // Default 1 day
  const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();

  const newAnn = {
    id: `ann-${Date.now()}`,
    text,
    textEn: textEn || text,
    expiresAt,
    active: true
  };

  dbStore.announcements.unshift(newAnn);
  addSecurityLog(`Nouvelle annonce de prestige publiée : "${text.slice(0, 30)}..."`, 'SECURED');
  saveDb();
  res.json({ success: true, announcements: dbStore.announcements });
});

app.delete('/api/announcements/:id', async (req, res) => {
  dbStore.announcements = dbStore.announcements.filter(a => a.id !== req.params.id);
  await deleteSupabaseRows('announcements', 'id', req.params.id);
  addSecurityLog(`Annonce de prestige archivée`, 'SECURED');
  saveDb();
  res.json({ success: true, announcements: dbStore.announcements });
});

// 5. SECURITY AUDIT LOGS
app.get('/api/security-logs', (req, res) => {
  res.json(dbStore.logs);
});

app.delete('/api/security-logs', async (req, res) => {
  dbStore.logs = [];
  await clearSupabaseTable('security_logs');
  saveDb();
  res.json({ success: true, logs: [] });
});

// 5.2. CUSTOMER ACCOUNTS / AUTHENTICATION API WITH COUTURE EMAIL ACTIVATION
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }
  const cleanName = String(name).trim();
  const emailKey = email.trim().toLowerCase();
  
  // Strict email format validation
  if (!isValidEmailAddress(emailKey)) {
    return res.status(400).json({ error: "L'adresse e-mail n'est pas au format valide (ex: client@elite.com)." });
  }
  if (!isValidPersonName(cleanName)) {
    return res.status(400).json({ error: "Le nom et le prenom ne doivent contenir que des lettres, espaces, apostrophes ou tirets." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caracteres." });
  }

  const existing = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey);
  if (existing) {
    return res.status(400).json({ error: "Cette adresse e-mail est déjà enregistrée." });
  }

  const activationCode = generateAuthCode();
  const activationExpiresAt = new Date(Date.now() + 3 * 60_000).toISOString();

  const isSecuredAdmin = emailKey === ADMIN_EMAIL;

  let authUserId = `usr-${Date.now()}`;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const authUser = await ensureAuthUser(supabase, {
        email: email.trim(),
        password,
        name: cleanName,
        emailConfirm: true,
      });
      authUserId = authUser.id;
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Impossible de créer le compte Supabase." });
    }
  }

  const newUser = {
    id: authUserId,
    name: cleanName,
    email: email.trim(),
    password: password,
    googleLinked: false,
    vipPoints: 100,
    isAdmin: isSecuredAdmin,
    isConfirmed: isSecuredAdmin, // Admin is auto-confirmed
    activationCode: isSecuredAdmin ? '' : activationCode,
    activationExpiresAt: isSecuredAdmin ? null : activationExpiresAt,
    dateJoined: new Date().toISOString()
  };

  dbStore.users.unshift(newUser);
  if (supabase) {
    try {
      await upsertProfile(supabase, newUser);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Impossible de créer le profil Supabase." });
    }
  }
  addSecurityLog(`Création de compte réussie ${isSecuredAdmin ? '' : '(Attente d\'activation)'} : ${name.trim()} (${emailKey})`, 'SECURED');
  saveDb();

  // Send activation code via e-mail for manual signups
  if (!isSecuredAdmin) {
    const subject = "Activation de votre compte Maison StevenBmj";
    const bodyPrat = `
      <p style="font-size: 15px; color: #cca43b; font-weight: bold; margin-bottom: 20px;">BIENVENUE CHEZ MAISON STEVENBMJ</p>
      <p>M. / Mme. <strong>${cleanName}</strong>,</p>
      <p>Votre compte client de prestige a été initié. Afin de l'activer, de le rendre fonctionnel et de vous autoriser à effectuer des acquisitions de haute couture ou d'horlogerie, veuillez renseigner le document de certification ci-dessous dans votre application :</p>
      <div style="background-color: #0b0b0b; border: 1px solid #cca43b; font-family: monospace; font-size: 26px; font-weight: bold; text-align: center; color: #ffffff; padding: 22px; margin: 25px 0; letter-spacing: 0.3em; border-radius: 4px;">
        ${activationCode}
      </div>
      <p>Ce code expire dans 3 minutes.</p>
      <p>Sans cette confirmation indispensable, vos options d'atelier resteront suspendues aux fins de protection de notre clientèle.</p>
      <p style="margin-top: 35px;">Cordialement,</p>
      <p><strong>Le Bureau de Validation</strong><br/>StevenBmj Paris - Cotonou</p>
    `;
    const emailSent = await sendCoutureEmail(email.trim(), subject, bodyPrat);
    if (!emailSent) {
      dbStore.users = dbStore.users.filter((u: any) => u.email.toLowerCase() !== emailKey);
      if (supabase) {
        await deleteSupabaseRows('profiles', 'email', emailKey);
        try {
          await supabase.auth.admin.deleteUser(authUserId);
        } catch (error) {
          console.error("Error rolling back Supabase auth user after email failure", error);
        }
      }
      saveDb();
      return res.status(500).json({ error: "Impossible d'envoyer le code d'activation par e-mail. Verifiez la configuration SMTP puis reessayez." });
    }
  }

  res.json({ 
    success: true, 
    requiresActivation: !isSecuredAdmin,
    email: newUser.email,
    message: !isSecuredAdmin ? "Un code est envoyé à votre adresse mail. Entrez-le dans la minute pour finaliser votre compte." : undefined,
    user: isSecuredAdmin ? { 
      id: newUser.id, 
      name: newUser.name, 
      email: newUser.email, 
      googleLinked: newUser.googleLinked, 
      vipPoints: newUser.vipPoints, 
      isAdmin: newUser.isAdmin 
    } : null 
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "L'adresse email et le mot de passe sont requis." });
  }
  const emailKey = email.trim().toLowerCase();

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailKey,
      password: password.trim(),
    });
    if (error || !data.user) {
      addSecurityLog(`Ã‰chec d'authentification Supabase : Identifiants incorrects pour ${emailKey}`, 'ATTACK_BLOCKED');
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const user = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey || u.id === data.user.id);
    if (!user) {
      addSecurityLog(`Ã‰chec d'authentification : profil introuvable pour ${emailKey}`, 'ATTACK_BLOCKED');
      return res.status(401).json({ error: "Profil client introuvable." });
    }

    if (user.isConfirmed === false) {
      return res.status(403).json({
        error: "UNCONFIRMED_ACCOUNT",
        email: user.email,
        message: "Votre compte de prestige n'est pas encore activÃ©. Entrez le code d'activation envoyÃ© par courriel."
      });
    }

    addSecurityLog(`${user.isAdmin ? "Connexion d'administration" : "Connexion client"} rÃ©ussie : ${user.name} (${user.email})`, 'SECURED');
    return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, googleLinked: user.googleLinked, vipPoints: user.vipPoints, isAdmin: user.isAdmin } });
  }
  
  // Specific Admin Overrides with Google configuration / custom admin password setup
  if (emailKey === 'stevenamorin202@gmail.com') {
    const correctPassword = dbStore.settings.adminPassword || "stevenbmj123";
    if (password.trim() === correctPassword.trim()) {
      addSecurityLog(`Connexion d'administration réussie par stevenamorin202@gmail.com via mot de passe`, 'SECURED');
      return res.json({
        success: true,
        user: {
          id: 'admin',
          name: "StevenBmj Admin",
          email: "stevenamorin202@gmail.com",
          googleLinked: false,
          vipPoints: 99999,
          isAdmin: true
        }
      });
    } else {
      addSecurityLog(`Échec de connexion administrative pour 'stevenamorin202@gmail.com' (Code d'Accès Erroné)`, 'ATTACK_BLOCKED');
    }
  }

  const user = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey && u.password.trim() === password.trim());
  if (!user) {
    addSecurityLog(`Échec d'authentification : Identifiants incorrects pour ${emailKey}`, 'ATTACK_BLOCKED');
    return res.status(401).json({ error: "Identifiants incorrects." });
  }

  // Check if unconfirmed custom user is trying to connect
  if (user.isConfirmed === false) {
    return res.status(403).json({ 
      error: "UNCONFIRMED_ACCOUNT", 
      email: user.email,
      message: "Votre compte de prestige n'est pas encore activé. Entrez le code d'activation envoyé par courriel." 
    });
  }

  addSecurityLog(`Connexion client réussie : ${user.name} (${user.email})`, 'SECURED');
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, googleLinked: user.googleLinked, vipPoints: user.vipPoints, isAdmin: user.isAdmin } });
});

app.post('/api/auth/activate', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Tous les champs d'activation sont requis." });
  }
  const emailKey = email.trim().toLowerCase();
  const user = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey);
  
  if (!user) {
    return res.status(404).json({ error: "Compte client introuvable." });
  }

  const expiresAt = user.activationExpiresAt ? new Date(user.activationExpiresAt).getTime() : 0;
  if (!user.activationCode || !expiresAt || Date.now() > expiresAt) {
    return res.status(400).json({ error: "Le code a expire. Veuillez creer le compte a nouveau pour recevoir un nouveau code." });
  }

  if (String(user.activationCode).toUpperCase() !== String(code).trim().toUpperCase()) {
    return res.status(400).json({ error: "Le code de confirmation saisi est erroné." });
  }

  user.isConfirmed = true;
  user.activationCode = ''; // Consume the activation code
  user.activationExpiresAt = null;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await upsertProfile(supabase, user);
  }
  addSecurityLog(`Compte client activé avec succès (Code E-mail) : ${user.name} (${emailKey})`, 'SECURED');
  saveDb();

  res.json({ 
    success: true, 
    message: "Votre compte régalien de prestige a été activé avec succès !", 
    user: { id: user.id, name: user.name, email: user.email, googleLinked: user.googleLinked, vipPoints: user.vipPoints, isAdmin: user.isAdmin }
  });
});

async function verifyGoogleCredential(credential: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google Auth doit etre configure avec GOOGLE_CLIENT_ID.");
  }
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) throw new Error("Identite Google invalide.");
  const payload: any = await response.json();
  if (payload.aud !== clientId) throw new Error("Client Google non autorise.");
  if (!payload.email || payload.email_verified !== 'true') throw new Error("Adresse Google non verifiee.");
  return {
    email: String(payload.email).trim().toLowerCase(),
    name: String(payload.name || payload.email.split('@')[0]).trim(),
  };
}

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Authentification Google reelle requise." });
  }

  let googleUser;
  try {
    googleUser = await verifyGoogleCredential(String(credential));
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Identite Google invalide." });
  }
  const emailKey = googleUser.email;

  // If Admin logging in with Google
  if (emailKey === 'stevenamorin202@gmail.com') {
    addSecurityLog(`Connexion d'administration souveraine réussie par Google Auth (stevenamorin202@gmail.com)`, 'SECURED');
    return res.json({
      success: true,
      user: {
        id: 'admin',
        name: "StevenBmj Admin",
        email: "stevenamorin202@gmail.com",
        googleLinked: true,
        vipPoints: 99999,
        isAdmin: true
      }
    });
  }

  let user = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey);
  if (!user) {
    // Automatically create a user
    user = {
      id: `usr-${Date.now()}`,
      name: googleUser.name,
      email: googleUser.email,
      password: `google-linked-${randomBytes(18).toString('hex')}`,
      googleLinked: true,
      vipPoints: 200, // Double bonus points on google registration!
      isAdmin: false,
      isConfirmed: true, // Google users are pre-confirmed
      activationCode: '',
      activationExpiresAt: null,
      dateJoined: new Date().toISOString()
    };
    dbStore.users.unshift(user);
    addSecurityLog(`Création de compte instantanée Google : ${user.name} (${user.email})`, 'SECURED');
  } else {
    if (!user.googleLinked) {
      user.googleLinked = true;
    }
    user.isConfirmed = true; // Auto confirm if they log with google
    addSecurityLog(`Connexion client réussie via Google : ${user.name} (${user.email})`, 'SECURED');
  }
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const authUser = await ensureAuthUser(supabase, {
      email: user.email,
      password: user.password || `google-linked-${Date.now()}`,
      name: user.name,
      emailConfirm: true,
    });
    user.id = authUser.id;
    await upsertProfile(supabase, user);
  }
  saveDb();
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, googleLinked: user.googleLinked, vipPoints: user.vipPoints, isAdmin: user.isAdmin } });
});

// PASSWORD VERIFICATION BY EMAIL CODE - APPLICABLE TO BOTH CLIENT AND ADMIN
app.post('/api/auth/request-reset-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "L'adresse email est requise." });
  }
  const emailKey = email.trim().toLowerCase();
  
  // Generate random code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  if (emailKey === 'stevenamorin202@gmail.com') {
    // Admin request
    dbStore.settings.adminResetCode = resetCode;
    addSecurityLog(`Génération code sécurité mot de passe pour l'Admin (stevenamorin202@gmail.com)`, 'SECURED');
    saveDb();

    const subject = "Code de validation confidentiel d'administration";
    const bodyText = `
      <p style="font-size: 15px; color: #ff3333; font-weight: bold; margin-bottom: 20px;">ALARME SÉCURITÉ : MODIFICATION DU CODE D'ACCÈS PLATINIUM</p>
      <p>Cher Administrateur Steven Amorin,</p>
      <p>Une demande de modification du pass de commande souverain a été détectée sur nos salons de Cotonou.</p>
      <p>Veuillez introduire le code confidentiel d'autorisation ci-dessous pour confirmer l'empreinte :</p>
      <div style="background-color: #0b0b0b; border: 1px solid #ff3333; font-family: monospace; font-size: 26px; font-weight: bold; text-align: center; color: #ff3333; padding: 22px; margin: 25px 0; letter-spacing: 0.3em; border-radius: 4px;">
        ${resetCode}
      </div>
      <p>Si vous n'êtes pas à l'origine de cette demande, veuillez modifier immédiatement vos verrous.</p>
      <p style="margin-top: 35px;">Cellule Cyber-Défense Maison StevenBmj</p>
    `;
    sendCoutureEmail('stevenamorin202@gmail.com', subject, bodyText);
    return res.json({ success: true, message: "Un code de validation administrative a été dispatché sur stevenamorin202@gmail.com." });
  }

  // Client request
  const user = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey);
  if (!user) {
    return res.status(404).json({ error: "Aucun compte client n'existe sous cet identifiant." });
  }

  user.resetCode = resetCode;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await upsertProfile(supabase, user);
  }
  addSecurityLog(`Génération code sécurité mot de passe pour le client : ${user.name} (${emailKey})`, 'SECURED');
  saveDb();

  const clientSubject = "Code de modification de mot de passe exclusif SBMJ";
  const clientBody = `
    <p style="font-size: 15px; color: #cca43b; font-weight: bold; margin-bottom: 20px;">MODIFICATION DU MOT DE PASSE COMPTE PRIVÉ</p>
    <p>M. / Mme. <strong>${user.name}</strong>,</p>
    <p>Nous avons reçu une demande de changement de coordonnées pour votre espace membre d'exception.</p>
    <p>Veuillez utiliser votre code d'authentification temporaire à 6 chiffres ci-dessous :</p>
    <div style="background-color: #0b0b0b; border: 1px solid #cca43b; font-family: monospace; font-size: 26px; font-weight: bold; text-align: center; color: #cca43b; padding: 22px; margin: 25px 0; letter-spacing: 0.3em; border-radius: 4px;">
      ${resetCode}
    </div>
    <p>Ce jeton expire dans une quinzaine de minutes.</p>
    <p style="margin-top:35px;">Bien cordialement,</p>
    <p><strong>La Maison StevenBmj</strong></p>
  `;
  sendCoutureEmail(user.email, clientSubject, clientBody);
  res.json({ success: true, message: "Un code de modification a été transmis à votre adresse e-mail." });
});

// Admin change password endpoint
app.post('/api/auth/admin/change-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "L'adresse email, le code de sécurité SMTP et le nouveau mot de passe sont requis." });
  }

  const emailKey = email.trim().toLowerCase();
  
  if (emailKey !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Souveraineté refusée." });
  }

  if (!dbStore.settings.adminResetCode || dbStore.settings.adminResetCode !== code.trim()) {
    return res.status(403).json({ error: "Le code de sécurité administrateur est invalide ou a déjà été consommé." });
  }

  dbStore.settings.adminPassword = newPassword;
  dbStore.settings.adminResetCode = ''; // Consume code
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const authUser = await findAuthUserByEmail(supabase, ADMIN_EMAIL);
    if (authUser) {
      const { error } = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });
      if (error) return res.status(500).json({ error: error.message });
    }
  }
  addSecurityLog(`Modification souveraine du mot de passe d'administration par 'stevenamorin202@gmail.com' via code`, 'SECURED');
  saveDb();

  res.json({ success: true, message: "Mot de passe d'administration réinitialisé avec succès." });
});

// Client change password endpoint
app.post('/api/auth/client/change-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Tous les champs (email, code e-mail, nouveau mot de passe) sont requis." });
  }
  const emailKey = email.trim().toLowerCase();
  
  // Find user by email
  const user = dbStore.users.find((u: any) => u.email.toLowerCase() === emailKey);
  if (!user) {
    return res.status(404).json({ error: "Compte client introuvable." });
  }

  // Check code
  if (!user.resetCode || user.resetCode !== code.trim()) {
    return res.status(403).json({ error: "Le code de sécurité SMTP est incorrect ou a expiré." });
  }

  // Update password
  user.password = newPassword;
  user.resetCode = ''; // Consume code
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const authUser = await findAuthUserByEmail(supabase, user.email);
    if (authUser) {
      const { error } = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });
      if (error) return res.status(500).json({ error: error.message });
    }
    await upsertProfile(supabase, user);
  }
  addSecurityLog(`Mot de passe modifié par le client ${user.name} (${emailKey}) par code e-mail`, 'SECURED');
  saveDb();

  res.json({ success: true, message: "Votre mot de passe a été modifié avec succès." });
});

// Self-deletion for client account
app.post('/api/auth/client/delete-account', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "L'adresse email est requise." });
  }
  const emailKey = email.trim().toLowerCase();
  const initialCount = dbStore.users.length;
  
  dbStore.users = dbStore.users.filter((u: any) => u.email.toLowerCase() !== emailKey);
  
  if (dbStore.users.length < initialCount) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const authUser = await findAuthUserByEmail(supabase, emailKey);
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }
    }
    addSecurityLog(`Compte client supprimé définitivement par l'utilisateur : ${emailKey}`, 'SECURED');
    saveDb();
    res.json({ success: true, message: "Votre compte de prestige a été supprimé définitivement." });
  } else {
    res.status(404).json({ error: "Compte client introuvable." });
  }
});

app.get('/api/auth/users', (req, res) => {
  // Return user accounts for administration
  const usersWithNoPasswords = dbStore.users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    googleLinked: u.googleLinked,
    vipPoints: u.vipPoints,
    dateJoined: u.dateJoined
  }));
  res.json(usersWithNoPasswords);
});

// Delete specific user account
app.delete('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params;
  const initialCount = dbStore.users.length;
  dbStore.users = dbStore.users.filter((u: any) => u.id !== id);
  
  if (dbStore.users.length < initialCount) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase.auth.admin.deleteUser(id);
    }
    addSecurityLog(`Compte utilisateur révoqué : ID ${id}`, 'SECURED');
    saveDb();
    res.json({ success: true, message: "Le compte client a été supprimé avec succès." });
  } else {
    res.status(404).json({ error: "Compte introuvable." });
  }
});

// Wipe all user accounts
app.delete('/api/auth/users', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await Promise.all(dbStore.users.map(async (user: any) => {
      try {
        await supabase.auth.admin.deleteUser(user.id);
      } catch (error) {
        console.error("Failed to delete Supabase auth user", user.id, error);
      }
    }));
  }
  dbStore.users = [];
  addSecurityLog("Suppression totale et irréversible de tous les comptes clients par l'administrateur", 'SECURED');
  saveDb();
  res.json({ success: true, message: "Tous les comptes clients ont été supprimés avec succès." });
});

// 5.5. CUSTOMER REVIEWS API
app.get('/api/reviews', (req, res) => {
  const approved = dbStore.reviews.filter((r: any) => r.status === 'approved');
  res.json(approved);
});

app.get('/api/reviews/admin', (req, res) => {
  res.json(dbStore.reviews);
});

app.post('/api/reviews', rateLimitMiddleware, (req, res) => {
  const { customerName, rating, text } = req.body;
  if (!customerName || !rating || !text) {
    return res.status(400).json({ error: "Tous les champs de l'avis sont obligatoires." });
  }
  
  const newReview = {
    id: `rev-${Date.now()}`,
    customerName,
    rating: Number(rating),
    text,
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    date: new Date().toISOString()
  };
  
  dbStore.reviews.unshift(newReview);
  addSecurityLog(`Nouvel avis déposé par ${customerName} (Statut: EN ATTENTE DE CONTRÔLE)`, 'SECURED');
  saveDb();
  res.json({ success: true, review: newReview });
});

app.put('/api/reviews/:id/approve', (req, res) => {
  const { id } = req.params;
  const review = dbStore.reviews.find((r: any) => r.id === id);
  if (review) {
    review.status = 'approved';
    addSecurityLog(`Avis de ${review.customerName} approuvé et publié`, 'SECURED');
    saveDb();
    res.json({ success: true, reviews: dbStore.reviews });
  } else {
    res.status(404).json({ error: "Avis introuvable." });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const originalLen = dbStore.reviews.length;
  const review = dbStore.reviews.find((r: any) => r.id === id);
  dbStore.reviews = dbStore.reviews.filter((r: any) => r.id !== id);
  if (dbStore.reviews.length < originalLen) {
    await deleteSupabaseRows('reviews', 'id', id);
    addSecurityLog(`Avis de ${review?.customerName || id} rejeté/supprimé`, 'SECURED');
    saveDb();
    res.json({ success: true, reviews: dbStore.reviews });
  } else {
    res.status(404).json({ error: "Avis introuvable." });
  }
});

// 6. ANALYTICS / STATS
app.get('/api/analytics', (req, res) => {
  const { filter } = req.query; // 'week' | 'month' | 'year'
  
  // Weekly simulation
  const weekSales = [
    { name: "Lundi / Mon", ventes: 18000, benefices: 7500, pertes: 0, revenus: 18000, visiteurs: 450, clics: 1200, conversion: 3.8 },
    { name: "Mardi / Tue", ventes: 29500, benefices: 12100, pertes: 0, revenus: 29500, visiteurs: 520, clics: 1530, conversion: 4.2 },
    { name: "Mercredi / Wed", ventes: 12500, benefices: 5000, pertes: 200, revenus: 12300, visiteurs: 480, clics: 1100, conversion: 3.1 },
    { name: "Jeudi / Thu", ventes: 34000, benefices: 15200, pertes: 0, revenus: 34000, visiteurs: 610, clics: 1980, conversion: 4.9 },
    { name: "Vendredi / Fri", ventes: 45000, benefices: 21000, pertes: 0, revenus: 45000, visiteurs: 750, clics: 2500, conversion: 5.5 },
    { name: "Samedi / Sat", ventes: 58000, benefices: 25600, pertes: 150, revenus: 57850, visiteurs: 890, clics: 3100, conversion: 6.1 },
    { name: "Dimanche / Sun", ventes: 39000, benefices: 16900, pertes: 0, revenus: 39000, visiteurs: 700, clics: 2200, conversion: 5.0 }
  ];

  // Monthly simulation
  const monthSales = [
    { name: "Semaine 1", ventes: 110000, benefices: 48000, pertes: 1200, revenus: 108800, visiteurs: 3400, clics: 11200, conversion: 4.1 },
    { name: "Semaine 2", ventes: 145000, benefices: 65000, pertes: 500, revenus: 144500, visiteurs: 3900, clics: 12800, conversion: 4.6 },
    { name: "Semaine 3", ventes: 98000, benefices: 41000, pertes: 800, revenus: 97200, visiteurs: 3100, clics: 9500, conversion: 3.9 },
    { name: "Semaine 4", ventes: 185000, benefices: 83000, pertes: 0, revenus: 185000, visiteurs: 5200, clics: 17200, conversion: 5.2 }
  ];

  // Annual simulation
  const yearSales = [
    { name: "Jan", ventes: 450000, benefices: 200000, pertes: 3000, revenus: 447000, visiteurs: 12000, clics: 45000, conversion: 4.2 },
    { name: "Feb", ventes: 520000, benefices: 230000, pertes: 2500, revenus: 517500, visiteurs: 15000, clics: 51000, conversion: 4.5 },
    { name: "Mar", ventes: 410000, benefices: 180000, pertes: 4000, revenus: 406000, visiteurs: 11800, clics: 39000, conversion: 3.8 },
    { name: "Apr", ventes: 680000, benefices: 310000, pertes: 1000, revenus: 679000, visiteurs: 18500, clics: 62000, conversion: 5.1 },
    { name: "May", ventes: 890000, benefices: 405000, pertes: 1500, revenus: 888500, visiteurs: 22000, clics: 85000, conversion: 5.6 }
  ];

  if (filter === 'month') {
    return res.json(monthSales);
  } else if (filter === 'year') {
    return res.json(yearSales);
  }
  
  // Default to week
  res.json(weekSales);
});

// 7. GEMINI LUXURY CHATBOT API (COGNITIVE RECHERCHE ET RECOMMANDATIONS)
app.post('/api/gemini/chat', rateLimitMiddleware, async (req, res) => {
  // Support either { messages } or { message } format for robustness
  let userMsg = "";
  let userLang = "FR";
  
  let messagesList = req.body.messages;
  if (req.body.message) {
    userMsg = req.body.message;
    userLang = req.body.language || "FR";
    messagesList = [{ sender: 'user', text: userMsg }];
  } else if (messagesList && Array.isArray(messagesList) && messagesList.length > 0) {
    userMsg = messagesList[messagesList.length - 1]?.text || "";
    userLang = req.body.language || "FR";
  } else {
    return res.status(400).json({ error: "Session de discussion ou message invalide." });
  }

  // Find a recommended product ID programmatically to enrich client UX visual attachment
  let recommendedProductId: string | undefined;
  const lowerMsg = userMsg.toLowerCase();
  if (lowerMsg.includes("horloge") || lowerMsg.includes("montre") || lowerMsg.includes("watch") || lowerMsg.includes("royale") || lowerMsg.includes("tourbillon") || lowerMsg.includes("ceramic")) {
    recommendedProductId = lowerMsg.includes("tourbillon") ? "prod-11" : lowerMsg.includes("ceramic") ? "prod-2" : "prod-1";
  } else if (lowerMsg.includes("cubai") || lowerMsg.includes("chaine") || lowerMsg.includes("chain") || lowerMsg.includes("gourmette") || lowerMsg.includes("monarque") || lowerMsg.includes("émeraude") || lowerMsg.includes("bijou")) {
    recommendedProductId = lowerMsg.includes("émeraude") ? "prod-15" : lowerMsg.includes("royale") || lowerMsg.includes("24k") ? "prod-12" : "prod-3";
  } else if (lowerMsg.includes("costume") || lowerMsg.includes("veste") || lowerMsg.includes("suit") || lowerMsg.includes("smoking") || lowerMsg.includes("manteau") || lowerMsg.includes("cachemire") || lowerMsg.includes("vêtement")) {
    recommendedProductId = lowerMsg.includes("manteau") || lowerMsg.includes("cachemire") ? "prod-13" : lowerMsg.includes("velour") ? "prod-6" : "prod-5";
  } else if (lowerMsg.includes("mocassin") || lowerMsg.includes("soulier") || lowerMsg.includes("chaussure") || lowerMsg.includes("shoe") || lowerMsg.includes("derby") || lowerMsg.includes("crêpe") || lowerMsg.includes("crepe") || lowerMsg.includes("conduite")) {
    recommendedProductId = lowerMsg.includes("derby") ? "prod-8" : lowerMsg.includes("conduite") ? "prod-14" : "prod-7";
  } else if (lowerMsg.includes("bague") || lowerMsg.includes("ring") || lowerMsg.includes("ceinture") || lowerMsg.includes("lunette") || lowerMsg.includes("pilote") || lowerMsg.includes("solaris")) {
    recommendedProductId = lowerMsg.includes("ceinture") ? "prod-10" : lowerMsg.includes("lunette") || lowerMsg.includes("pilote") ? "prod-16" : "prod-9";
  }

  const rawApiKey = process.env.GEMINI_API_KEY;
  const apiKey = (rawApiKey && rawApiKey !== "MY_GEMINI_API_KEY" && rawApiKey.trim() !== "")
    ? rawApiKey
    : "";

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Elegant fallback mock answers with rich brand awareness
    let reply = "";
    if (userLang === "FR") {
      reply = "Salutations d'exception de la Maison StevenBmj. Comment puis-je parfaire votre vestiaire de prestige aujourd'hui ?";
      if (lowerMsg.includes("montre") || lowerMsg.includes("watch")) {
        reply = "Pour l'amateur de fine mécanique, notre joyau 'SBMJ Tourbillon Horizon' (148,000 €) ou la classique 'La Royale Chronographe Or' (29,900 €) représentent l'excellence absolue. Désirez-vous plus d'informations sur nos calibres de manufacture suisses ?";
      } else if (lowerMsg.includes("costume") || lowerMsg.includes("veste") || lowerMsg.includes("suit") || lowerMsg.includes("manteau") || lowerMsg.includes("vêtement")) {
        reply = "Nous proposons le somptueux 'Manteau Impérial en Cachemire' blanc neige (6,200 €) taillé artisanalement, ou notre incontournable costume 'Midnight Chelsea' (3,950 €). L'un de ces modèles sublimera instantanément votre charisme.";
      } else if (lowerMsg.includes("chaîne") || lowerMsg.includes("chain") || lowerMsg.includes("bijou") || lowerMsg.includes("émeraude")) {
        reply = "Sublimez votre tenue avec notre exclusive 'Chaîne Royale Diamond 24k' (38,000 €) ornée de 1800 brillants de clarté VVS1, ou le 'Pendentif Monarque Émeraude de Colombie' (15,400 €). Une brillance digne de votre aura.";
      } else if (lowerMsg.includes("mocassin") || lowerMsg.includes("soulier") || lowerMsg.includes("chaussure") || lowerMsg.includes("crepe") || lowerMsg.includes("crêpe")) {
        reply = "Nos célèbres 'Mocassins Crêpe Suédés' (1,450 €) en daim souple cousu Blake procurent un confort et une élégance sans égal. Nous disposons également de 'Derbys Obsidian Glacés' pour un apparat formel.";
      }
    } else {
      reply = "Salutations from the House of StevenBmj. How may I elevate your prestige menswear today?";
      if (lowerMsg.includes("watch") || lowerMsg.includes("montre")) {
        reply = "We highly advise the Swiss 'SBMJ Tourbillon Horizon' (148,000 €) or 'The Royale Gold Chronograph' (29,900 €). Both represent absolute mechanical supremacy.";
      } else if (lowerMsg.includes("suit") || lowerMsg.includes("overcoat") || lowerMsg.includes("coat") || lowerMsg.includes("clothing")) {
        reply = "You might appreciate our Italian 'Imperial Cashmere Overcoat' in pristine snow-white (6,200 €) or our sleek 'Midnight Chelsea Suit' (3,950 €).";
      }
    }
    
    if (!reply) {
      reply = userLang === "FR" 
        ? "Bienvenue dans les salons StevenBmj. Je me tiens à votre entière disposition pour vous guider à travers nos collections exclusives d'orfèvrerie masculine, nos montres de manufacture suisse et nos costumes de haute couture."
        : "Welcome to StevenBmj Private Lounge. I am here to assist your explorations of our premium Cuban links, Swiss chronographs, and Italian bespoke tailoring.";
    }

    return res.json({ 
      text: reply, 
      reply: reply, // Supports client's expected response structures
      recommendedProductId: recommendedProductId,
      isMock: true 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // We build the system instructions showing the brand character & current product catalogue
    const productsDesc = dbStore.products.map(p => 
      `- ${p.name} (ID: ${p.id}, Category: ${p.category}): ${p.price}€ (Promo: ${p.promoPrice || 'Aucune'}). Description: ${p.description}. Specs: ${p.specs.map(s => `${s.key}:${s.value}`).join(', ')}`
    ).join('\n');

    const systemInstruction = `
    Tu es "STEVEN", l'assistant d'IA luxe officiel de la maison "StevenBmj", une marque internationale d'E-Commerce ultra-PREMIUM, futuriste et exclusive pour hommes actifs sophistiqués.
    Ton ton est de la plus haute distinction : poli, courtois, haut de gamme, digne d'un conseiller privé chez Rolex, Prada, Tesla ou Gucci. Parle avec beaucoup de respect et de déférence.
    Voici notre catalogue actuel en stock :
    ${productsDesc}

    Règles de comportement :
    1. Sois très précis et respectueux. Réponds dans la langue employée par l'interlocuteur (Français ou Anglais).
    2. Guide l'utilisateur vers les produits du catalogue ci-dessus en fonction de ses envies. Max 1 ou 2 paragraphes très raffinés.
    3. S'il te demande des conseils de chaussures, recommande avec emphase nos "Mocassins Crêpe Suédés" ou nos rutilants "Derby Obsidian Glacé".
    4. S'il parle de montres, présente "La Royale Chronographe Or" ou la mythique "SBMJ Tourbillon Horizon".
    5. Fais des suggestions d'associations de luxe ("cross-selling" discret) si propice. 
    6. Sois d'une aide précieuse. Parle des détails de matières nobles (or 18k/24k, diamant de synthèse VVS1, émeraude de Colombie de 8 carats, cuir de veau pleine fleur, cachemire de Mongolie).
    7. Mentionne les devises sur demanne (sachant que EUR, USD et Franc CFA sont acceptés. 1 EUR vaut environ 655.957 FCFA).
    `;

    // Map conversation messages
    const formattedContents = messagesList.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Generate output content
    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = chatResponse.text || "La connexion avec notre serveur de conciergerie a été momentanément ralentie. Je reste à votre entière disposition.";
    res.json({ 
      text: replyText,
      reply: replyText, // Match LuxuryChatbot's expected `.reply` format
      recommendedProductId: recommendedProductId 
    });

  } catch (error: any) {
    console.error("Gemini chatbot error:", error);
    const fallbackReply = userLang === "FR"
      ? "Notre conciergerie IA est momentanément très sollicitée. Pour une montre d'exception, je vous recommande La Royale Chronographe Or ou le SBMJ Tourbillon Horizon, deux pièces souveraines du catalogue StevenBmj."
      : "Our AI concierge is momentarily under exceptional demand. For a prestige watch, I recommend The Royale Gold Chronograph or the SBMJ Tourbillon Horizon from the StevenBmj catalogue.";
    res.json({
      text: fallbackReply,
      reply: fallbackReply,
      recommendedProductId,
      isFallback: true
    });
  }
});


// --- VITE MIDDLEWARE SETUP & STATIC SERVER ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dev with Vite integration
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    // Serve HTML fallback
    app.get('*', (req, res, next) => {
      const templatePath = path.join(process.cwd(), 'index.html');
      fs.readFile(templatePath, 'utf-8', (err, html) => {
        if (err) return next(err);
        vite.transformIndexHtml(req.url, html)
          .then(transformedHtml => res.send(transformedHtml))
          .catch(err => next(err));
      });
    });
    
  } else {
    // Production serving compiled static bundles
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`STEVENBMJ Luxury Server running on http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
