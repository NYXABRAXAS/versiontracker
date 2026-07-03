import * as crypto from 'crypto';

const KEY = crypto.scryptSync(process.env.COOKIE_SECRET || 'dev-cookie-secret', 'los-portal-salt', 32);

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, dataHex] = payload.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
