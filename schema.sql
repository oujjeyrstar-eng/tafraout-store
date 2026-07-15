-- خدمها مرة وحدة فبداية المشروع (شرح الطريقة كاين فREADME.md)

CREATE TABLE IF NOT EXISTS kv_store (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS throttle (
  bucket TEXT NOT NULL,
  ip TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  first_ts INTEGER NOT NULL,
  PRIMARY KEY (bucket, ip)
);

-- الطلبات (سلة الشراء) + تتبع الحالة
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  items TEXT NOT NULL,      -- JSON: [{id,name,price,qty}]
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | shipped | delivered | cancelled
  note TEXT,
  date TEXT NOT NULL
);

-- ملاحظة: كلمة سر الأدمين ممكن تتخزن دابا فـ kv_store (مفتاح admin_password_hash)
-- باش تتبدل من الداشبورد بلا Node.js، بدل ما تبقى غير كـ Environment Variable.
-- إلا ماكانتش موجودة فـ kv_store، السيرفر كيرجع تلقائيا لـ ADMIN_PASSWORD_HASH (env).
