<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'method_not_allowed'], 405);
}

if (is_admin()) {
    require_valid_csrf();
}

$_SESSION = [];
session_destroy();
respond(['ok' => true]);
