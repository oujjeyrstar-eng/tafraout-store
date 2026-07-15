/* ============================ DATA / STATE ============================ */
// ماكاينش كلمة سر فالجافاسكريبت هنا: التحقق ديال كلمة السر كيوقع فالسيرفر (api/login)
const API_BASE = 'api/';
let csrfToken = '';

const WHATSAPP_NUMBER = "212625679600"; // 0625679600 بصيغة دولية
const CONTACT_PHONE = "0625679600";
const CONTACT_EMAIL = "contact@tafraout-equip.ma";
const CONTACT_ADDRESS = { ar:"إنزكان، إقليم إنزكان أيت ملول، المغرب", fr:"Inezgane, Province d'Inezgane Aït Melloul, Maroc", en:"Inezgane, Inezgane Ait Melloul Province, Morocco" };

let state = {
  lang: 'ar',
  page: 'home', // home, categories, products, product, contact, cart, admin
  selectedCategory: null,
  selectedProduct: null,
  search: '',
  mobileNavOpen: false,
  cartOpen: false,
  admin: { loggedIn:false, tab:'products', editingProduct:null, editingCategory:null, passInput:'' }
};

let categories = [];
let products = [];
let messages = [];
let orders = [];

/* ============================ CART ============================ */
function loadCart(){
  try{ return JSON.parse(localStorage.getItem('tf_cart')||'[]'); }catch(e){ return []; }
}
function saveCart(){
  try{ localStorage.setItem('tf_cart', JSON.stringify(cart)); }catch(e){}
}
let cart = loadCart(); // [{id, qty}]

function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartLines(){
  return cart.map(ci=>{
    const p = products.find(x=>x.id===ci.id);
    if(!p) return null;
    return { id:p.id, name:tf(p.name), price:p.price, qty:ci.qty, image:p.image };
  }).filter(Boolean);
}
function cartTotal(){ return cartLines().reduce((s,l)=>s+l.price*l.qty,0); }

function addToCart(id, qty){
  qty = qty||1;
  const existing = cart.find(i=>i.id===id);
  if(existing) existing.qty = Math.min(99, existing.qty+qty);
  else cart.push({id, qty});
  saveCart();
  showToast(t('added_to_cart'));
  renderApp();
}
function setCartQty(id, qty){
  qty = Math.max(0, Math.min(99, qty));
  if(qty===0){ cart = cart.filter(i=>i.id!==id); }
  else { const it = cart.find(i=>i.id===id); if(it) it.qty = qty; }
  saveCart();
  renderApp();
}
function removeFromCart(id){ cart = cart.filter(i=>i.id!==id); saveCart(); renderApp(); }
function toggleCart(){ state.cartOpen = !state.cartOpen; renderApp(); }
function clearCart(){ cart = []; saveCart(); }

const ICONS = ['✦','◈','✺','⬢','◎'];
const CAT_COLORS = ['#C1694F','#33506F','#B78A4A','#6B7A5E','#8B4A6B'];

