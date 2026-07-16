import { requireAdminCsrf } from '../_lib/auth.js';
import { verifyPassword, hashPassword } from '../_lib/password.js';
import { json, getKV, setKV, checkAndBumpThrottle } from '../_lib/utils.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireAdminCsrf(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const throttle = await checkAndBumpThrottle(env, 'changepass', ip, { max: 5, windowSeconds: 900 });
  if (throttle.blocked) return json({ ok: false, error: 'too_many_attempts' }, 429);

  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (newPassword.length < 8) {
    return json({ ok: false, error: 'password_too_short' }, 400);
  }

  const storedHash = (await getKV(env, 'admin_password_hash', null)) || env.ADMIN_PASSWORD_HASH;
  const valid = currentPassword !== '' && (await verifyPassword(currentPassword, storedHash));
  if (!valid) return json({ ok: false, error: 'wrong_password' }, 401);

  const newHash = await hashPassword(newPassword);
  await setKV(env, 'admin_password_hash', newHash);

  return json({ ok: true });
}
