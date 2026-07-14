export default {
  async fetch(request, env) {
    // هاد الكود كيخلي الـ Worker يخدم كـ Proxy للملفات اللي ف public
    return await env.ASSETS.fetch(request);
  }
};


