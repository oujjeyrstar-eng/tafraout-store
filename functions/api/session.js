import { verifyToken, parseCookies } from '../_lib/auth.js';
import { json } from '../_lib/utils.js';

export async function onRequestGet({ request, env }) {
  const cookies = parseCookies(request);
  const token = cookies['admin_session'];
  const payload = token ? await verifyToken(token, env.SESSION_SECRET) : null;
  return json({ loggedIn: !!payload, csrfToken: payload ? payload.csrf : null });
}
