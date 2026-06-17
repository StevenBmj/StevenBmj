import { createClient } from '@supabase/supabase-js';

type ChatMessage = {
  sender?: 'user' | 'bot';
  text?: string;
};

type Product = {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  description?: string;
  descriptionEn?: string;
  price: number;
  promoPrice?: number;
  stock: number;
  specs?: { key: string; value: string }[];
};

function json(res: any, status: number, body: any) {
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function supabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
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

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en || '',
    category: row.category,
    description: row.description || '',
    descriptionEn: row.description_en || '',
    price: Number(row.price || 0),
    promoPrice: row.promo_price == null ? undefined : Number(row.promo_price),
    stock: Number(row.stock || 0),
    specs: row.specs || [],
  };
}

function isSensitiveRequest(message: string) {
  const text = message.toLowerCase();
  return [
    'mot de passe',
    'password',
    'clé api',
    'cle api',
    'clé',
    'cle',
    'api key',
    'api supabase',
    'secret',
    'service_role',
    'service role',
    'supabase_service',
    'supabase service',
    'supabase key',
    'supabase token',
    'token',
    'github token',
    'vercel token',
    'mail_app_password',
    'env.local',
    '.env',
    'base de donnée',
    'database password',
    'admin reset',
    'code admin',
    'liste des clients',
    'données clients',
    'customer data',
    'commande des autres',
  ].some((pattern) => text.includes(pattern));
}

function pickRecommendedProduct(message: string, products: Product[]) {
  const text = message.toLowerCase();
  const byId = (id: string) => products.find((product) => product.id === id);
  const byCategory = (category: string) => products.find((product) => product.category === category && product.stock > 0) || products.find((product) => product.category === category);

  if (text.includes('tourbillon')) return byId('prod-11') || byCategory('watches');
  if (text.includes('montre') || text.includes('watch') || text.includes('chronographe')) return byId('prod-1') || byCategory('watches');
  if (text.includes('chaîne') || text.includes('chaine') || text.includes('chain') || text.includes('bijou') || text.includes('or')) return byId('prod-3') || byCategory('chains');
  if (text.includes('costume') || text.includes('suit') || text.includes('veste') || text.includes('manteau')) return byCategory('suits');
  if (text.includes('mocassin') || text.includes('chaussure') || text.includes('shoe') || text.includes('derby')) return byId('prod-7') || byCategory('shoes');
  if (text.includes('parfum') || text.includes('fragrance')) return byCategory('perfumes');
  if (text.includes('robe') || text.includes('femme')) return byCategory('women');
  return products.find((product) => product.stock > 0) || products[0];
}

function productLine(product?: Product, language: string = 'FR') {
  if (!product) return '';
  const name = language === 'EN' ? (product.nameEn || product.name) : product.name;
  const price = product.promoPrice || product.price;
  const stockText = product.stock > 0
    ? (language === 'EN' ? `available stock: ${product.stock}` : `stock disponible : ${product.stock}`)
    : (language === 'EN' ? 'limited availability' : 'disponibilité limitée');
  return `${name} (${price.toLocaleString('fr-FR')} EUR, ${stockText})`;
}

function localConciergeReply(message: string, language: string, products: Product[]) {
  const recommended = pickRecommendedProduct(message, products);
  if (isSensitiveRequest(message)) {
    const reply = language === 'EN'
      ? "I cannot disclose private credentials, tokens, admin codes, database details, or customer data. I can, however, help you choose StevenBmj pieces, explain services, guide orders, or direct account recovery through the official email-code flow."
      : "Je ne peux pas divulguer de mots de passe, clés, tokens, codes administrateur, détails de base de données ou données clients. Je peux en revanche vous guider sur les créations StevenBmj, les commandes, les services et la récupération officielle par code e-mail.";
    return { reply, recommendedProductId: undefined };
  }

  const featured = productLine(recommended, language);
  const reply = language === 'EN'
    ? `With pleasure. For the StevenBmj universe, I would first guide you toward ${featured}. It fits the Maison's prestige signature: refined materials, strong presence, and a ceremonial finish. Tell me if you prefer watches, jewelry, tailoring, shoes, or fragrance and I will narrow the selection with elegance.`
    : `Avec plaisir. Dans l'univers StevenBmj, je vous orienterais d'abord vers ${featured}. Cette pièce correspond bien à la signature de la Maison : présence affirmée, matières nobles et finition de prestige. Dites-moi si vous cherchez plutôt une montre, une chaîne, un costume, des souliers ou un parfum, et je vous affine la sélection avec précision.`;
  return { reply, recommendedProductId: recommended?.id };
}

