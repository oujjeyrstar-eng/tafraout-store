<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'method_not_allowed'], 405);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$throttle = read_json_file(LOGIN_THROTTLE_FILE, []);
$now = time();

// نمسحو المحاولات القديمة (أكثر من 15 دقيقة) باش الملف ما يكبرش بلا حساب
foreach ($throttle as $k => $entry) {
    if ($now - $entry['first'] > 900) unset($throttle[$k]);
}

$entry = $throttle[$ip] ?? ['count' => 0, 'first' => $now];

// إلا وصل 5 محاولات خاطئة، نمنعو أي محاولة جديدة لمدة 15 دقيقة
if ($entry['count'] >= 5 && ($now - $entry['first']) < 900) {
    respond(['ok' => false, 'error' => 'too_many_attempts'], 429);
}

$body = json_input();
$password = is_string($body['password'] ?? null) ? $body['password'] : '';

if ($password !== '' && password_verify($password, ADMIN_PASSWORD_HASH)) {
    // نجح الدخول: نصفّيو محاولات هاد الـ IP، ونبدلو session id باش نمنعو session fixation
    unset($throttle[$ip]);
    write_json_file(LOGIN_THROTTLE_FILE, $throttle);

    session_regenerate_id(true);
    $_SESSION['is_admin'] = true;
    respond(['ok' => true, 'csrfToken' => get_or_create_csrf_token()]);
}

// فشلت المحاولة: نزيدو العداد
$entry['count'] = ($entry['count'] ?? 0) + 1;
if (!isset($throttle[$ip])) $entry['first'] = $now;
$throttle[$ip] = $entry;
write_json_file(LOGIN_THROTTLE_FILE, $throttle);

respond(['ok' => false, 'error' => 'wrong_password'], 401);