function placeholderImg(label, color){
  const c = color || '#C1694F';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#EBDFC6"/>
    <circle cx="300" cy="230" r="110" fill="${c}" opacity="0.18"/>
    <circle cx="300" cy="230" r="60" fill="${c}" opacity="0.35"/>
    <text x="300" y="420" font-family="Georgia,serif" font-size="26" fill="#241F1A" text-anchor="middle" opacity="0.55">${label}</text>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

function defaultCategories(){
  return [
    { id:'cat-lamps', color:CAT_COLORS[0], icon:ICONS[0],
      name:{ar:'تريات وإنارة', fr:'Luminaires', en:'Lighting'} },
    { id:'cat-decor', color:CAT_COLORS[1], icon:ICONS[1],
      name:{ar:'ديكور المنزل', fr:'Décoration', en:'Home Decor'} },
    { id:'cat-mirrors', color:CAT_COLORS[2], icon:ICONS[2],
      name:{ar:'مرايا فاخرة', fr:'Miroirs', en:'Mirrors'} },
    { id:'cat-craft', color:CAT_COLORS[3], icon:ICONS[3],
      name:{ar:'صناعة تقليدية', fr:'Artisanat', en:'Craftsmanship'} },
  ];
}

function defaultProducts(){
  return [
    { id:'p1', categoryId:'cat-lamps', price:1450, image:'', featured:true,
      name:{ar:'مصباح طاولة كريستال وكروم', fr:'Lampe de table cristal & chrome', en:'Crystal & Chrome Table Lamp'},
      desc:{ar:'مصباح طاولة أنيق مصنوع من الكريستال المصقول وقاعدة كروم لامعة، يضفي لمسة فخامة على أي فضاء.',
             fr:"Lampe de table élégante en cristal poli avec base chromée brillante, apporte une touche de luxe à n'importe quel espace.",
             en:'An elegant table lamp crafted from polished crystal with a glossy chrome base, adding a touch of luxury to any space.'} },
    { id:'p2', categoryId:'cat-mirrors', price:980, image:'', featured:true,
      name:{ar:'مرآة دائرية بإطار نحاسي', fr:'Miroir rond cadre laiton', en:'Round Mirror Brass Frame'},
      desc:{ar:'مرآة دائرية بإطار نحاسي مصقول، تصميم عصري يناسب الصالون والمدخل.',
             fr:"Miroir rond à cadre en laiton poli, design moderne idéal pour le salon et l'entrée.",
             en:'Round mirror with a polished brass frame, a modern design suited for living rooms and entryways.'} },
    { id:'p3', categoryId:'cat-decor', price:520, image:'', featured:true,
      name:{ar:'مزهرية سيراميك مرسومة يدويا', fr:'Vase en céramique peint à la main', en:'Hand-painted Ceramic Vase'},
      desc:{ar:'مزهرية من صناعة تقليدية، مرسومة يدويا بألهام أمازيغية أصيلة.',
             fr:'Vase artisanal peint à la main, inspiré de motifs amazighs authentiques.',
             en:'Handcrafted vase, hand-painted with authentic Amazigh-inspired motifs.'} },
    { id:'p4', categoryId:'cat-craft', price:650, image:'', featured:false,
      name:{ar:'صندوق خشبي منحوت', fr:'Coffret en bois sculpté', en:'Carved Wooden Box'},
      desc:{ar:'صندوق تقليدي منحوت يدويا من خشب الأرز، مثالي لحفظ المجوهرات.',
             fr:"Coffret traditionnel en bois de cèdre sculpté à la main, idéal pour ranger des bijoux.",
             en:'Traditional box hand-carved from cedar wood, perfect for storing jewelry.'} },
  ];
}

/* ============================ i18n ============================ */
const T = {
  ar:{
    nav_home:'الرئيسية', nav_categories:'الأصناف', nav_products:'المنتوجات', nav_contact:'تواصل معنا', nav_admin:'الإدارة',
    hero_eyebrow:'صنعة تفراوت الأصيلة', hero_title:'تجهيزات تفراوت',
    hero_lead:'تريات وديكورات فاخرة، بلمسة تقليدية مغربية أصيلة وجودة عصرية. كل قطعة تحكي حكاية من قلب الأطلس الصغير.',
    hero_cta1:'شاهد المنتوجات', hero_cta2:'تواصل معنا',
    featured_categories:'الأصناف', featured_categories_sub:'اكتشف مجموعتنا حسب الصنف',
    featured_products:'منتوجات مختارة', featured_products_sub:'أجمل ما عندنا هاد الموسم',
    view_all:'شاهد الكل', all_categories:'جميع الأصناف', all_products:'جميع المنتوجات',
    search_placeholder:'قلّب على منتوج...', no_products:'ماكاينش منتوجات فهاد الصنف حاليا',
    currency:'درهم', product_details:'تفاصيل المنتوج', back:'رجوع',
    order_whatsapp:'اطلب عبر واتساب', ask_price:'استفسر على الثمن',
    about_title:'شكون احنا', about_text:'تجهيزات تفراوت متجر متخصص فبيع التريات والديكورات المنزلية، كنجمعو بين الصناعة التقليدية المغربية والتصاميم العصرية باش نوصلو ليكم قطع فريدة كتزيّن داركم.',
    why1_t:'صناعة يدوية', why1_d:'كل قطعة كتصنع بعناية من طرف حرفيين مهرة.',
    why2_t:'جودة مضمونة', why2_d:'كنختارو المواد الأولية بدقة باش نضمنو الجودة.',
    why3_t:'توصيل لجميع المدن', why3_d:'كنوصلو طلبيتكم أينما كنتم فالمغرب.',
    contact_title:'تواصل معنا', contact_sub:'عندك سؤال ولا بغيتي تطلب؟ راسلنا وغادي نجاوبوك فأقرب وقت.',
    form_name:'الإسم الكامل', form_phone:'رقم الهاتف', form_message:'رسالتك', form_send:'إرسال الرسالة', form_sent:'تم إرسال رسالتك بنجاح، غادي نتواصلو معاك قريبا!',
    whatsapp_us:'واتساب', call_us:'اتصل بينا', email_us:'البريد الإلكتروني', address_us:'العنوان',
    footer_about:'تجهيزات تفراوت - تريات وديكورات فاخرة كتزاوج بين الأصالة والعصرنة.',
    footer_links:'روابط', footer_contact:'التواصل', footer_rights:'جميع الحقوق محفوظة',
    admin_login_title:'دخول الإدارة', admin_login_sub:'دخل كلمة السر باش توصل للوحة التحكم',
    admin_password:'كلمة السر', admin_enter:'دخول', admin_wrong:'كلمة السر خاطئة',
    admin_logout:'خروج', admin_dashboard:'لوحة التحكم',
    tab_products:'المنتوجات', tab_categories:'الأصناف', tab_messages:'الرسائل',
    add_product:'إضافة منتوج', add_category:'إضافة صنف', edit:'تعديل', delete:'حذف', save:'حفظ', cancel:'إلغاء',
    field_name_ar:'الإسم بالعربية', field_name_fr:'الإسم بالفرنسية', field_name_en:'الإسم بالإنجليزية',
    field_desc_ar:'الوصف بالعربية', field_desc_fr:'الوصف بالفرنسية', field_desc_en:'الوصف بالإنجليزية',
    field_price:'الثمن (درهم)', field_category:'الصنف', field_image:'صورة المنتوج', field_featured:'منتوج مميز (يبان فالرئيسية)',
    upload_hint:'اضغط باش تحمل صورة (JPG/PNG)', confirm_delete:'واش متأكد بغيتي تحذف؟',
    no_messages:'ماكاينش رسائل حاليا', table_name:'الإسم', table_price:'الثمن', table_category:'الصنف', table_actions:'إجراءات',
    saved:'تم الحفظ بنجاح', deleted:'تم الحذف',
    add_to_cart:'زيد للسلة', added_to_cart:'تزاد للسلة', cart:'السلة', cart_empty:'السلة خاوية حاليا',
    cart_title:'سلة الشراء', qty:'الكمية', remove:'حذف', total:'المجموع',
    checkout:'إتمام الطلب', checkout_title:'معلومات التوصيل', form_address:'العنوان الكامل',
    place_order:'تأكيد الطلب', order_success:'تم إرسال طلبك بنجاح! غادي نتواصلو معاك قريبا لتأكيد التوصيل.',
    order_error:'وقع مشكل فإرسال الطلب، حاول عاود', continue_shopping:'كمل التسوق',
    tab_orders:'الطلبات', tab_settings:'الإعدادات', no_orders:'ماكاينش طلبات حاليا',
    order_status_pending:'فالانتظار', order_status_confirmed:'مؤكد', order_status_shipped:'فالطريق',
    order_status_delivered:'توصل', order_status_cancelled:'ملغي',
    settings_change_pass:'تبديل كلمة السر', current_password:'كلمة السر الحالية', new_password:'كلمة السر الجديدة',
    confirm_new_password:'تأكيد كلمة السر الجديدة', change_password_btn:'حفظ كلمة السر الجديدة',
    pass_changed:'تبدلات كلمة السر بنجاح', pass_mismatch:'كلمتا السر ماشي متطابقين',
    pass_too_short:'خاص كلمة السر تكون 8 حروف على الأقل', pass_wrong_current:'كلمة السر الحالية خاطئة',
  },
  fr:{
    nav_home:'Accueil', nav_categories:'Catégories', nav_products:'Produits', nav_contact:'Contact', nav_admin:'Admin',
    hero_eyebrow:"L'artisanat authentique de Tafraout", hero_title:'Tajhizat Tafraout',
    hero_lead:"Luminaires et décoration d'intérieur haut de gamme, alliant tradition marocaine authentique et qualité moderne. Chaque pièce raconte une histoire venue du cœur de l'Anti-Atlas.",
    hero_cta1:'Voir les produits', hero_cta2:'Nous contacter',
    featured_categories:'Catégories', featured_categories_sub:'Découvrez notre collection par catégorie',
    featured_products:'Produits vedettes', featured_products_sub:'Le meilleur de notre sélection',
    view_all:'Voir tout', all_categories:'Toutes les catégories', all_products:'Tous les produits',
    search_placeholder:'Rechercher un produit...', no_products:"Aucun produit dans cette catégorie pour l'instant",
    currency:'DH', product_details:'Détails du produit', back:'Retour',
    order_whatsapp:'Commander via WhatsApp', ask_price:"Demander le prix",
    about_title:'Qui sommes-nous', about_text:"Tajhizat Tafraout est une boutique spécialisée dans les luminaires et la décoration d'intérieur, alliant artisanat marocain traditionnel et design moderne pour vous offrir des pièces uniques qui subliment votre intérieur.",
    why1_t:'Fabrication artisanale', why1_d:'Chaque pièce est façonnée avec soin par des artisans qualifiés.',
    why2_t:'Qualité garantie', why2_d:'Nous sélectionnons rigoureusement nos matières premières.',
    why3_t:'Livraison partout au Maroc', why3_d:'Votre commande livrée où que vous soyez.',
    contact_title:'Contactez-nous', contact_sub:"Une question ou une commande ? Écrivez-nous, nous répondrons rapidement.",
    form_name:'Nom complet', form_phone:'Téléphone', form_message:'Votre message', form_send:'Envoyer le message', form_sent:'Votre message a bien été envoyé, nous vous répondrons bientôt !',
    whatsapp_us:'WhatsApp', call_us:'Appelez-nous', email_us:'Email', address_us:'Adresse',
    footer_about:"Tajhizat Tafraout - luminaires et décoration haut de gamme, entre authenticité et modernité.",
    footer_links:'Liens', footer_contact:'Contact', footer_rights:'Tous droits réservés',
    admin_login_title:'Connexion Admin', admin_login_sub:"Entrez le mot de passe pour accéder au tableau de bord",
    admin_password:'Mot de passe', admin_enter:'Entrer', admin_wrong:'Mot de passe incorrect',
    admin_logout:'Déconnexion', admin_dashboard:'Tableau de bord',
    tab_products:'Produits', tab_categories:'Catégories', tab_messages:'Messages',
    add_product:'Ajouter un produit', add_category:'Ajouter une catégorie', edit:'Modifier', delete:'Supprimer', save:'Enregistrer', cancel:'Annuler',
    field_name_ar:'Nom en arabe', field_name_fr:'Nom en français', field_name_en:'Nom en anglais',
    field_desc_ar:'Description en arabe', field_desc_fr:'Description en français', field_desc_en:'Description en anglais',
    field_price:'Prix (DH)', field_category:'Catégorie', field_image:'Image du produit', field_featured:"Produit vedette (affiché en accueil)",
    upload_hint:'Cliquez pour charger une image (JPG/PNG)', confirm_delete:'Êtes-vous sûr de vouloir supprimer ?',
    no_messages:'Aucun message pour le moment', table_name:'Nom', table_price:'Prix', table_category:'Catégorie', table_actions:'Actions',
    saved:'Enregistré avec succès', deleted:'Supprimé',
    add_to_cart:'Ajouter au panier', added_to_cart:'Ajouté au panier', cart:'Panier', cart_empty:'Votre panier est vide',
    cart_title:'Panier', qty:'Quantité', remove:'Retirer', total:'Total',
    checkout:'Commander', checkout_title:'Informations de livraison', form_address:'Adresse complète',
    place_order:'Confirmer la commande', order_success:'Votre commande a été envoyée ! Nous vous contacterons bientôt pour confirmer la livraison.',
    order_error:"Erreur lors de l'envoi de la commande, réessayez", continue_shopping:'Continuer mes achats',
    tab_orders:'Commandes', tab_settings:'Paramètres', no_orders:'Aucune commande pour le moment',
    order_status_pending:'En attente', order_status_confirmed:'Confirmée', order_status_shipped:'En livraison',
    order_status_delivered:'Livrée', order_status_cancelled:'Annulée',
    settings_change_pass:'Changer le mot de passe', current_password:'Mot de passe actuel', new_password:'Nouveau mot de passe',
    confirm_new_password:'Confirmer le nouveau mot de passe', change_password_btn:'Enregistrer le nouveau mot de passe',
    pass_changed:'Mot de passe changé avec succès', pass_mismatch:'Les mots de passe ne correspondent pas',
    pass_too_short:'Le mot de passe doit contenir au moins 8 caractères', pass_wrong_current:'Mot de passe actuel incorrect',
  },
  en:{
    nav_home:'Home', nav_categories:'Categories', nav_products:'Products', nav_contact:'Contact', nav_admin:'Admin',
    hero_eyebrow:'Authentic Tafraout craftsmanship', hero_title:'Tajhizat Tafraout',
    hero_lead:'Premium lighting and home decor, blending authentic Moroccan tradition with modern quality. Every piece tells a story from the heart of the Anti-Atlas.',
    hero_cta1:'Browse products', hero_cta2:'Contact us',
    featured_categories:'Categories', featured_categories_sub:'Discover our collection by category',
    featured_products:'Featured products', featured_products_sub:'The best of our selection',
    view_all:'View all', all_categories:'All categories', all_products:'All products',
    search_placeholder:'Search a product...', no_products:'No products in this category yet',
    currency:'MAD', product_details:'Product details', back:'Back',
    order_whatsapp:'Order via WhatsApp', ask_price:'Ask about price',
    about_title:'About us', about_text:'Tajhizat Tafraout is a boutique specialized in lighting and home decor, blending traditional Moroccan craftsmanship with modern design to bring you unique pieces that elevate your home.',
    why1_t:'Handcrafted', why1_d:'Every piece is carefully shaped by skilled artisans.',
    why2_t:'Guaranteed quality', why2_d:'We carefully select our raw materials.',
    why3_t:'Delivery across Morocco', why3_d:'Your order delivered wherever you are.',
    contact_title:'Contact us', contact_sub:'Have a question or an order? Write to us and we will reply shortly.',
    form_name:'Full name', form_phone:'Phone number', form_message:'Your message', form_send:'Send message', form_sent:'Your message has been sent, we will get back to you soon!',
    whatsapp_us:'WhatsApp', call_us:'Call us', email_us:'Email', address_us:'Address',
    footer_about:'Tajhizat Tafraout - premium lighting and decor, between authenticity and modernity.',
    footer_links:'Links', footer_contact:'Contact', footer_rights:'All rights reserved',
    admin_login_title:'Admin Login', admin_login_sub:'Enter the password to access the dashboard',
    admin_password:'Password', admin_enter:'Enter', admin_wrong:'Incorrect password',
    admin_logout:'Log out', admin_dashboard:'Dashboard',
    tab_products:'Products', tab_categories:'Categories', tab_messages:'Messages',
    add_product:'Add product', add_category:'Add category', edit:'Edit', delete:'Delete', save:'Save', cancel:'Cancel',
    field_name_ar:'Name in Arabic', field_name_fr:'Name in French', field_name_en:'Name in English',
    field_desc_ar:'Description in Arabic', field_desc_fr:'Description in French', field_desc_en:'Description in English',
    field_price:'Price (MAD)', field_category:'Category', field_image:'Product image', field_featured:'Featured product (shown on homepage)',
    upload_hint:'Click to upload an image (JPG/PNG)', confirm_delete:'Are you sure you want to delete?',
    no_messages:'No messages yet', table_name:'Name', table_price:'Price', table_category:'Category', table_actions:'Actions',
    saved:'Saved successfully', deleted:'Deleted',
    add_to_cart:'Add to cart', added_to_cart:'Added to cart', cart:'Cart', cart_empty:'Your cart is empty',
    cart_title:'Shopping cart', qty:'Quantity', remove:'Remove', total:'Total',
    checkout:'Checkout', checkout_title:'Delivery information', form_address:'Full address',
    place_order:'Confirm order', order_success:'Your order has been sent! We will contact you shortly to confirm delivery.',
    order_error:'Something went wrong sending your order, please retry', continue_shopping:'Continue shopping',
    tab_orders:'Orders', tab_settings:'Settings', no_orders:'No orders yet',
    order_status_pending:'Pending', order_status_confirmed:'Confirmed', order_status_shipped:'Shipped',
    order_status_delivered:'Delivered', order_status_cancelled:'Cancelled',
    settings_change_pass:'Change password', current_password:'Current password', new_password:'New password',
    confirm_new_password:'Confirm new password', change_password_btn:'Save new password',
    pass_changed:'Password changed successfully', pass_mismatch:'Passwords do not match',
    pass_too_short:'Password must be at least 8 characters', pass_wrong_current:'Current password is incorrect',
  }
};
function t(key){ return (T[state.lang] && T[state.lang][key]) || key; }
function tf(field){ return (field && field[state.lang]) || field?.ar || field?.fr || field?.en || ''; }

/* ============================ STORAGE ============================ */
async function apiGet(endpoint){
  const res = await fetch(API_BASE + endpoint, { credentials:'same-origin' });
  if(!res.ok) throw new Error('http_'+res.status);
  return res.json();
}
async function apiPost(endpoint, body){
  const res = await fetch(API_BASE + endpoint, {
    method:'POST',
    credentials:'same-origin',
    headers:{ 'Content-Type':'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(body||{}),
  });
  let data = {};
  try{ data = await res.json(); }catch(e){}
  if(res.status === 401){
    // session ديال الأدمين سالات أو ماشي مسجل دخول: نرجعوه لصفحة الدخول
    state.admin.loggedIn = false;
    showToast(t('admin_wrong'));
    renderApp();
  }
  return { ok: res.ok, status: res.status, data };
}

async function checkSession(){
  try{
    const d = await apiGet('session');
    state.admin.loggedIn = !!d.loggedIn;
    csrfToken = d.csrfToken || '';
  }catch(e){ /* السيرفر ماشي متاح دابا، غادي نبقاو غير خارج الدخول */ }
}

async function loadData(){
  try{ categories = await apiGet('categories'); }
  catch(e){ categories = defaultCategories(); }

  try{ products = await apiGet('products'); }
  catch(e){ products = defaultProducts(); }

  await checkSession();
  if(state.admin.loggedIn){ await fetchMessages(); await fetchOrders(); }

  render();
}
async function fetchMessages(){
  try{ messages = await apiGet('messages'); }
  catch(e){ messages = []; }
}
async function saveCategories(){
  const r = await apiPost('categories', { categories });
  if(r.ok && r.data.categories) categories = r.data.categories;
  return r.ok;
}
async function saveProducts(){
  const r = await apiPost('products', { products });
  if(r.ok && r.data.products) products = r.data.products;
  return r.ok;
}

function showToast(msg){
  const holder = document.getElementById('toast-holder');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  holder.appendChild(el);
  setTimeout(()=>el.remove(), 2600);
}

/* ============================ NAVIGATION ============================ */
function go(page, extra){
  state.page = page;
  state.mobileNavOpen = false;
  state.cartOpen = false;
  if(extra) Object.assign(state, extra);
  window.scrollTo({top:0, behavior:'instant'});
  render();
}
function setLang(l){
  state.lang = l;
  document.body.className = 'lang-' + l;
  document.documentElement.lang = l;
  document.documentElement.dir = (l==='ar') ? 'rtl' : 'ltr';
  render();
}
function toggleMobileNav(){ state.mobileNavOpen = !state.mobileNavOpen; render(); }

let _searchDebounceTimer = null;
function debouncedSearch(value){
  clearTimeout(_searchDebounceTimer);
  _searchDebounceTimer = setTimeout(()=>{
    state.search = value;
    renderApp();
    const input = document.querySelector('.search-box input');
    if(input){ input.focus(); const v=input.value; input.value=''; input.value=v; }
  }, 250);
}

/* ============================ RENDER: LAYOUT ============================ */
function renderHeader(){
  const navLinks = [
    ['home', t('nav_home')], ['categories', t('nav_categories')], ['products', t('nav_products')], ['contact', t('nav_contact')]
  ];
  return `
  <header class="site">
    <div class="header-inner">
      <div class="brand" style="cursor:pointer" onclick="go('home')">
        <span class="mark"></span> ${t('hero_title')}
      </div>
      <nav class="main-nav">
        ${navLinks.map(([p,l])=>`<a href="#" class="${state.page===p?'active':''}" onclick="event.preventDefault(); go('${p}')">${l}</a>`).join('')}
      </nav>
      <div class="header-actions">
        <a class="btn btn-outline btn-sm header-call" href="tel:${CONTACT_PHONE}" title="${t('call_us')}">&#128222; ${CONTACT_PHONE}</a>
        <a class="btn btn-primary btn-sm" href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" title="${t('whatsapp_us')}">&#9742; ${t('whatsapp_us')}</a>
        <button class="cart-btn" onclick="toggleCart()" title="${t('cart')}">
          &#128722; ${cartCount()>0?`<span class="cart-count">${cartCount()}</span>`:''}
        </button>
        <div class="lang-switch">
          <button class="${state.lang==='ar'?'active':''}" onclick="setLang('ar')">ع</button>
          <button class="${state.lang==='fr'?'active':''}" onclick="setLang('fr')">FR</button>
          <button class="${state.lang==='en'?'active':''}" onclick="setLang('en')">EN</button>
        </div>
        <button class="burger" onclick="toggleMobileNav()">&#9776;</button>
      </div>
    </div>
    <div class="mobile-nav ${state.mobileNavOpen?'open':''}">
      ${navLinks.map(([p,l])=>`<a href="#" onclick="event.preventDefault(); go('${p}')">${l}</a>`).join('')}
      <a href="tel:${CONTACT_PHONE}">&#128222; ${CONTACT_PHONE}</a>
      <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">&#9742; ${t('whatsapp_us')}</a>
    </div>
    ${state.cartOpen ? renderCartDrawer() : ''}
  </header>`;
}

function renderCartDrawer(){
  const lines = cartLines();
  return `
  <div class="cart-overlay" onclick="toggleCart()"></div>
  <div class="cart-drawer">
    <div class="cart-drawer-head">
      <h3>${t('cart_title')}</h3>
      <button class="cart-close" onclick="toggleCart()">&times;</button>
    </div>
    ${lines.length ? `
      <div class="cart-lines">
        ${lines.map(l=>`
          <div class="cart-line">
            <img src="${l.image||placeholderImg('','#C1694F')}" alt="">
            <div class="cart-line-body">
              <span class="cart-line-name">${esc(l.name)}</span>
              <span class="cart-line-price">${l.price} ${t('currency')}</span>
              <div class="qty-stepper">
                <button onclick="setCartQty('${l.id}', ${l.qty-1})">&minus;</button>
                <span>${l.qty}</span>
                <button onclick="setCartQty('${l.id}', ${l.qty+1})">+</button>
              </div>
            </div>
            <button class="cart-line-remove" onclick="removeFromCart('${l.id}')" title="${t('remove')}">&times;</button>
          </div>`).join('')}
      </div>
      <div class="cart-drawer-foot">
        <div class="cart-total"><span>${t('total')}</span><b>${cartTotal()} ${t('currency')}</b></div>
        <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="state.cartOpen=false; go('cart');">${t('checkout')}</button>
      </div>
    ` : `<div class="empty-state" style="padding:40px 20px;">${t('cart_empty')}</div>`}
  </div>`;
}

function renderFooter(){
  return `
  <footer class="site">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <div class="brand" style="margin-bottom:14px;">${t('hero_title')}</div>
          <p>${t('footer_about')}</p>
        </div>
        <div>
          <h5>${t('footer_links')}</h5>
          <a href="#" onclick="event.preventDefault(); go('home')">${t('nav_home')}</a>
          <a href="#" onclick="event.preventDefault(); go('categories')">${t('nav_categories')}</a>
          <a href="#" onclick="event.preventDefault(); go('products')">${t('nav_products')}</a>
        </div>
        <div>
          <h5>${t('footer_contact')}</h5>
          <a href="tel:${CONTACT_PHONE.replace(/\s/g,'')}">${CONTACT_PHONE}</a>
          <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
          <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">${t('whatsapp_us')}</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} ${t('hero_title')}. ${t('footer_rights')}.</span>
        <span>Tafraout, Maroc</span>
      </div>
    </div>
  </footer>
  <a class="wa-fab" href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" title="WhatsApp">&#9742;</a>
  `;
}

/* ============================ RENDER: HOME ============================ */
function renderHome(){
  const featured = products.filter(p=>p.featured).slice(0,4);
  const list = featured.length ? featured : products.slice(0,4);
  return `
  <section class="hero">
    <div class="wrap hero-inner">
      <div>
        <span class="eyebrow reveal">${t('hero_eyebrow')}</span>
        <h1 class="reveal" style="transition-delay:.05s">${t('hero_title')}</h1>
        <p class="lead reveal" style="transition-delay:.1s">${t('hero_lead')}</p>
        <div class="hero-cta reveal" style="transition-delay:.16s">
          <a href="#" class="btn btn-primary" onclick="event.preventDefault(); go('products')">${t('hero_cta1')}</a>
          <a href="#" class="btn btn-outline" onclick="event.preventDefault(); go('contact')">${t('hero_cta2')}</a>
        </div>
        <div class="stats-bar reveal" style="transition-delay:.22s">
          <div class="stat"><span class="stat-num" data-target="${products.length}">0</span><span class="stat-label">${t('all_products')}</span></div>
          <div class="stat"><span class="stat-num" data-target="${categories.length}">0</span><span class="stat-label">${t('all_categories')}</span></div>
          <div class="stat"><span class="stat-num" data-target="100">0</span><span class="stat-label">%</span></div>
        </div>
      </div>
      <div class="hero-visual reveal" style="transition-delay:.12s">
        <div class="hero-card">
          <span class="tag">${t('hero_eyebrow')}</span>
          <img src="${(list[0] && list[0].image) || placeholderImg(t('hero_title'), '#C1694F')}" alt="">
        </div>
      </div>
    </div>
  </section>

  <div class="rocks-divider"><span></span><span></span><span></span><span></span><span></span></div>

  <section class="section wrap">
    <div class="section-head reveal">
      <div><h2>${t('featured_categories')}</h2><p>${t('featured_categories_sub')}</p></div>
      <a href="#" class="view-all" onclick="event.preventDefault(); go('categories')">${t('view_all')} &rarr;</a>
    </div>
    <div class="cat-grid">
      ${categories.map((c,i)=>renderCatCard(c,i)).join('')}
    </div>
  </section>

  <section class="section wrap">
    <div class="section-head reveal">
      <div><h2>${t('featured_products')}</h2><p>${t('featured_products_sub')}</p></div>
      <a href="#" class="view-all" onclick="event.preventDefault(); go('products')">${t('view_all')} &rarr;</a>
    </div>
    <div class="prod-grid">
      ${list.map((p,i)=>renderProdCard(p,i)).join('')}
    </div>
  </section>

  <section class="about-section section">
    <div class="wrap">
      <h2 class="reveal" style="font-family:var(--font-display); font-size:clamp(24px,3vw,32px); margin-bottom:14px;">${t('about_title')}</h2>
      <p class="reveal" style="max-width:620px; opacity:.8; line-height:1.8;">${t('about_text')}</p>
      <div class="why-grid">
        <div class="why-card reveal" style="transition-delay:.05s"><div class="why-num">01</div><h4>${t('why1_t')}</h4><p>${t('why1_d')}</p></div>
        <div class="why-card reveal" style="transition-delay:.15s"><div class="why-num">02</div><h4>${t('why2_t')}</h4><p>${t('why2_d')}</p></div>
        <div class="why-card reveal" style="transition-delay:.25s"><div class="why-num">03</div><h4>${t('why3_t')}</h4><p>${t('why3_d')}</p></div>
      </div>
    </div>
  </section>
  `;
}

function renderCatCard(c, i){
  const count = products.filter(p=>p.categoryId===c.id).length;
  const delay = (i!==undefined) ? `style="transition-delay:${Math.min(i*70,350)}ms"` : '';
  return `
  <div class="cat-card reveal" ${delay} onclick="go('products',{selectedCategory:'${c.id}'})">
    <div class="cat-icon" style="background:${c.color}">${c.icon}</div>
    <h3>${tf(c.name)}</h3>
    <span class="count">${count} ${state.lang==='ar'?'منتوج':(state.lang==='fr'?'produits':'products')}</span>
  </div>`;
}

function renderProdCard(p, i){
  const cat = categories.find(c=>c.id===p.categoryId);
  const delay = (i!==undefined) ? `style="transition-delay:${Math.min(i*70,350)}ms"` : '';
  return `
  <div class="prod-card reveal" ${delay}>
    <div class="prod-img" onclick="go('product',{selectedProduct:'${p.id}'})"><img loading="lazy" src="${p.image || placeholderImg(tf(p.name), cat?cat.color:'#C1694F')}" alt="${esc(tf(p.name))}"></div>
    <div class="prod-body">
      <span class="prod-cat" onclick="go('product',{selectedProduct:'${p.id}'})">${cat?tf(cat.name):''}</span>
      <span class="prod-name" onclick="go('product',{selectedProduct:'${p.id}'})">${tf(p.name)}</span>
      <div class="prod-bottom">
        <span class="prod-price">${p.price} ${t('currency')}</span>
        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); addToCart('${p.id}',1)">${t('add_to_cart')}</button>
      </div>
    </div>
  </div>`;
}

/* ============================ RENDER: CATEGORIES ============================ */
function renderCategories(){
  return `
  <section class="section wrap">
    <div class="section-head reveal"><div><h2>${t('all_categories')}</h2></div></div>
    <div class="cat-grid">${categories.map((c,i)=>renderCatCard(c,i)).join('')}</div>
  </section>`;
}

/* ============================ RENDER: PRODUCTS ============================ */
function renderProducts(){
  let list = products;
  if(state.selectedCategory) list = list.filter(p=>p.categoryId===state.selectedCategory);
  if(state.search){
    const s = state.search.toLowerCase();
    list = list.filter(p=> tf(p.name).toLowerCase().includes(s) );
  }
  return `
  <section class="section wrap">
    <div class="section-head reveal"><div><h2>${t('all_products')}</h2></div></div>
    <div class="filters">
      <button class="chip ${!state.selectedCategory?'active':''}" onclick="go('products',{selectedCategory:null})">${t('all_categories')}</button>
      ${categories.map(c=>`<button class="chip ${state.selectedCategory===c.id?'active':''}" onclick="go('products',{selectedCategory:'${c.id}'})">${tf(c.name)}</button>`).join('')}
      <div class="search-box">
        <input type="text" placeholder="${t('search_placeholder')}" value="${state.search||''}" oninput="debouncedSearch(this.value)">
      </div>
    </div>
    ${list.length ? `<div class="prod-grid">${list.map((p,i)=>renderProdCard(p,i)).join('')}</div>` : `<div class="empty-state">${t('no_products')}</div>`}
  </section>`;
}

/* ============================ RENDER: PRODUCT DETAIL ============================ */
function renderProduct(){
  const p = products.find(x=>x.id===state.selectedProduct);
  if(!p) return `<section class="section wrap"><div class="empty-state">404</div></section>`;
  const cat = categories.find(c=>c.id===p.categoryId);
  const waText = encodeURIComponent(`${t('hero_title')} - ${tf(p.name)} (${p.price} ${t('currency')})`);
  applySEO({
    title: `${tf(p.name)} | ${t('hero_title')}`,
    description: tf(p.desc).slice(0,160) || t('hero_lead'),
    image: p.image,
    productJsonLd: p,
  });
  return `
  <section class="section wrap">
    <a href="#" class="back-link" onclick="event.preventDefault(); go('products')">&larr; ${t('back')}</a>
    <div class="pd-wrap">
      <div class="pd-img"><img src="${p.image || placeholderImg(tf(p.name), cat?cat.color:'#C1694F')}" alt="${esc(tf(p.name))}"></div>
      <div>
        <div class="pd-cat">${cat?tf(cat.name):''}</div>
        <h1 class="pd-title">${tf(p.name)}</h1>
        <div class="pd-price">${p.price} ${t('currency')}</div>
        <p class="pd-desc">${tf(p.desc)}</p>
        <div class="qty-stepper qty-stepper-lg">
          <button onclick="pdQty=Math.max(1,pdQty-1); document.getElementById('pd-qty').textContent=pdQty;">&minus;</button>
          <span id="pd-qty">1</span>
          <button onclick="pdQty=Math.min(99,pdQty+1); document.getElementById('pd-qty').textContent=pdQty;">+</button>
        </div>
        <div class="hero-cta">
          <button class="btn btn-primary" onclick="addToCart('${p.id}', pdQty); pdQty=1;">${t('add_to_cart')}</button>
          <a class="btn btn-outline" href="https://wa.me/${WHATSAPP_NUMBER}?text=${waText}" target="_blank">${t('order_whatsapp')}</a>
        </div>
      </div>
    </div>
  </section>`;
}
let pdQty = 1;

/* ============================ SEO ============================ */
function applySEO({ title, description, image, productJsonLd } = {}){
  if(title) document.title = title;
  if(description){
    let m = document.querySelector('meta[name="description"]');
    if(m) m.setAttribute('content', description);
  }
  // نصفيو أي JSON-LD ديال منتوج سابق قبل ما نزيدو واحد جديد
  const old = document.getElementById('product-jsonld');
  if(old) old.remove();
  if(productJsonLd){
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-jsonld';
    script.textContent = JSON.stringify({
      '@context':'https://schema.org', '@type':'Product',
      name: tf(productJsonLd.name), description: tf(productJsonLd.desc),
      image: image || undefined,
      offers: { '@type':'Offer', priceCurrency:'MAD', price: productJsonLd.price, availability:'https://schema.org/InStock' },
    });
    document.head.appendChild(script);
  }
}
function resetSEO(){
  applySEO({ title: t('hero_title')+' | '+t('hero_eyebrow'), description: t('hero_lead') });
  const old = document.getElementById('product-jsonld');
  if(old) old.remove();
}

/* ============================ RENDER: CART / CHECKOUT ============================ */
function renderCartPage(){
  const lines = cartLines();
  if(!lines.length){
    return `
    <section class="section wrap">
      <div class="empty-state">${t('cart_empty')}</div>
      <div class="hero-cta" style="justify-content:center; margin-top:16px;">
        <a href="#" class="btn btn-primary" onclick="event.preventDefault(); go('products')">${t('continue_shopping')}</a>
      </div>
    </section>`;
  }
  return `
  <section class="section wrap">
    <div class="section-head"><div><h2>${t('cart_title')}</h2></div></div>
    <div class="checkout-grid">
      <div class="cart-lines cart-lines-page">
        ${lines.map(l=>`
          <div class="cart-line">
            <img src="${l.image||placeholderImg('','#C1694F')}" alt="">
            <div class="cart-line-body">
              <span class="cart-line-name">${esc(l.name)}</span>
              <span class="cart-line-price">${l.price} ${t('currency')}</span>
              <div class="qty-stepper">
                <button onclick="setCartQty('${l.id}', ${l.qty-1})">&minus;</button>
                <span>${l.qty}</span>
                <button onclick="setCartQty('${l.id}', ${l.qty+1})">+</button>
              </div>
            </div>
            <button class="cart-line-remove" onclick="removeFromCart('${l.id}')" title="${t('remove')}">&times;</button>
          </div>`).join('')}
        <div class="cart-total cart-total-page"><span>${t('total')}</span><b>${cartTotal()} ${t('currency')}</b></div>
      </div>
      <div class="admin-card">
        <h3>${t('checkout_title')}</h3>
        <form onsubmit="return submitOrder(event)">
          <div class="form-field"><label>${t('form_name')}</label><input required id="ck-name" type="text"></div>
          <div class="form-field"><label>${t('form_phone')}</label><input required id="ck-phone" type="text"></div>
          <div class="form-field"><label>${t('form_address')}</label><textarea required id="ck-address"></textarea></div>
          <div style="position:absolute; inset-inline-start:-9999px;" aria-hidden="true">
            <label>Website</label><input type="text" id="ck-website" tabindex="-1" autocomplete="off">
          </div>
          <button class="btn btn-primary" style="width:100%; justify-content:center;" type="submit" id="ck-submit-btn">${t('place_order')}</button>
        </form>
      </div>
    </div>
  </section>`;
}

async function submitOrder(e){
  e.preventDefault();
  const btn = document.getElementById('ck-submit-btn');
  const name = document.getElementById('ck-name').value.trim();
  const phone = document.getElementById('ck-phone').value.trim();
  const address = document.getElementById('ck-address').value.trim();
  const website = document.getElementById('ck-website').value;
  if(btn) btn.disabled = true;
  try{
    const res = await fetch(API_BASE + 'orders', {
      method:'POST', credentials:'same-origin',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ name, phone, address, website, items: cartLines().map(l=>({id:l.id,name:l.name,price:l.price,qty:l.qty})) }),
    });
    const data = await res.json().catch(()=>({}));
    if(res.ok && data.ok){
      clearCart();
      showToast(t('order_success'));
      go('home');
    } else if(res.status === 429){
      showToast(state.lang==='ar' ? 'صيفطتي طلبات بزاف، حاول من بعد' : (state.lang==='fr' ? 'Trop de commandes envoyées, réessayez plus tard' : 'Too many orders sent, try again later'));
    } else {
      showToast(t('order_error'));
    }
  } finally {
    if(btn) btn.disabled = false;
  }
  return false;
}

