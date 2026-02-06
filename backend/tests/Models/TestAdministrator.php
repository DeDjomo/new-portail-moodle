<?php

require_once 'config/database.php';
require_once 'src/Models/BaseModel.php';
require_once 'src/Models/Administrator.php';

use Models\Administrator;

echo "--- Testing Administrator Model ---\n";

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed.\n");
}

$admin = new Administrator($db);

// 1. Create Test
echo "1. Testing Create...\n";
$admin->last_name = "Tagnang";
$admin->first_name = "Hervé";
$admin->email = "herve.tagnang@test.com";
$admin->password_hash = password_hash("password123", PASSWORD_BCRYPT);
$admin->type = "STANDARD_ADMIN";
$admin->status = "ACTIVE";
$admin->phone = "677123456";

if ($admin->create()) {
    echo "SUCCESS: Administrator created with ID: " . $admin->id . "\n";
} else {
    echo "FAILURE: Could not create administrator.\n";
    exit(1);
}

// 2. Read Test
echo "2. Testing Read (GetById)...\n";
$foundAdmin = $admin->getById($admin->id);
if ($foundAdmin && $foundAdmin['last_name'] == "Tagnang") {
    echo "SUCCESS: Found administrator: " . $foundAdmin['first_name'] . " " . $foundAdmin['last_name'] . "\n";
} else {
    echo "FAILURE: Could not find administrator or name mismatch.\n";
    exit(1);
}

// 3. Update Test
echo "3. Testing Update...\n";
$admin->first_name = "Hervé Updated";
if ($admin->update()) {
    $updatedAdmin = $admin->getById($admin->id);
    if ($updatedAdmin['first_name'] == "Hervé Updated") {
        echo "SUCCESS: Administrator updated.\n";
    } else {
        echo "FAILURE: Update verification failed.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Could not update administrator.\n";
    exit(1);
}

// 4. Delete Test
echo "4. Testing Delete...\n";
if ($admin->delete($admin->id)) {
    $deletedAdmin = $admin->getById($admin->id);
    if (!$deletedAdmin) {
        echo "SUCCESS: Administrator deleted.\n";
    } else {
        echo "FAILURE: Administrator still exists after delete.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Could not delete administrator.\n";
    exit(1);
}

echo "--- Administrator Model Tests Passed! ---\n";
