import { createHash } from 'node:crypto';

export const CATALOGUE_BUCKET = 'stevenbmj-catalogue';
export function rasterData(value: string) {
  const match = /^data:image\/(png|jpeg|webp);base64,([a-z0-9+/=]+)$/i.exec(value);
  if (!match) throw new Error('Invalid product image');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 3_000_000 || bytes.toString('base64') !== match[2]) throw new Error('Invalid product image size');
  const format = match[1].toLowerCase();
  const valid = format === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : format === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!valid) throw new Error('Invalid product image format');
  return { bytes, contentType: `image/${format}`, hash: createHash('sha256').update(bytes).digest('hex'), extension: format === 'jpeg' ? 'jpg' : format };
}

export async function storeCatalogueImage(client: any, value: string) {
  if (!value.startsWith('data:')) return value;
  const image = rasterData(value);
  const storage = client.storage.from(CATALOGUE_BUCKET);
  const key = `${image.hash}.${image.extension}`;
  const uploaded = await storage.upload(key, image.bytes, { contentType: image.contentType, cacheControl: '31536000', upsert: false });
  if (uploaded.error) {
    // A content-addressed duplicate is safe only after verifying the existing bytes.
    const existing = await storage.download(key);
    if (existing.error || createHash('sha256').update(Buffer.from(await existing.data.arrayBuffer())).digest('hex') !== image.hash) throw new Error('Product image could not be stored');
  }
  return storage.getPublicUrl(key).data.publicUrl;
}
