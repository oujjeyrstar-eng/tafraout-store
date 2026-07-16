<?php
/**
 * config.php — الإعدادات المشتركة لكل الـ API.
 * هادا الملف كيتقرا (require) فبداية كل ملف API آخر، ماشي كيتلوصل مباشرة من المتصفح.
 */

// ---------- إعدادات الجلسة (Session) قبل ما تبدا ----------
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '',
    'secure'   => $isHttps,   // الكوكي غادي تتصيفط غير عبر HTTPS إلا كان الموقع live بـ https
    'httponly' => true,       // JavaScript ما يقدرش يقرا الكوكي ديال الجلسة (يحمي من XSS يسرق الجلسة)
    'samesite' => 'Lax',
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
// موقعك فقط هو لي كيقدر يستعمل هاد الـ API (بدّل الدومين إلا خدمتي على دومين آخر أو حيدها فالتطوير المحلي)
header('X-Content-Type-Options: nosniff');

// ============================================================
// 1) كلمة سر الأدمين — مخزنة كـ HASH ماشي كنص عادي.
//    باش تبدل الكلمة السرية: خدم هاد الأمر فالـ terminal ديال السيرفر:
//      php -r "echo password_hash('كلمة_السر_ديالك', PASSWORD_DEFAULT);"
//    وحط النتيجة هنا مكان القيمة اللي تحت.
// ============================================================
const ADMIN_PASSWORD_HASH = '$2b$12$ckMw4I0wGNJHjZR41skJTuA9.xslq1cJC8bi9uzwVX2FE4aEUepMK'; // القيمة الافتراضية = "tafraout2026" (بدلها!)

// ---------- مسارات ملفات البيانات (خارج مجلد الويب مباشرة، محميين بـ .htaccess) ----------
define('DATA_DIR', __DIR__ . '/../data');
define('CATEGORIES_FILE', DATA_DIR . '/categories.json');
define('PRODUCTS_FILE', DATA_DIR . '/products.json');
define('MESSAGES_FILE', DATA_DIR . '/messages.json');
define('LOGIN_THROTTLE_FILE', DATA_DIR . '/.login_throttle.json');
define('MSG_THROTTLE_FILE', DATA_DIR . '/.msg_throttle.json');

// ---------- أدوات مساعدة عامة ----------
function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_file(string $path, $default) {
    if (!file_exists($path)) return $default;
    $fh = fopen($path, 'r');
    if (!$fh) return $default;
    flock($fh, LOCK_SH);
    $content = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    $decoded = json_decode($content, true);
    return $decoded === null ? $default : $decoded;
}

function write_json_file(string $path, $data): void {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0770, true);
    $fh = fopen($path, 'c');
    if (!$fh) respond(['error' => 'storage_write_failed'], 500);
    flock($fh, LOCK_EX);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

// ---------- الجلسة / الصلاحية ----------
function is_admin(): bool {
    return !empty($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

function require_admin(): void {
    if (!is_admin()) {
        respond(['error' => 'unauthorized'], 401);
    }
}

// ---------- CSRF (يحمي من طلبات مزورة تجي من مواقع أخرى بواسطة الكوكي ديال الجلسة) ----------
function get_or_create_csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function require_valid_csrf(): void {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';
    if ($expected === '' || !hash_equals($expected, $sent)) {
        respond(['error' => 'invalid_csrf'], 403);
    }
}

// ---------- تنقية النصوص (دفاع إضافي من جهة السيرفر، حتى لو الواجهة كتنقي هي الأخرى) ----------
function clean_text($value, int $maxLen = 2000): string {
    if (!is_string($value)) return '';
    $value = str_replace(["\0"], '', $value);          // حيد أي byte خطير
    $value = trim($value);
    if (mb_strlen($value) > $maxLen) $value = mb_substr($value, 0, $maxLen);
    return $value;
}