/* ============================ RENDER: CONTACT ============================ */
function renderContact(){
  return `
  <section class="section wrap">
    <div class="section-head"><div><h2>${t('contact_title')}</h2><p>${t('contact_sub')}</p></div></div>
    <div class="contact-grid">
      <div>
        <div class="contact-methods">
          <a class="method" href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">
            <span class="ic">&#9742;</span><div><b>${t('whatsapp_us')}</b><span>${CONTACT_PHONE}</span></div>
          </a>
          <a class="method" href="tel:${CONTACT_PHONE.replace(/\s/g,'')}">
            <span class="ic">&#128222;</span><div><b>${t('call_us')}</b><span>${CONTACT_PHONE}</span></div>
          </a>
          <a class="method" href="mailto:${CONTACT_EMAIL}">
            <span class="ic">&#9993;</span><div><b>${t('email_us')}</b><span>${CONTACT_EMAIL}</span></div>
          </a>
          <div class="method">
            <span class="ic">&#128205;</span><div><b>${t('address_us')}</b><span>${tf(CONTACT_ADDRESS)}</span></div>
          </div>
        </div>
      </div>
      <div>
        <form onsubmit="return submitContactForm(event)">
          <div class="form-field"><label>${t('form_name')}</label><input required id="cf-name" type="text"></div>
          <div class="form-field"><label>${t('form_phone')}</label><input required id="cf-phone" type="text"></div>
          <div class="form-field"><label>${t('form_message')}</label><textarea required id="cf-message"></textarea></div>
          <div style="position:absolute; inset-inline-start:-9999px;" aria-hidden="true">
            <label>Website</label><input type="text" id="cf-website" name="website" tabindex="-1" autocomplete="off">
          </div>
          <button class="btn btn-indigo" type="submit" id="cf-submit-btn">${t('form_send')}</button>
        </form>
      </div>
    </div>
  </section>`;
}
async function submitContactForm(e){
  e.preventDefault();
  const btn = document.getElementById('cf-submit-btn');
  const name = document.getElementById('cf-name').value.trim();
  const phone = document.getElementById('cf-phone').value.trim();
  const message = document.getElementById('cf-message').value.trim();
  const website = document.getElementById('cf-website').value; // حقل مصيدة (honeypot) للبوتات
  if(btn) btn.disabled = true;
  try{
    const res = await fetch(API_BASE + 'messages', {
      method:'POST', credentials:'same-origin',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ name, phone, message, website }),
    });
    const data = await res.json().catch(()=>({}));
    if(res.ok && data.ok){
      showToast(t('form_sent'));
      go('contact');
    } else if(res.status === 429){
      showToast(state.lang==='ar' ? 'صيفطتي رسائل بزاف، حاول من بعد' : (state.lang==='fr' ? 'Trop de messages envoyés, réessayez plus tard' : 'Too many messages sent, try again later'));
    } else {
      showToast(state.lang==='ar' ? 'وقع مشكل، حاول عاود' : (state.lang==='fr' ? 'Une erreur est survenue, réessayez' : 'Something went wrong, please retry'));
    }
  } finally {
    if(btn) btn.disabled = false;
  }
  return false;
}

