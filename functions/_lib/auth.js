// ============================================================
// أدوات التوكن الموقّع (بديل الـ session ديال PHP، بلا حاجة لقاعدة session
// لأن Workers ماعندهاش ذاكرة دائمة بين الطلبات) + قراءة الكوكيز.
// ============================================================

function bytesToB64url(bytes) {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// كيبني توكن موقّع (bحال JWT مبسّط): base64url(payload) + "." + base64url(HMAC)
export async function createToken(payload, secret, expSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + expSeconds };
  const dataB64 = bytesToB64url(new TextEncoder().encode(JSON.stringify(full)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataB64));
  const sigB64 = bytesToB64url(new Uint8Array(sig));
  return `${dataB64}.${sigB64}`;
}

// كيتحقق من التوكن: التوقيع + تاريخ الصلاحية. كيرجع الـ payload إلا كان صحيح، أو null.
export async function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [dataB64, sigB64] = token.split('.');
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(sigB64),
      new TextEncoder().encode(dataB64)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(dataB64)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return out;
}

export function buildSessionCookie(token, maxAgeSeconds) {
  return `admin_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}
export function clearSessionCookie() {
  return 'admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

// كيتحقق أن الطالب مسجل دخول كـ أدمين (وباختيار: أن CSRF token مطابق)
export async function requireAdminCsrf(request, env, { csrfRequired = true } = {}) {
  const cookies = parseCookies(request);
  const token = cookies['admin_session'];
  const payload = token ? await verifyToken(token, env.SESSION_SECRET) : null;
  if (!payload || !payload.admin) return { ok: false, status: 401, error: 'unauthorized' };
  if (csrfRequired) {
    const header = request.headers.get('X-CSRF-Token') || '';
    if (!header || header !== payload.csrf) return { ok: false, status: 403, error: 'invalid_csrf' };
  }
  return { ok: true, payload };
}