function buildSystemInstruction(products: Product[], language: string) {
  const catalogue = products
    .slice(0, 30)
    .map((product) => {
      const name = language === 'EN' ? (product.nameEn || product.name) : product.name;
      const description = language === 'EN' ? (product.descriptionEn || product.description || '') : (product.description || '');
      return `- ${name} | ID ${product.id} | ${product.category} | ${product.promoPrice || product.price} EUR | stock ${product.stock} | ${description.slice(0, 240)}`;
    })
    .join('\n');

  return `
You are STEVEN, the official StevenBmj luxury concierge.
Answer in ${language === 'EN' ? 'English' : 'French'} unless the user clearly asks otherwise.
Your job: help visitors choose StevenBmj watches, jewelry, suits, shoes, accessories, women pieces, perfumes, delivery guidance, account flow, and official contact options.
Tone: premium, concise, respectful, helpful, like a private boutique advisor. Avoid exaggerated claims and avoid pretending to process payments.
Never reveal or guess sensitive information: passwords, API keys, tokens, admin reset codes, database credentials, environment variables, internal logs, private customer data, hidden admin routes, or security implementation details.
If asked for sensitive info, politely refuse and redirect to official account recovery or boutique assistance.
Do not invent products. Base recommendations on this current public catalogue:
${catalogue}
Keep replies to 1 or 2 short refined paragraphs. If relevant, recommend exactly one product ID naturally.
`;
}

async function generateWithGemini(message: string, language: string, messages: ChatMessage[], products: Product[]) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') return null;
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = (messages.length ? messages : [{ sender: 'user', text: message }]).map((entry) => ({
    role: entry.sender === 'bot' ? 'model' : 'user',
    parts: [{ text: entry.text || '' }],
  }));

  const models = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ].filter(Boolean) as string[];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: buildSystemInstruction(products, language),
          temperature: 0.55,
        },
      });
      const text = response.text?.trim();
      if (text) return text;
    } catch (error) {
      console.error(`Gemini model failed: ${model}`, error);
    }
  }
  return null;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const message = String(body.message || body.messages?.[body.messages.length - 1]?.text || '').trim();
    const language = body.language === 'EN' ? 'EN' : 'FR';
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!message) return json(res, 400, { error: 'Message invalide.' });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    const products = (data || []).map(rowToProduct);
    const local = localConciergeReply(message, language, products);

    if (isSensitiveRequest(message)) {
      return json(res, 200, {
        text: local.reply,
        reply: local.reply,
        recommendedProductId: local.recommendedProductId,
        refusedSensitiveRequest: true,
      });
    }

    const aiReply = await generateWithGemini(message, language, messages, products);
    const reply = aiReply || local.reply;
    const recommended = pickRecommendedProduct(`${message}\n${reply}`, products);
    return json(res, 200, {
      text: reply,
      reply,
      recommendedProductId: recommended?.id || local.recommendedProductId,
      isFallback: !aiReply,
    });
  } catch (error: any) {
    console.error('StevenBmj chatbot route error:', error);
    const reply = "Je reste votre concierge StevenBmj. Une brève indisponibilité technique m'empêche d'interroger l'IA, mais je peux vous orienter vers nos montres, chaînes, costumes, souliers et parfums de prestige.";
    return json(res, 200, { text: reply, reply, isFallback: true });
  }
}
