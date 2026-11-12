import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export type AssistantScope = 'client' | 'admin';

export function vaultReady() {
  try { masterKey(); return true; } catch { return false; }
}

function masterKey() {
  const value = process.env.AI_ENCRYPTION_KEY || '';
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32 || key.toString('base64') !== value) throw new Error('AI vault is not configured');
  return key;
}

export function encryptKey(secret: string, id: string, scope: AssistantScope) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey(), iv);
  cipher.setAAD(Buffer.from(`stevenbmj:openrouter:${scope}:${id}`));
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptKey(value: string, id: string, scope: AssistantScope) {
  const [version, iv, tag, encrypted, extra] = value.split('.');
  if (version !== 'v1' || extra || !iv || !tag || !encrypted) throw new Error('Invalid vault record');
  const decipher = createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(iv, 'base64url'));
  decipher.setAAD(Buffer.from(`stevenbmj:openrouter:${scope}:${id}`));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

export function keyFingerprint(secret: string) {
  return createHmac('sha256', masterKey()).update(`key:${secret}`).digest('hex');
}

export function keyView(row: any) {
  return { id: row.id, scope: row.scope, label: row.label, suffix: row.suffix,
    model: row.model, speechModel: row.speech_model || '', speechVoice: row.speech_voice || '',
    enabled: row.enabled, createdAt: row.created_at, lastUsedAt: row.last_used_at || null };
}

export function validModel(value: unknown) {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{1,159}$/.test(value);
}

export function speechToken(text: string, scope: AssistantScope, language: string) {
  const payload = Buffer.from(JSON.stringify({ text, scope, language, exp: Date.now() + 300000 })).toString('base64url');
  const signature = createHmac('sha256', masterKey()).update(`speech:${payload}`).digest('base64url');
  return `${payload}.${signature}`;
}

export function readSpeechToken(token: unknown) {
  try {
    if (typeof token !== 'string' || token.length > 16000) return null;
    const [payload, signature, extra] = token.split('.');
    if (extra || !payload || !signature) return null;
    const expected = createHmac('sha256', masterKey()).update(`speech:${payload}`).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!['client', 'admin'].includes(data.scope) || !Number.isFinite(data.exp) || data.exp < Date.now()
      || typeof data.text !== 'string' || data.text.length > 4000) return null;
    return data as { text: string; scope: AssistantScope; language: string; exp: number };
  } catch { return null; }
}

async function boundedBytes(response: Response, maximum: number) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty provider response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) throw new Error('Provider response too large');
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally { await reader.cancel().catch(() => {}); }
}

export async function providerRequest(secret: string, path: 'chat/completions' | 'audio/speech' | 'key', body?: any) {
  const response = await fetch(`https://openrouter.ai/api/v1/${path}`, {
    method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(18000),
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', 'X-Title': 'StevenBmj' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error('Provider unavailable'); }
  const bytes = await boundedBytes(response, path === 'audio/speech' ? 4_000_000 : 100_000);
  if (path === 'audio/speech') {
    if (!response.headers.get('content-type')?.startsWith('audio/')) throw new Error('Invalid audio response');
    return bytes;
  }
  return JSON.parse(bytes.toString('utf8'));
}

// Separate requests are distributed across enabled keys; each prompt goes to at most two.
export async function withCredential(client: any, scope: AssistantScope, speech: boolean, task: (row: any, secret: string) => Promise<any>) {
  const result = await client.from('ai_credentials').select('*').eq('scope', scope).eq('enabled', true).limit(100);
  if (result.error) throw new Error('AI vault unavailable');
  const rows = (result.data || []).filter((row: any) => !speech || row.speech_model);
  if (!rows.length) throw new Error('No enabled AI credential');
  const start = randomInt(rows.length);
  for (let i = 0; i < Math.min(2, rows.length); i++) {
    const row = rows[(start + i) % rows.length];
    try {
      const output = await task(row, decryptKey(row.encrypted_key, row.id, scope));
      await client.from('ai_credentials').update({ last_used_at: new Date().toISOString() }).eq('id', row.id);
      return output;
    } catch { /* Try one independent configured credential, never expose provider errors. */ }
  }
  throw new Error('AI provider unavailable');
}

export function safeText(value: unknown, maximum: number) {
  return typeof value === 'string' ? value.slice(0, maximum).replace(/(?:sk-or-v1-|ghp_|sbp_|AIza)[a-zA-Z0-9_-]{10,}/g, '[redacted]') : '';
}
