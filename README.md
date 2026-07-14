# تجهيزات تفراوت — نسخة GitHub + Cloudflare Pages (بلا فلوس، بلا كارت بنكي)

## علاش هادي وماشي InfinityFree/Vercel؟
- **InfinityFree**: عندها صفحة "فحص بوت" كتقدر تمنع الزوار (خصوصا فالتليفون) و**حتى Google** من الوصول للموقع أحيانا.
- **Vercel المجاني**: الشروط ديالو كتمنع صراحة الاستعمال **التجاري** (bحال متجر كيبيع منتوجات) على الخطة المجانية.
- **Cloudflare Pages + Workers (المجاني)**: مسموح بيه للاستعمال **التجاري**، بلا كارت بنكي، بلا صفحة فحص بوت، bandwidth بلا حدود، وGoogle كيقدر يفهرسو بلا مشاكل. هوما بنفسهم قالو هادشي بوضوح.

## البنية الجديدة
```
tafraout-store/
  index.html
  assets/style.css, app.js
  functions/
    api/
      login.js, logout.js, session.js
      categories.js, products.js, messages.js
    _lib/
      auth.js       ← توكن دخول موقّع (بديل session PHP)
      password.js    ← تشفير كلمة السر (PBKDF2)
      utils.js         ← أدوات مشتركة + قاعدة البيانات
  schema.sql          ← بنية قاعدة البيانات (D1)
  scripts/hash-password.mjs   ← سكريبت لتوليد hash ديال كلمة السر
  wrangler.toml        ← اختياري (local dev فقط)
  robots.txt, sitemap.xml
```

⚠️ **ماكاين حتى PHP هنا** — بدلناه بـ Cloudflare Workers (JavaScript كيخدم فالسيرفر)، والبيانات كتتخزن فـ **D1** (قاعدة بيانات SQL مجانية ديال Cloudflare)، ماشي ملفات JSON.

---

## الخطوات (خديها بالترتيب)

### 1) دير حساب GitHub (إلا ماعندكش)
- github.com > Sign up.

### 2) زيد الكود لـ GitHub
- دير repository جديد (مثلا `tafraout-store`).
- زيد الملفات ديال هاد المشروع كاملين (بالبنية اللي فوق) — بالـ drag & drop مباشرة من صفحة الـ repo فGitHub (Add file > Upload files)، أو بـ `git push` إلا كنتي عارف git.

### 3) دير حساب Cloudflare (مجاني، بلا كارت بنكي)
- dash.cloudflare.com > Sign up.

### 4) دير قاعدة البيانات D1
- من Dashboard: **Storage & Databases > D1 SQL Database > Create Database**.
- سميها مثلا `tafraout-store-db` > Create.
- دخل ليها، اضغط **"Console"** (أو "Explore Data")، نسخ محتوى `schema.sql` كامل، لصقو، وشغلو (Execute) — هادشي غادي يبني الجداول.

### 5) صل Cloudflare Pages بـ GitHub
- من Dashboard: **Workers & Pages > Create > Pages > Connect to Git**.
- اختار الـ repository اللي دزتي (`tafraout-store`).
- **Build settings**: خلي **Build command فارغة** و**Build output directory** = `/` (الجذر) — لأن الموقع HTML عادي بلا build.
- اضغط **Save and Deploy**.

### 6) ربط قاعدة البيانات بالمشروع
- بعد ما يخلص أول deploy: دخل للمشروع ديالك > **Settings > Bindings > Add > D1 database**.
- **Variable name**: اكتب بالضبط `DB` (بحال هو مكتوب فالكود).
- اختار `tafraout-store-db` اللي درتي.
- Save، ومنبعد **Redeploy** (من تبويب Deployments، اختار آخر deployment > Retry/Redeploy) باش الربط يخدم.

### 7) زيد كلمة السر والمفتاح السري (Environment Variables)
- عندك الكمبيوتر: خاصك **Node.js** مثبت (nodejs.org). افتح Terminal/CMD فمجلد المشروع وشغل:
  ```
  node scripts/hash-password.mjs "كلمة_السر_ديالك"
  ```
  غادي يعطيك سطر بحال `pbkdf2$100000$...$...` — نسخو.
- دابا فCloudflare: **Settings > Environment Variables > Add variable** (زيدها كـ **Secret** ماشي Text عادي):
  - الاسم: `ADMIN_PASSWORD_HASH` — القيمة: السطر اللي نسخيتي.
  - الاسم: `SESSION_SECRET` — القيمة: أي نص عشوائي طويل (32+ حرف). مثال تقدر تولدو بنفس الطريقة، أو استعمل هادا كمثال وبدلو بواحد ديالك:
    ```
    b49f64c6b983690379f8131f57cecfe32680d25b6d28123c5c79ba5326170fab
    ```
    (ماخديهش هادا بالضبط، ولد واحد آخر ديالك — تقدر تشغل `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` فالكمبيوتر ديالك).
- Save > Redeploy عاود (نفس الخطوة ديال البindings).

### 8) جرب الموقع
- الرابط غادي يكون بحال `https://tafraout-store.pages.dev` — زورو، خاص يخدم بلا صفحة فحص وبلا تأخير.
- زيد `#tafraout-admin` فآخر الرابط، دخل بكلمة السر، جرب زيد منتوج.

### 9) (اختياري) دومين خاص بيك
- إلا عندك دومين (مثلا `.ma` أو `.com`): **Settings > Custom Domains > Add** > تبع التعليمات (DNS records).

---

## خاصية: كل push جديد لـ GitHub = تحديث أوتوماتيكي للموقع
هادي أكبر فايدة ديال هاد الطريقة: أي تعديل تديرو للكود وتصيفطو لـ GitHub، Cloudflare كيبني وينشر الموقع من جديد وحدو، بلا ما تدخل تحمل ملفات بيدك.

## SEO (نفس النصائح ديال قبل، بزيادة وحدة)
- بدل الدومين فـ `robots.txt` و`sitemap.xml` و`index.html` (وين كاين `tajhizat-tafraout.ma`) بالدومين الحقيقي ديالك (أو رابط `.pages.dev` إلا مازال ماعندكش دومين).
- دابا Google Search Console غادي يقدر يفهرس الموقع بلا أي مشكل، لأن ماكاين "فحص بوت" كيحجب.

## حدود بقات (خاصك تعرفها، ماشي مشكلة كبيرة لموقع صغير)
- Cloudflare Workers المجاني: 100,000 طلب فاليوم — كافية بزاف لمتجر صغير/متوسط.
- D1 المجاني: 5 مليون قراءة و100 ألف كتابة فاليوم، 5 جيجا تخزين — بعيد جدا عن الوصول ليه بموقع صغير.
- الصور كتتخزن base64 جوا قاعدة البيانات (bحال كانت قبل)، عملي ولكن كيخلي الحجم يكبر شوية؛ إلا بغيتي تحسين لاحق، نقدرو نستعملو **Cloudflare R2** (تخزين ملفات مجاني هو الآخر) بدل ما الصور تكون base64.
