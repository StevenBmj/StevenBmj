import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { adminClient } from '../src/server/security';
import { handleVipMessage } from '../src/server/vipMessages';

dotenv.config({ path: '.env.local', quiet: true });
if (process.env.SUPABASE_PROJECT_REF !== 'elpfuvzfyogogavbmahq' || process.env.MAIL_USER !== 'stevenbmj202@gmail.com') throw new Error('Owner mail test target mismatch');
const client = adminClient();
const profile = await client.from('profiles').select('id').eq('is_admin', true).eq('is_confirmed', true).limit(1).single();
if (profile.error || !profile.data) throw new Error('No verified administrator available for the internal delivery test');
const filename = '.codex-private/owner-outreach-test.json';
const requestId = existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8')).requestId : randomUUID();
writeFileSync(filename, JSON.stringify({ requestId, startedAt: new Date().toISOString() }), { mode: 0o600 });
let status = 200; let result: any;
const req = { method: 'POST', headers: { host: 'localhost:3000' }, socket: { remoteAddress: '127.0.0.1' }, actor: { profile: profile.data }, body: {
  requestId, customerName: 'StevenBmj', email: 'stevenbmj202@gmail.com', confirmed: true, consent: true, language: 'FR',
  message: 'Vérification autorisée du système de messages clients StevenBmj : ce message a été envoyé automatiquement par le serveur après confirmation. Aucun message WhatsApp ni achat réel n’a été effectué.',
} };
const res = { setHeader() { return this; }, status(value: number) { status = value; return this; }, end(body: string) { result = JSON.parse(body); } };
await handleVipMessage(req, res, client);
if (status !== 200 || result?.emailStatus !== 'accepted' || result.whatsappStatus !== 'not_requested') throw new Error('Owner outreach SMTP delivery was not accepted');
writeFileSync(filename, JSON.stringify({ requestId, completedAt: new Date().toISOString(), emailStatus: result.emailStatus, inboxReceipt: 'awaiting-owner-confirmation', testType: 'internal-outreach-handler-real-smtp' }), { mode: 0o600 });
console.log(JSON.stringify({ result: 'SMTP-accepted-for-owner', duplicateProtected: true, whatsappSent: false, testType: 'internal-handler-not-interactive-login' }));
