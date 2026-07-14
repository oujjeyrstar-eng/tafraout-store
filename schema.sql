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
