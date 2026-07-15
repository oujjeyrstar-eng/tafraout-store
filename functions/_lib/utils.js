export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export function cleanText(value, maxLen = 2000) {
  if (typeof value !== 'string') return '';
  let v = value.replace(/\0/g, '').trim();
  if (v.length > maxLen) v = v.slice(0, maxLen);
  return v;
}

export function cleanId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

// kv_store: جدول بسيط ديال (مفتاح -> نص JSON)، كنستعملوه لتخزين لائحة الأصناف/المنتوجات كاملة
export async function getKV(env, key, fallback) {
  const row = await env.DB.prepare('SELECT v FROM kv_store WHERE k = ?').bind(key).first();
  if (!row) return fallback;
  try {
    return JSON.parse(row.v);
  } catch (e) {
    return fallback;
  }
}
export async function setKV(env, key, value) {
  await env.DB.prepare(
    'INSERT INTO kv_store (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v'
  ).bind(key, JSON.stringify(value)).run();
}

// حماية بسيطة من التكرار الزايد (brute-force على الدخول / سبام على formulaire التواصل)
export async function checkAndBumpThrottle(env, bucket, ip, { max, windowSeconds }) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare('SELECT count, first_ts FROM throttle WHERE bucket = ? AND ip = ?')
    .bind(bucket, ip).first();
  if (row && now - row.first_ts < windowSeconds) {
    if (row.count >= max) return { blocked: true };
    await env.DB.prepare('UPDATE throttle SET count = count + 1 WHERE bucket = ? AND ip = ?').bind(bucket, ip).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO throttle (bucket, ip, count, first_ts) VALUES (?, ?, 1, ?) ON CONFLICT(bucket, ip) DO UPDATE SET count = 1, first_ts = excluded.first_ts'
    ).bind(bucket, ip, now).run();
  }
  return { blocked: false };
}
export async function resetThrottle(env, bucket, ip) {
  await env.DB.prepare('DELETE FROM throttle WHERE bucket = ? AND ip = ?').bind(bucket, ip).run();
}
