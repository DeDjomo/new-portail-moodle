<?php

require_once 'config/database.php';
require_once 'src/Controllers/AdminController.php';

use Controllers\AdminController;

echo "--- Registering Real Administrator for Email Test ---\n";

$database = new Database();
$db = $database->getConnection();
$controller = new AdminController($db);

$data = [
    'last_name' => 'DeDjomo',
    'first_name' => 'Karlyn',
    'email' => 'dedjomokarlyn@gmail.com',
    'password' => 'PortalPass2026',
    'type' => 'SUPER_ADMIN',
    'status' => 'ACTIVE'
];

echo "Registering " . $data['email'] . "...\n";

// The create() method will trigger the email sending via EmailService
$res = $controller->create($data);

if (isset($res['id'])) {
    echo "SUCCESS: Administrator registered with ID: " . $res['id'] . "\n";
    echo "Check your inbox at " . $data['email'] . " for the welcome email!\n";
} else {
    echo "FAILURE: Could not register administrator.\n";
    print_r($res);
}

echo "--- Registration Complete ---\n";
