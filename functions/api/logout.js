import { requireAdminCsrf, clearSessionCookie } from '../_lib/auth.js';
import { json } from '../_lib/utils.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireAdminCsrf(request, env, { csrfRequired: false });
  // حتى لو الجلسة سالات، نصفيو الكوكي فكل الحالات
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