/* ============================ RENDER: ADMIN ============================ */
function renderAdmin(){
  if(!state.admin.loggedIn){
    return `
    <div class="wrap">
      <div class="admin-login">
        <h2>${t('admin_login_title')}</h2>
        <p>${t('admin_login_sub')}</p>
        <div class="form-field" style="text-align:${state.lang==='ar'?'right':'left'}">
          <input type="password" id="admin-pass" placeholder="${t('admin_password')}" onkeydown="if(event.key==='Enter') adminLogin()">
        </div>
        <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="adminLogin()">${t('admin_enter')}</button>
      </div>
    </div>`;
  }
  return `
  <div class="wrap">
    <div class="admin-bar">
      <h2 style="font-family:var(--font-display);">${t('admin_dashboard')}</h2>
      <button class="btn btn-outline btn-sm" onclick="adminLogout()">${t('admin_logout')}</button>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab ${state.admin.tab==='products'?'active':''}" onclick="switchAdminTab('products')">${t('tab_products')}</button>
      <button class="admin-tab ${state.admin.tab==='categories'?'active':''}" onclick="switchAdminTab('categories')">${t('tab_categories')}</button>
      <button class="admin-tab ${state.admin.tab==='orders'?'active':''}" onclick="switchAdminTab('orders')">${t('tab_orders')} ${orders.length?`(${orders.length})`:''}</button>
      <button class="admin-tab ${state.admin.tab==='messages'?'active':''}" onclick="switchAdminTab('messages')">${t('tab_messages')} ${messages.length?`(${messages.length})`:''}</button>
      <button class="admin-tab ${state.admin.tab==='settings'?'active':''}" onclick="switchAdminTab('settings')">${t('tab_settings')}</button>
    </div>
    ${state.admin.tab==='products' ? renderAdminProducts() : ''}
    ${state.admin.tab==='categories' ? renderAdminCategories() : ''}
    ${state.admin.tab==='orders' ? renderAdminOrders() : ''}
    ${state.admin.tab==='messages' ? renderAdminMessages() : ''}
    ${state.admin.tab==='settings' ? renderAdminSettings() : ''}
  </div>`;
}

