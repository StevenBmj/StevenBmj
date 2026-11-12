import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';

function backupKey(secret: string, project: string) {
  const master = Buffer.from(secret || '', 'base64');
  if (master.length !== 32) throw new Error('Backup encryption requires a 32-byte master key');
  return Buffer.from(hkdfSync('sha256', master, project, 'stevenbmj-business-backup-v1', 32));
}
export function sealBackup(content: string, secret: string, project: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', backupKey(secret, project), iv);
  cipher.setAAD(Buffer.from(project));
  const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
  return JSON.stringify({ version: 1, project, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), content: encrypted.toString('base64') });
}
export function openBackup(envelope: string, secret: string, project: string) {
  const data = JSON.parse(envelope);
  if (data.version !== 1 || data.project !== project) throw new Error('Backup project mismatch');
  const decipher = createDecipheriv('aes-256-gcm', backupKey(secret, project), Buffer.from(data.iv, 'base64'));
  decipher.setAAD(Buffer.from(project)); decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data.content, 'base64')), decipher.final()]).toString('utf8');
}
export const snapshotDigest = (rows: string[]) => createHash('sha256').update(JSON.stringify([...rows].sort())).digest('hex');
