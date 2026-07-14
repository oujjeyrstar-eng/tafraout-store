export default {
  async fetch(request, env) {
    // هاد الكود كيحاول يجيب الملف من الـ Storage
    // إلا ما لقاهش، غادي يخدم الخدمة ديال الـ Database
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // هنا فين غتزيد الكود ديال الـ D1 Database ديالك لاحقاً
      return new Response("الموقع شغال، ولكن خاصنا نربطو الـ Database هنا!", { status: 200 });
    }
  },
};


