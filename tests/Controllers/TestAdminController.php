<?php

require_once 'config/database.php';
require_once 'src/Controllers/AdminController.php';

use Controllers\AdminController;

echo "--- Testing AdminController ---\n";

$database = new Database();
$db = $database->getConnection();
$controller = new AdminController($db);

$testEmail = "controller.test" . uniqid() . "@test.com";

// 1. Test Create
echo "1. Testing Create...\n";
$createData = [
    'last_name' => 'Controller',
    'first_name' => 'Test',
    'email' => $testEmail,
    'password' => 'admin123',
    'type' => 'STANDARD_ADMIN',
    'phone' => '123456789'
];
$res = $controller->create($createData);
if (isset($res['id'])) {
    echo "SUCCESS: Admin created ID: " . $res['id'] . "\n";
    $adminId = $res['id'];
} else {
    echo "FAILURE: Admin not created.\n";
    print_r($res);
    exit(1);
}

// 2. Test Login (Success)
echo "2. Testing Login (Success)...\n";
$loginData = ['email' => $testEmail, 'password' => 'admin123'];
$res = $controller->login($loginData);
if ($res['message'] === 'Login successful') {
    echo "SUCCESS: Login worked.\n";
} else {
    echo "FAILURE: Login failed.\n";
    exit(1);
}

// 3. Test Login (Failure)
echo "3. Testing Login (Failure)...\n";
$failData = ['email' => $testEmail, 'password' => 'wrongpass'];
$res = $controller->login($failData);
if ($res['message'] === 'Invalid credentials') {
    echo "SUCCESS: Login fail detected.\n";
} else {
    echo "FAILURE: Login fail not detected.\n";
    exit(1);
}

// 4. Test Update
echo "4. Testing Update...\n";
$updateData = ['first_name' => 'Test Updated', 'phone' => '987654321'];
$res = $controller->update($adminId, $updateData);
if ($res['message'] === 'Administrator updated successfully') {
    $updated = $controller->show($adminId);
    if ($updated['first_name'] === 'Test Updated') {
        echo "SUCCESS: Update verified.\n";
    } else {
        echo "FAILURE: Data not updated correctly.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Update call failed.\n";
    exit(1);
}

// 5. Test Delete (Soft Delete)
echo "5. Testing Soft Delete...\n";
$res = $controller->delete($adminId);
if ($res['message'] === 'Administrator deleted successfully') {
    $resShow = $controller->show($adminId);
    if ($resShow['message'] === 'Administrator not found') {
        echo "SUCCESS: Soft delete verified (invisible via show).\n";
    } else {
        echo "FAILURE: Record still visible after soft delete.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Delete call failed.\n";
    exit(1);
}

// Cleanup (Hard Delete)
$stmt = $db->prepare("DELETE FROM administrators WHERE id = ?");
$stmt->execute([$adminId]);

echo "--- AdminController Tests Passed! ---\n";
