<?php
require __DIR__ . '/config.php';

const MAX_IMAGE_LEN = 4_000_000; // ~3 ميغا للصورة بصيغة base64، كافية لصورة منتوج عادية

$defaultProducts = [
    ['id' => 'p1', 'categoryId' => 'cat-lamps', 'price' => 1450, 'image' => '', 'featured' => true,
        'name' => ['ar' => 'مصباح طاولة كريستال وكروم', 'fr' => 'Lampe de table cristal & chrome', 'en' => 'Crystal & Chrome Table Lamp'],
        'desc' => ['ar' => 'مصباح طاولة أنيق مصنوع من الكريستال المصقول وقاعدة كروم لامعة.', 'fr' => "Lampe de table élégante en cristal poli avec base chromée.", 'en' => 'An elegant table lamp crafted from polished crystal with a chrome base.']],
    ['id' => 'p2', 'categoryId' => 'cat-mirrors', 'price' => 980, 'image' => '', 'featured' => true,
        'name' => ['ar' => 'مرآة دائرية بإطار نحاسي', 'fr' => 'Miroir rond cadre laiton', 'en' => 'Round Mirror Brass Frame'],
        'desc' => ['ar' => 'مرآة دائرية بإطار نحاسي مصقول، تصميم عصري.', 'fr' => "Miroir rond à cadre en laiton poli, design moderne.", 'en' => 'Round mirror with a polished brass frame, a modern design.']],
    ['id' => 'p3', 'categoryId' => 'cat-decor', 'price' => 520, 'image' => '', 'featured' => true,
        'name' => ['ar' => 'مزهرية سيراميك مرسومة يدويا', 'fr' => 'Vase en céramique peint à la main', 'en' => 'Hand-painted Ceramic Vase'],
        'desc' => ['ar' => 'مزهرية من صناعة تقليدية، مرسومة يدويا.', 'fr' => 'Vase artisanal peint à la main.', 'en' => 'Handcrafted vase, hand-painted.']],
    ['id' => 'p4', 'categoryId' => 'cat-craft', 'price' => 650, 'image' => '', 'featured' => false,
        'name' => ['ar' => 'صندوق خشبي منحوت', 'fr' => 'Coffret en bois sculpté', 'en' => 'Carved Wooden Box'],
        'desc' => ['ar' => 'صندوق تقليدي منحوت يدويا من خشب الأرز.', 'fr' => "Coffret traditionnel en bois de cèdre sculpté à la main.", 'en' => 'Traditional box hand-carved from cedar wood.']],
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(read_json_file(PRODUCTS_FILE, $defaultProducts));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();
    require_valid_csrf();

    $body = json_input();
    $incoming = $body['products'] ?? null;
    if (!is_array($incoming)) respond(['error' => 'invalid_payload'], 400);
    if (count($incoming) > 2000) respond(['error' => 'too_many_items'], 400);

    $clean = [];
    foreach ($incoming as $p) {
        if (!is_array($p)) continue;
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($p['id'] ?? ''));
        if ($id === '') continue;

        $image = is_string($p['image'] ?? '') ? $p['image'] : '';
        if (strlen($image) > MAX_IMAGE_LEN) respond(['error' => 'image_too_large'], 400);
        // نسمحو غير بصور data: أو روابط https عادية، باش ما يتزادش أي سكريبت مكانها
        if ($image !== '' && !preg_match('#^data:image/(png|jpe?g|webp|svg\+xml);base64,#i', $image) && !preg_match('#^https://#i', $image)) {
            $image = '';
        }

        $clean[] = [
            'id'         => clean_text($id, 64),
            'categoryId' => clean_text(preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($p['categoryId'] ?? '')), 64),
            'price'      => is_numeric($p['price'] ?? null) ? round((float)$p['price'], 2) : 0,
            'image'      => $image,
            'featured'   => !empty($p['featured']),
            'name'       => [
                'ar' => clean_text($p['name']['ar'] ?? '', 150),
                'fr' => clean_text($p['name']['fr'] ?? '', 150),
                'en' => clean_text($p['name']['en'] ?? '', 150),
            ],
            'desc' => [
                'ar' => clean_text($p['desc']['ar'] ?? '', 2000),
                'fr' => clean_text($p['desc']['fr'] ?? '', 2000),
                'en' => clean_text($p['desc']['en'] ?? '', 2000),
            ],
        ];
    }

    write_json_file(PRODUCTS_FILE, $clean);
    respond(['ok' => true, 'products' => $clean]);
}

respond(['error' => 'method_not_allowed'], 405);
