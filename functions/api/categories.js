import { requireAdminCsrf } from '../_lib/auth.js';
import { json, cleanText, cleanId, getKV, setKV } from '../_lib/utils.js';

const DEFAULT_CATEGORIES = [
  { id: 'cat-lamps', color: '#C1694F', icon: '✦', name: { ar: 'تريات وإنارة', fr: 'Luminaires', en: 'Lighting' } },
  { id: 'cat-decor', color: '#33506F', icon: '◈', name: { ar: 'ديكور المنزل', fr: 'Décoration', en: 'Home Decor' } },
  { id: 'cat-mirrors', color: '#B78A4A', icon: '✺', name: { ar: 'مرايا فاخرة', fr: 'Miroirs', en: 'Mirrors' } },
  { id: 'cat-craft', color: '#6B7A5E', icon: '⬢', name: { ar: 'صناعة تقليدية', fr: 'Artisanat', en: 'Craftsmanship' } },
];

export async function onRequestGet({ env }) {
  const data = await getKV(env, 'categories', DEFAULT_CATEGORIES);
  return json(data);
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdminCsrf(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await request.json().catch(() => ({}));
  const incoming = Array.isArray(body.categories) ? body.categories : null;
  if (!incoming) return json({ error: 'invalid_payload' }, 400);
  if (incoming.length > 200) return json({ error: 'too_many_items' }, 400);

  const clean = incoming
    .map((c) => ({
      id: cleanId(c && c.id),
      color: c && /^#[0-9a-fA-F]{3,8}$/.test(c.color || '') ? c.color : '#C1694F',
      icon: cleanText((c && c.icon) || '✦', 8),
      name: {
        ar: cleanText(c && c.name && c.name.ar, 120),
        fr: cleanText(c && c.name && c.name.fr, 120),
        en: cleanText(c && c.name && c.name.en, 120),
      },
    }))
    .filter((c) => c.id);

  await setKV(env, 'categories', clean);
  return json({ ok: true, categories: clean });
}
