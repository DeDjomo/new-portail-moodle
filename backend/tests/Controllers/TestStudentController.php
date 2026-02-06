<?php

require_once 'config/database.php';
require_once 'src/Controllers/StudentController.php';

use Controllers\StudentController;

echo "--- Testing StudentController ---\n";

$database = new Database();
$db = $database->getConnection();
$controller = new StudentController($db);

$uniqueSuffix = uniqid();
$email = "student.$uniqueSuffix@test.com";

// 1. Test Registration
echo "1. Testing Registration...\n";
$regData = [
    'last_name' => 'Nnanga',
    'first_name' => 'Boris',
    'email' => $email,
    'password' => 'secret123',
    'major' => 'Computer Science',
    'level' => 'Master 1'
];
$res = $controller->create($regData);
if (isset($res['id'])) {
    echo "SUCCESS: Student registered ID: " . $res['id'] . "\n";
    $studentId = $res['id'];
} else {
    echo "FAILURE: Registration failed.\n";
    print_r($res);
    exit(1);
}

// 2. Test Login
echo "2. Testing Login...\n";
$loginData = [
    'email' => $email,
    'password' => 'secret123'
];
$res = $controller->login($loginData);
if (isset($res['student']) && $res['message'] === 'Login successful') {
    echo "SUCCESS: Login successful.\n";
} else {
    echo "FAILURE: Login failed.\n";
    print_r($res);
    exit(1);
}

// 3. Test Show
echo "3. Testing Show (and password masking)...\n";
$res = $controller->show($studentId);
if (isset($res['last_name']) && !isset($res['password'])) {
    echo "SUCCESS: Details returned and password hidden.\n";
} else {
    echo "FAILURE: Detail check failed.\n";
    exit(1);
}

// 4. Test Update
echo "4. Testing Update...\n";
$updateData = ['phone' => '+237 600 000 000'];
$res = $controller->update($studentId, $updateData);
if ($res['message'] === 'Profile updated successfully') {
    $updated = $controller->show($studentId);
    if ($updated['phone'] === '+237 600 000 000') {
        echo "SUCCESS: Profile update verified.\n";
    } else {
        echo "FAILURE: Update mismatch.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Update call failed.\n";
    exit(1);
}

// 5. Test Delete
echo "5. Testing Soft Delete...\n";
$res = $controller->delete($studentId);
if ($res['message'] === 'Account deleted successfully') {
    $resShow = $controller->show($studentId);
    if ($resShow['message'] === 'Student not found') {
        echo "SUCCESS: Soft delete verified.\n";
    } else {
        echo "FAILURE: Still visible after delete.\n";
        exit(1);
    }
}

// Cleanup
$db->exec("DELETE FROM students WHERE id = $studentId");

echo "--- StudentController Tests Passed! ---\n";
