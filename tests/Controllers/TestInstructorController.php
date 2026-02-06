<?php

require_once 'config/database.php';
require_once 'src/Controllers/InstructorController.php';

use Controllers\InstructorController;

echo "--- Testing InstructorController ---\n";

$database = new Database();
$db = $database->getConnection();
$controller = new InstructorController($db);

// 1. Test Create
echo "1. Testing Create...\n";
$createData = [
    'full_name' => 'Jean-Paul Kamga',
    'professional_title' => 'Senior Developer',
    'organization' => 'Tech Cameroon',
    'short_bio' => 'Experienced developer with 10 years in the field.'
];
$res = $controller->create($createData);
if (isset($res['id'])) {
    echo "SUCCESS: Instructor created ID: " . $res['id'] . "\n";
    $instructorId = $res['id'];
} else {
    echo "FAILURE: Instructor not created.\n";
    print_r($res);
    exit(1);
}

// 2. Test Show
echo "2. Testing Show...\n";
$res = $controller->show($instructorId);
if ($res['full_name'] === 'Jean-Paul Kamga') {
    echo "SUCCESS: Show returned correct data.\n";
} else {
    echo "FAILURE: Show returned incorrect data.\n";
    exit(1);
}

// 3. Test Update
echo "3. Testing Update...\n";
$updateData = ['full_name' => 'Jean-Paul Kamga Updated', 'organization' => 'Updated Org'];
$res = $controller->update($instructorId, $updateData);
if ($res['message'] === 'Instructor updated successfully') {
    $updated = $controller->show($instructorId);
    if ($updated['full_name'] === 'Jean-Paul Kamga Updated' && $updated['organization'] === 'Updated Org') {
        echo "SUCCESS: Update verified.\n";
    } else {
        echo "FAILURE: Update data mismatch.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Update call failed.\n";
    exit(1);
}

// 4. Test Index
echo "4. Testing Index...\n";
$res = $controller->index();
if (is_array($res) && count($res) > 0) {
    echo "SUCCESS: Index returned list of instructors.\n";
} else {
    echo "FAILURE: Index failed or returned empty.\n";
    exit(1);
}

// 5. Test Delete (Soft Delete)
echo "5. Testing Soft Delete...\n";
$res = $controller->delete($instructorId);
if ($res['message'] === 'Instructor deleted successfully') {
    $resShow = $controller->show($instructorId);
    if ($resShow['message'] === 'Instructor not found') {
        echo "SUCCESS: Soft delete verified.\n";
    } else {
        echo "FAILURE: Instructor still visible after delete.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Delete call failed.\n";
    exit(1);
}

// Cleanup
$stmt = $db->prepare("DELETE FROM instructors WHERE id = ?");
$stmt->execute([$instructorId]);

echo "--- InstructorController Tests Passed! ---\n";
