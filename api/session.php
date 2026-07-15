<?php
require __DIR__ . '/config.php';

respond([
    'loggedIn'  => is_admin(),
    'csrfToken' => get_or_create_csrf_token(),
]);
