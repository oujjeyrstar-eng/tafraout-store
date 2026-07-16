import { requireAdminCsrf } from '../_lib/auth.js';
import { json, cleanText, checkAndBumpThrottle } from '../_lib/utils.js';

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// GET: الأدمين كيشوف جميع الطلبات
export async function onRequestGet({ request, env }) {
  const auth = await requireAdminCsrf(request, env, { csrfRequired: false });
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const { results } = await env.DB.prepare(
    'SELECT id, customer_name, customer_phone, customer_address, items, total, status, note, date FROM orders ORDER BY date DESC LIMIT 500'
  ).all();

  const orders = (results || []).map((r) => ({
    ...r,
    items: (() => { try { return JSON.parse(r.items); } catch (e) { return []; } })(),
  }));
  return json(orders);
}

// POST: أي زائر كيقدر يدير طلب (السلة)
export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const throttle = await checkAndBumpThrottle(env, 'order', ip, { max: 8, windowSeconds: 900 });
  if (throttle.blocked) return json({ ok: false, error: 'too_many_orders' }, 429);

  const body = await request.json().catch(() => ({}));
  if (body.website) return json({ ok: true }); // honeypot

  const name = cleanText(body.name, 100);
  const phone = cleanText(body.phone, 30);
  const address = cleanText(body.address, 300);
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];

  if (!name || !phone || !items.length) return json({ ok: false, error: 'missing_fields' }, 400);

  const cleanItems = [];
  let total = 0;
  for (const it of items) {
    const id = cleanText(it && it.id, 64);
    const pname = cleanText(it && it.name, 150);
    const price = it && !isNaN(parseFloat(it.price)) ? Math.max(0, parseFloat(it.price)) : 0;
    const qty = it && !isNaN(parseInt(it.qty, 10)) ? Math.min(99, Math.max(1, parseInt(it.qty, 10))) : 1;
    if (!id) continue;
    cleanItems.push({ id, name: pname, price, qty });
    total += price * qty;
  }
  if (!cleanItems.length) return json({ ok: false, error: 'empty_cart' }, 400);

  const id = 'o' + Date.now() + crypto.randomUUID().slice(0, 8);
  const date = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO orders (id, customer_name, customer_phone, customer_address, items, total, status, note, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, phone, address, JSON.stringify(cleanItems), Math.round(total * 100) / 100, 'pending', '', date).run();

  return json({ ok: true, id });
}

// PATCH: الأدمين كيبدل حالة الطلب (تتبع الطلبات)
export async function onRequestPatch({ request, env }) {
  const auth = await requireAdminCsrf(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await request.json().catch(() => ({}));
  const id = cleanText(body.id, 80);
  const status = cleanText(body.status, 20);
  if (!id || !VALID_STATUSES.includes(status)) return json({ error: 'invalid_payload' }, 400);

  await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run();
  return json({ ok: true });
}
