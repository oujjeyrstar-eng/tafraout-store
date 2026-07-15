import { requireAdminCsrf } from '../_lib/auth.js';
import { json, cleanText, checkAndBumpThrottle } from '../_lib/utils.js';

export async function onRequestGet({ request, env }) {
  const auth = await requireAdminCsrf(request, env, { csrfRequired: false });
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const { results } = await env.DB.prepare(
    'SELECT id, name, phone, message, date FROM messages ORDER BY date DESC LIMIT 1000'
  ).all();
  return json(results || []);
}

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const throttle = await checkAndBumpThrottle(env, 'msg', ip, { max: 5, windowSeconds: 600 });
  if (throttle.blocked) return json({ ok: false, error: 'too_many_messages' }, 429);

  const body = await request.json().catch(() => ({}));

  // حقل "مصيدة" (honeypot) خفي فالفورمولير: أي بوت كيعمر الحقول الكل غادي يعمر هادشي
  if (body.website) return json({ ok: true });

  const name = cleanText(body.name, 100);
  const phone = cleanText(body.phone, 30);
  const message = cleanText(body.message, 1500);
  if (!name || !phone || !message) return json({ ok: false, error: 'missing_fields' }, 400);

  const id = 'm' + Date.now() + crypto.randomUUID().slice(0, 8);
  await env.DB.prepare('INSERT INTO messages (id, name, phone, message, date) VALUES (?, ?, ?, ?, ?)')
    .bind(id, name, phone, message, new Date().toISOString())
    .run();

  return json({ ok: true });
}
