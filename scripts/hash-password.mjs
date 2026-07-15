// خدم هاد السكريبت مرة وحدة باش تولد الـ hash ديال كلمة السر.
// شغلو بـ: node scripts/hash-password.mjs "كلمة_السر_ديالك"
// (خاصك Node.js 18 أو أكثر مثبت فالكمبيوتر ديالك)

import { webcrypto as crypto } from 'node:crypto';

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, iterations = 100000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${iterations}$${hex(salt)}$${hex(bits)}`;
}

const password = process.argv[2];
if (!password) {
  console.log('الاستعمال: node scripts/hash-password.mjs "كلمة_السر_ديالك"');
  process.exit(1);
}
hashPassword(password).then((hash) => {
  console.log('\nحطها فـ Cloudflare Pages > Settings > Environment Variables كـ ADMIN_PASSWORD_HASH:\n');
  console.log(hash);
  console.log('');
});
