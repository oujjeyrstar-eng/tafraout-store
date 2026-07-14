export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. مسارات الـ API (مثال لـ API تسجيل الدخول)
    if (url.pathname.startsWith('/api/')) {
      // هنا كيمشي الكود ديال الـ APIs ديالك
      if (url.pathname === '/api/login') {
        return new Response(JSON.stringify({ message: "Login API working" }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response("Not Found", { status: 404 });
    }

    // 2. قراءة الملفات الثابتة من مجلد public تلقائياً
    try {
      return await env.assets.fetch(request);
    } catch (e) {
      // إذا لم يجد الملف، يرجع صفحة index.html (مهم للـ Single Page Applications)
      const indexRequest = new Request(url.origin + '/index.html', request);
      return await env.assets.fetch(indexRequest);
    }
  }
};

