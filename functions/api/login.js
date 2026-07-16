import { verifyPassword } from '../_lib/password.js';
import { createToken, buildSessionCookie } from '../_lib/auth.js';
import { json, checkAndBumpThrottle, resetThrottle, getKV } from '../_lib/utils.js';

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  const throttle = await checkAndBumpThrottle(env, 'login', ip, { max: 5, windowSeconds: 900 });
  if (throttle.blocked) return json({ ok: false, error: 'too_many_attempts' }, 429);

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === 'string' ? body.password : '';

  // كلمة السر: أولا كنشوفو واش تبدلات من الداشبورد (kv_store)، وإلا لا كنرجعو لـ Environment Variable
  const storedHash = (await getKV(env, 'admin_password_hash', null)) || env.ADMIN_PASSWORD_HASH;
  const valid = password !== '' && (await verifyPassword(password, storedHash));
  if (!valid) {
    return json({ ok: false, error: 'wrong_password' }, 401);
  }

  await resetThrottle(env, 'login', ip);

  const csrf = crypto.randomUUID();
  const token = await createToken({ admin: true, csrf }, env.SESSION_SECRET, 60 * 60 * 24 * 7);

  return json(
    { ok: true, csrfToken: csrf },
    200,
    { 'Set-Cookie': buildSessionCookie(token, 60 * 60 * 24 * 7) }
  );
}
