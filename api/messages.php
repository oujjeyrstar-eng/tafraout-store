<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_admin();
    respond(read_json_file(MESSAGES_FILE, []));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // فورمولير "تواصل معنا" مفتوح لأي زائر (ماشي محتاج تسجيل دخول)، فخاصنا نراقبو السپام والحجم
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $throttle = read_json_file(MSG_THROTTLE_FILE, []);
    $now = time();
    foreach ($throttle as $k => $entry) {
        if ($now - $entry['first'] > 600) unset($throttle[$k]);
    }
    $entry = $throttle[$ip] ?? ['count' => 0, 'first' => $now];
    if ($entry['count'] >= 5 && ($now - $entry['first']) < 600) {
        respond(['ok' => false, 'error' => 'too_many_messages'], 429);
    }

    $body = json_input();

    // حقل "مصيدة" (honeypot) خفي فالفورمولير: أي بوت كيعمر الحقول الكل غادي يعمر هادشي، إنسان عادي لا
    if (!empty($body['website'])) {
        respond(['ok' => true]); // كنردو نجاح مزيف باش البوت ما يعاودش يحاول
    }

    $name = clean_text($body['name'] ?? '', 100);
    $phone = clean_text($body['phone'] ?? '', 30);
    $message = clean_text($body['message'] ?? '', 1500);

    if ($name === '' || $phone === '' || $message === '') {
        respond(['ok' => false, 'error' => 'missing_fields'], 400);
    }

    $messages = read_json_file(MESSAGES_FILE, []);
    array_unshift($messages, [
        'id'      => 'm' . $now . bin2hex(random_bytes(3)),
        'name'    => $name,
        'phone'   => $phone,
        'message' => $message,
        'date'    => date('c'),
    ]);
    if (count($messages) > 1000) $messages = array_slice($messages, 0, 1000);
    write_json_file(MESSAGES_FILE, $messages);

    $entry['count'] = ($entry['count'] ?? 0) + 1;
    if (!isset($throttle[$ip])) $entry['first'] = $now;
    $throttle[$ip] = $entry;
    write_json_file(MSG_THROTTLE_FILE, $throttle);

    respond(['ok' => true]);
}

respond(['error' => 'method_not_allowed'], 405);
