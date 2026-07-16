import { requireAdminCsrf } from '../_lib/auth.js';
import { json } from '../_lib/utils.js';

const MAX_BYTES = 4 * 1024 * 1024; // 4MB كافين بزاف لصورة مضغوطة

function base64ToBytes(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdminCsrf(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  if (!env.IMAGES) {
    return json({ error: 'r2_not_configured' }, 500);
  }

  const body = await request.json().catch(() => ({}));
  const dataUrl = typeof body.image === 'string' ? body.image : '';
  const match = dataUrl.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
  if (!match) return json({ error: 'invalid_image' }, 400);

  const ext = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
  const bytes = base64ToBytes(match[2]);
  if (bytes.length > MAX_BYTES) return json({ error: 'image_too_large' }, 400);

  const key = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: `image/${ext}` } });

  const base = (env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
  const url = base ? `${base}/${key}` : `/r2/${key}`;

  return json({ ok: true, url });
}
