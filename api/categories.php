<?php
require __DIR__ . '/config.php';

$defaultCategories = [
    ['id' => 'cat-lamps',   'color' => '#C1694F', 'icon' => '✦', 'name' => ['ar' => 'تريات وإنارة', 'fr' => 'Luminaires', 'en' => 'Lighting']],
    ['id' => 'cat-decor',   'color' => '#33506F', 'icon' => '◈', 'name' => ['ar' => 'ديكور المنزل', 'fr' => 'Décoration', 'en' => 'Home Decor']],
    ['id' => 'cat-mirrors', 'color' => '#B78A4A', 'icon' => '✺', 'name' => ['ar' => 'مرايا فاخرة', 'fr' => 'Miroirs', 'en' => 'Mirrors']],
    ['id' => 'cat-craft',   'color' => '#6B7A5E', 'icon' => '⬢', 'name' => ['ar' => 'صناعة تقليدية', 'fr' => 'Artisanat', 'en' => 'Craftsmanship']],
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(read_json_file(CATEGORIES_FILE, $defaultCategories));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();
    require_valid_csrf();

    $body = json_input();
    $incoming = $body['categories'] ?? null;
    if (!is_array($incoming)) respond(['error' => 'invalid_payload'], 400);
    if (count($incoming) > 200) respond(['error' => 'too_many_items'], 400);

    $clean = [];
    foreach ($incoming as $c) {
        if (!is_array($c)) continue;
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($c['id'] ?? ''));
        if ($id === '') continue;
        $clean[] = [
            'id'    => clean_text($id, 64),
            'color' => preg_match('/^#[0-9a-fA-F]{3,8}$/', $c['color'] ?? '') ? $c['color'] : '#C1694F',
            'icon'  => clean_text($c['icon'] ?? '✦', 8),
            'name'  => [
                'ar' => clean_text($c['name']['ar'] ?? '', 120),
                'fr' => clean_text($c['name']['fr'] ?? '', 120),
                'en' => clean_text($c['name']['en'] ?? '', 120),
            ],
        ];
    }

    write_json_file(CATEGORIES_FILE, $clean);
    respond(['ok' => true, 'categories' => $clean]);
}

respond(['error' => 'method_not_allowed'], 405);