async function switchAdminTab(tab){
  state.admin.tab = tab;
  if(tab === 'messages') await fetchMessages();
  if(tab === 'orders') await fetchOrders();
  renderApp();
}

async function fetchOrders(){
  try{ orders = await apiGet('orders'); }
  catch(e){ orders = []; }
}

function renderAdminOrders(){
  if(!orders.length) return `<div class="empty-state">${t('no_orders')}</div>`;
  const statuses = ['pending','confirmed','shipped','delivered','cancelled'];
  return `
  <div class="orders-list">
    ${orders.map(o=>`
      <div class="admin-card order-card">
        <div class="order-card-head">
          <div>
            <b>${esc(o.customer_name)}</b> &middot; <a href="tel:${esc(o.customer_phone)}">${esc(o.customer_phone)}</a>
            <div class="field-note">${new Date(o.date).toLocaleString(state.lang==='ar'?'ar-MA':(state.lang==='fr'?'fr-FR':'en-US'))}</div>
          </div>
          <select onchange="updateOrderStatus('${o.id}', this.value)" class="order-status order-status-${o.status}">
            ${statuses.map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${t('order_status_'+s)}</option>`).join('')}
          </select>
        </div>
        ${o.customer_address ? `<div class="field-note" style="margin-bottom:8px;">${esc(o.customer_address)}</div>` : ''}
        <table class="admin-table">
          <tbody>
            ${o.items.map(it=>`<tr><td>${esc(it.name)}</td><td>x${it.qty}</td><td>${it.price*it.qty} ${t('currency')}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="cart-total cart-total-page"><span>${t('total')}</span><b>${o.total} ${t('currency')}</b></div>
      </div>
    `).join('')}
  </div>`;
}

async function updateOrderStatus(id, status){
  const res = await fetch(API_BASE + 'orders', {
    method:'PATCH', credentials:'same-origin',
    headers:{ 'Content-Type':'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ id, status }),
  });
  if(res.ok){
    const o = orders.find(x=>x.id===id);
    if(o) o.status = status;
    showToast(t('saved'));
  }
}

function renderAdminSettings(){
  return `
  <div class="admin-card" style="max-width:440px;">
    <h3>${t('settings_change_pass')}</h3>
    <form onsubmit="return changePassword(event)">
      <div class="form-field"><label>${t('current_password')}</label><input required type="password" id="cp-current"></div>
      <div class="form-field"><label>${t('new_password')}</label><input required type="password" id="cp-new" minlength="8"></div>
      <div class="form-field"><label>${t('confirm_new_password')}</label><input required type="password" id="cp-confirm" minlength="8"></div>
      <button class="btn btn-primary" type="submit" id="cp-submit-btn">${t('change_password_btn')}</button>
    </form>
  </div>`;
}

async function changePassword(e){
  e.preventDefault();
  const btn = document.getElementById('cp-submit-btn');
  const currentPassword = document.getElementById('cp-current').value;
  const newPassword = document.getElementById('cp-new').value;
  const confirmPassword = document.getElementById('cp-confirm').value;
  if(newPassword.length < 8){ showToast(t('pass_too_short')); return false; }
  if(newPassword !== confirmPassword){ showToast(t('pass_mismatch')); return false; }
  if(btn) btn.disabled = true;
  try{
    const r = await apiPost('change-password', { currentPassword, newPassword });
    if(r.ok && r.data.ok){
      showToast(t('pass_changed'));
      document.getElementById('cp-current').value='';
      document.getElementById('cp-new').value='';
      document.getElementById('cp-confirm').value='';
    } else if(r.data && r.data.error === 'wrong_password'){
      showToast(t('pass_wrong_current'));
    } else if(r.status === 429){
      showToast(state.lang==='ar' ? 'محاولات بزاف، حاول من بعد' : (state.lang==='fr' ? 'Trop de tentatives, réessayez plus tard' : 'Too many attempts, try again later'));
    } else {
      showToast(t('order_error'));
    }
  } finally {
    if(btn) btn.disabled = false;
  }
  return false;
}

async function adminLogin(){
  const btn = event ? event.target : null;
  const input = document.getElementById('admin-pass');
  const val = input.value;
  if(btn) btn.disabled = true;
  try{
    const res = await fetch(API_BASE + 'login', {
      method:'POST', credentials:'same-origin',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ password: val }),
    });
    const data = await res.json().catch(()=>({}));
    if(res.ok && data.ok){
      state.admin.loggedIn = true;
      csrfToken = data.csrfToken || '';
      await fetchMessages();
      render();
    } else if(res.status === 429){
      showToast(state.lang==='ar' ? 'محاولات بزاف، حاول من بعد شوية' : (state.lang==='fr' ? 'Trop de tentatives, réessayez plus tard' : 'Too many attempts, try again later'));
    } else {
      showToast(t('admin_wrong'));
      if(input) input.value = '';
    }
  } finally {
    if(btn) btn.disabled = false;
  }
}
async function adminLogout(){
  await apiPost('logout', {});
  state.admin.loggedIn = false;
  go('home');
}

