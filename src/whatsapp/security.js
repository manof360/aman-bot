import crypto from 'node:crypto';
import { config } from '../config/env.js';

export function verifyMetaSignature(req) {
  if (!config.metaAppSecret) return false;
  const signature = req.get('x-hub-signature-256');
  if (!signature || !req.rawBody) return false;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', config.metaAppSecret)
    .update(req.rawBody)
    .digest('hex');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
