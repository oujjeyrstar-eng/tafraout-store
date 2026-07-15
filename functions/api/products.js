import { requireAdminCsrf } from '../_lib/auth.js';
import { json, cleanText, cleanId, getKV, setKV } from '../_lib/utils.js';

const MAX_IMAGE_LEN = 4000000; // ~3 ميغا للصورة بصيغة base64

const DEFAULT_PRODUCTS = [
  { id: 'p1', categoryId: 'cat-lamps', price: 1450, image: '', featured: true,
    name: { ar: 'مصباح طاولة كريستال وكروم', fr: 'Lampe de table cristal & chrome', en: 'Crystal & Chrome Table Lamp' },
    desc: { ar: 'مصباح طاولة أنيق مصنوع من الكريستال المصقول وقاعدة كروم لامعة.', fr: 'Lampe de table élégante en cristal poli avec base chromée.', en: 'An elegant table lamp crafted from polished crystal with a chrome base.' } },
  { id: 'p2', categoryId: 'cat-mirrors', price: 980, image: '', featured: true,
    name: { ar: 'مرآة دائرية بإطار نحاسي', fr: 'Miroir rond cadre laiton', en: 'Round Mirror Brass Frame' },
    desc: { ar: 'مرآة دائرية بإطار نحاسي مصقول، تصميم عصري.', fr: 'Miroir rond à cadre en laiton poli, design moderne.', en: 'Round mirror with a polished brass frame, a modern design.' } },
  { id: 'p3', categoryId: 'cat-decor', price: 520, image: '', featured: true,
    name: { ar: 'مزهرية سيراميك مرسومة يدويا', fr: 'Vase en céramique peint à la main', en: 'Hand-painted Ceramic Vase' },
    desc: { ar: 'مزهرية من صناعة تقليدية، مرسومة يدويا.', fr: 'Vase artisanal peint à la main.', en: 'Handcrafted vase, hand-painted.' } },
  { id: 'p4', categoryId: 'cat-craft', price: 650, image: '', featured: false,
    name: { ar: 'صندوق خشبي منحوت', fr: 'Coffret en bois sculpté', en: 'Carved Wooden Box' },
    desc: { ar: 'صندوق تقليدي منحوت يدويا من خشب الأرز.', fr: 'Coffret traditionnel en bois de cèdre sculpté à la main.', en: 'Traditional box hand-carved from cedar wood.' } },
];

export async function onRequestGet({ env }) {
  const data = await getKV(env, 'products', DEFAULT_PRODUCTS);
  return json(data);
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdminCsrf(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await request.json().catch(() => ({}));
  const incoming = Array.isArray(body.products) ? body.products : null;
  if (!incoming) return json({ error: 'invalid_payload' }, 400);
  if (incoming.length > 2000) return json({ error: 'too_many_items' }, 400);

  const clean = [];
  for (const p of incoming) {
    const id = cleanId(p && p.id);
    if (!id) continue;

    let image = p && typeof p.image === 'string' ? p.image : '';
    if (image.length > MAX_IMAGE_LEN) return json({ error: 'image_too_large' }, 400);
    if (image && !/^data:image\/(png|jpe?g|webp|svg\+xml);base64,/i.test(image) && !/^https:\/\//i.test(image)) {
      image = '';
    }

    clean.push({
      id,
      categoryId: cleanId(p && p.categoryId),
      price: p && typeof p.price !== 'undefined' && !isNaN(parseFloat(p.price)) ? Math.round(parseFloat(p.price) * 100) / 100 : 0,
      image,
      featured: !!(p && p.featured),
      name: {
        ar: cleanText(p && p.name && p.name.ar, 150),
        fr: cleanText(p && p.name && p.name.fr, 150),
        en: cleanText(p && p.name && p.name.en, 150),
      },
      desc: {
        ar: cleanText(p && p.desc && p.desc.ar, 2000),
        fr: cleanText(p && p.desc && p.desc.fr, 2000),
        en: cleanText(p && p.desc && p.desc.en, 2000),
      },
    });
  }

  await setKV(env, 'products', clean);
  return json({ ok: true, products: clean });
}