function renderAdminProducts(){
  if(state.admin.editingProduct !== null){
    return renderProductForm();
  }
  return `
  <div style="margin-bottom:16px;"><button class="btn btn-primary btn-sm" onclick="state.admin.editingProduct='new'; renderApp();">+ ${t('add_product')}</button></div>
  <table class="admin-table">
    <thead><tr><th></th><th>${t('table_name')}</th><th>${t('table_category')}</th><th>${t('table_price')}</th><th>${t('table_actions')}</th></tr></thead>
    <tbody>
      ${products.map(p=>{
        const cat = categories.find(c=>c.id===p.categoryId);
        return `<tr>
          <td><img class="admin-thumb" src="${p.image || placeholderImg('', cat?cat.color:'#C1694F')}"></td>
          <td>${tf(p.name)}</td>
          <td>${cat?tf(cat.name):'-'}</td>
          <td>${p.price} ${t('currency')}</td>
          <td class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="state.admin.editingProduct='${p.id}'; renderApp();">${t('edit')}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">${t('delete')}</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function renderProductForm(){
  const isNew = state.admin.editingProduct === 'new';
  const p = isNew ? { id:'p'+Date.now(), categoryId:categories[0]?categories[0].id:'', price:0, image:'', featured:false, name:{ar:'',fr:'',en:''}, desc:{ar:'',fr:'',en:''} } : products.find(x=>x.id===state.admin.editingProduct);
  return `
  <div class="admin-card">
    <h3>${isNew?t('add_product'):t('edit')}</h3>
    <div class="grid2">
      <div class="form-field"><label>${t('field_name_ar')}</label><input id="pf-name-ar" value="${escAttr(p.name.ar)}"></div>
      <div class="form-field"><label>${t('field_name_fr')}</label><input id="pf-name-fr" value="${escAttr(p.name.fr)}"></div>
      <div class="form-field"><label>${t('field_name_en')}</label><input id="pf-name-en" value="${escAttr(p.name.en)}"></div>
      <div class="form-field"><label>${t('field_category')}</label>
        <select id="pf-category" style="width:100%; padding:12px 14px; border:1px solid var(--line);">
          ${categories.map(c=>`<option value="${c.id}" ${c.id===p.categoryId?'selected':''}>${tf(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-field"><label>${t('field_price')}</label><input id="pf-price" type="number" value="${p.price}"></div>
      <div class="form-field"><label><input type="checkbox" id="pf-featured" ${p.featured?'checked':''}> ${t('field_featured')}</label></div>
    </div>
    <div class="form-field"><label>${t('field_desc_ar')}</label><textarea id="pf-desc-ar">${p.desc.ar||''}</textarea></div>
    <div class="form-field"><label>${t('field_desc_fr')}</label><textarea id="pf-desc-fr">${p.desc.fr||''}</textarea></div>
    <div class="form-field"><label>${t('field_desc_en')}</label><textarea id="pf-desc-en">${p.desc.en||''}</textarea></div>
    <div class="form-field">
      <label>${t('field_image')}</label>
      <div class="upload-box" onclick="document.getElementById('pf-image-input').click()">
        <img id="pf-image-preview" src="${p.image || placeholderImg('', '#C1694F')}">
        <div class="field-note">${t('upload_hint')}</div>
      </div>
      <input type="file" id="pf-image-input" accept="image/*" style="display:none" onchange="handleImageUpload(event,'pf-image-preview')">
    </div>
    <div class="hero-cta" style="margin-top:20px;">
      <button class="btn btn-primary" onclick="saveProductForm('${p.id}', ${isNew})">${t('save')}</button>
      <button class="btn btn-outline" onclick="state.admin.editingProduct=null; renderApp();">${t('cancel')}</button>
    </div>
  </div>`;
}

function escAttr(s){ return (s||'').replace(/"/g,'&quot;'); }
// تنقية النصوص قبل عرضها كـ HTML باش نسدو الباب على ثغرة XSS
function esc(s){
  return (s==null?'':String(s))
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

let _pendingUpload = null;
function handleImageUpload(event, previewId){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  _pendingUpload = new Promise((resolve)=>{
    reader.onload = function(e){
      const img = new Image();
      img.onload = async function(){
        const canvas = document.createElement('canvas');
        const maxW = 900;
        const scale = Math.min(1, maxW/img.width);
        canvas.width = img.width*scale;
        canvas.height = img.height*scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const preview = document.getElementById(previewId);
        preview.src = dataUrl; // معاينة فورية محليا
        preview.classList.add('uploading');
        try{
          const r = await apiPost('upload', { image: dataUrl });
          if(r.ok && r.data.url){
            preview.dataset.value = r.data.url; // كنخزنو رابط R2 (خفيف) عوض base64 (تقيل)
          } else {
            preview.dataset.value = dataUrl; // fallback: إلا R2 ماشي مربوط، نخزنو base64 كيفما قبل
          }
        }catch(err){
          preview.dataset.value = dataUrl;
        } finally {
          preview.classList.remove('uploading');
          resolve();
        }
      };
      img.src = e.target.result;
    };
  });
  reader.readAsDataURL(file);
}

async function saveProductForm(id, isNew){
  const btn = event ? event.target : null;
  if(btn) btn.disabled = true;
  if(_pendingUpload){ await _pendingUpload; _pendingUpload = null; }
  const preview = document.getElementById('pf-image-preview');
  const imageVal = preview.dataset.value || (isNew ? '' : (products.find(x=>x.id===id)||{}).image || '');
  const obj = {
    id, categoryId: document.getElementById('pf-category').value,
    price: Number(document.getElementById('pf-price').value)||0,
    featured: document.getElementById('pf-featured').checked,
    image: imageVal,
    name:{ ar:document.getElementById('pf-name-ar').value, fr:document.getElementById('pf-name-fr').value, en:document.getElementById('pf-name-en').value },
    desc:{ ar:document.getElementById('pf-desc-ar').value, fr:document.getElementById('pf-desc-fr').value, en:document.getElementById('pf-desc-en').value },
  };
  if(isNew){ products.unshift(obj); } else { products = products.map(p=>p.id===id?obj:p); }
  await saveProducts();
  state.admin.editingProduct = null;
  showToast(t('saved'));
  renderApp();
}

async function deleteProduct(id){
  if(!confirm(t('confirm_delete'))) return;
  products = products.filter(p=>p.id!==id);
  await saveProducts();
  showToast(t('deleted'));
  renderApp();
}

function renderAdminCategories(){
  if(state.admin.editingCategory !== null){
    return renderCategoryForm();
  }
  return `
  <div style="margin-bottom:16px;"><button class="btn btn-primary btn-sm" onclick="state.admin.editingCategory='new'; renderApp();">+ ${t('add_category')}</button></div>
  <table class="admin-table">
    <thead><tr><th></th><th>${t('table_name')}</th><th>${state.lang==='ar'?'عدد المنتوجات':(state.lang==='fr'?'Nb produits':'Products')}</th><th>${t('table_actions')}</th></tr></thead>
    <tbody>
      ${categories.map(c=>{
        const count = products.filter(p=>p.categoryId===c.id).length;
        return `<tr>
          <td><div class="cat-icon" style="width:36px;height:36px;font-size:16px;background:${c.color}">${c.icon}</div></td>
          <td>${tf(c.name)}</td>
          <td>${count}</td>
          <td class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="state.admin.editingCategory='${c.id}'; renderApp();">${t('edit')}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}')">${t('delete')}</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function renderCategoryForm(){
  const isNew = state.admin.editingCategory === 'new';
  const c = isNew ? { id:'cat'+Date.now(), color:CAT_COLORS[categories.length%CAT_COLORS.length], icon:ICONS[categories.length%ICONS.length], name:{ar:'',fr:'',en:''} } : categories.find(x=>x.id===state.admin.editingCategory);
  return `
  <div class="admin-card">
    <h3>${isNew?t('add_category'):t('edit')}</h3>
    <div class="grid2">
      <div class="form-field"><label>${t('field_name_ar')}</label><input id="cf-name-ar" value="${escAttr(c.name.ar)}"></div>
      <div class="form-field"><label>${t('field_name_fr')}</label><input id="cf-name-fr" value="${escAttr(c.name.fr)}"></div>
      <div class="form-field"><label>${t('field_name_en')}</label><input id="cf-name-en" value="${escAttr(c.name.en)}"></div>
      <div class="form-field"><label>${state.lang==='ar'?'اللون':(state.lang==='fr'?'Couleur':'Color')}</label><input type="color" id="cf-color" value="${c.color}" style="width:100%; height:44px; border:1px solid var(--line); padding:2px;"></div>
    </div>
    <div class="hero-cta" style="margin-top:20px;">
      <button class="btn btn-primary" onclick="saveCategoryForm('${c.id}', ${isNew}, '${c.icon}')">${t('save')}</button>
      <button class="btn btn-outline" onclick="state.admin.editingCategory=null; renderApp();">${t('cancel')}</button>
    </div>
  </div>`;
}

async function saveCategoryForm(id, isNew, icon){
  const obj = {
    id, icon, color: document.getElementById('cf-color').value,
    name:{ ar:document.getElementById('cf-name-ar').value, fr:document.getElementById('cf-name-fr').value, en:document.getElementById('cf-name-en').value },
  };
  if(isNew){ categories.push(obj); } else { categories = categories.map(c=>c.id===id?obj:c); }
  await saveCategories();
  state.admin.editingCategory = null;
  showToast(t('saved'));
  renderApp();
}

async function deleteCategory(id){
  if(!confirm(t('confirm_delete'))) return;
  categories = categories.filter(c=>c.id!==id);
  await saveCategories();
  showToast(t('deleted'));
  renderApp();
}

function renderAdminMessages(){
  if(!messages.length) return `<div class="empty-state">${t('no_messages')}</div>`;
  return messages.map(m=>`
    <div class="msg-item">
      <div class="meta">${new Date(m.date).toLocaleString()} — ${esc(m.phone)}</div>
      <b>${esc(m.name)}</b>
      <p style="margin-top:6px; font-size:14px;">${esc(m.message)}</p>
    </div>`).join('');
}

/* ============================ MAIN RENDER ============================ */
let _lastPage = null;
function renderApp(){
  let body = '';
  if(state.page==='home') body = renderHome();
  else if(state.page==='categories') body = renderCategories();
  else if(state.page==='products') body = renderProducts();
  else if(state.page==='product') body = renderProduct();
  else if(state.page==='cart') body = renderCartPage();
  else if(state.page==='contact') body = renderContact();
  else if(state.page==='admin') body = renderAdmin();

  if(state.page!=='product') resetSEO();

  const app = document.getElementById('app');
  const pageChanged = _lastPage !== (state.page + (state.selectedProduct||'') + (state.selectedCategory||''));
  _lastPage = state.page + (state.selectedProduct||'') + (state.selectedCategory||'');

  if(pageChanged){
    app.style.transition = 'none';
    app.style.opacity = '0';
    app.style.transform = 'translateY(10px)';
  }

  app.innerHTML = `
    ${renderHeader()}
    <main>${body}</main>
    ${state.page!=='admin' ? renderFooter() : ''}
  `;

  if(pageChanged){
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        app.style.transition = 'opacity .38s ease, transform .38s ease';
        app.style.opacity = '1';
        app.style.transform = 'translateY(0)';
      });
    });
  }

  initRevealObserver();
  updateHeaderScrollState();
}
function render(){ renderApp(); }

/* ---------- Scroll-triggered reveal + animated counters ---------- */
function initRevealObserver(){
  const els = document.querySelectorAll('.reveal:not(.in-view)');
  if(!('IntersectionObserver' in window)){
    els.forEach(el=>el.classList.add('in-view'));
    animateCounters();
    return;
  }
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        if(entry.target.classList.contains('stats-bar')) animateCounters();
        obs.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  els.forEach(el=>obs.observe(el));
}
function animateCounters(){
  document.querySelectorAll('.stat-num').forEach(el=>{
    if(el.dataset.done) return;
    el.dataset.done = '1';
    const target = Number(el.dataset.target)||0;
    const duration = 900;
    const start = performance.now();
    function step(now){
      const progress = Math.min(1,(now-start)/duration);
      const eased = 1 - Math.pow(1-progress, 3);
      el.textContent = Math.round(eased*target);
      if(progress<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ---------- Header shadow on scroll ---------- */
function updateHeaderScrollState(){
  const h = document.querySelector('header.site');
  if(h) h.classList.toggle('scrolled', window.scrollY > 10);
}
window.addEventListener('scroll', updateHeaderScrollState);

// الدخول للإدارة كيتم غير برابط سري (#tafraout-admin) وماشي من التنقل العادي ديال الموقع
const ADMIN_SECRET_HASH = 'tafraout-admin';
function checkSecretRoute(){
  if(window.location.hash.replace('#','') === ADMIN_SECRET_HASH){
    state.page = 'admin';
  }
}
window.addEventListener('hashchange', ()=>{ checkSecretRoute(); render(); });

checkSecretRoute();
loadData();
