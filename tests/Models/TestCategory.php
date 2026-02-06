<?php

require_once 'config/database.php';
require_once 'src/Models/BaseModel.php';
require_once 'src/Models/Category.php';

use Models\Category;

echo "--- Testing Category Model ---\n";

$database = new Database();
$db = $database->getConnection();

$category = new Category($db);

// 1. Create Parent Category
echo "1. Testing Create (Parent)...\n";
$category->name = "Développement Mobile";
$category->slug = "dev-mobile";
$category->description = "Cours sur Android, iOS, Flutter...";

if ($category->create()) {
    $parentId = $category->id;
    echo "SUCCESS: Parent Category created ID: $parentId\n";
} else {
    echo "FAILURE: Could not create parent category.\n";
    exit(1);
}

// 2. Create Subcategory
echo "2. Testing Create (Subcategory)...\n";
$subcat = new Category($db);
$subcat->name = "Flutter";
$subcat->slug = "flutter";
$subcat->parent_id = $parentId;

if ($subcat->create()) {
    echo "SUCCESS: Subcategory created ID: " . $subcat->id . "\n";
} else {
    echo "FAILURE: Could not create subcategory.\n";
    exit(1);
}

// 3. Testing GetSubcategories
echo "3. Testing GetSubcategories...\n";
$stmt = $category->getSubcategories($parentId);
$count = $stmt->rowCount();
if ($count > 0) {
    echo "SUCCESS: Found $count subcategories for parent $parentId.\n";
} else {
    echo "FAILURE: Subcategories not found.\n";
    exit(1);
}

// Cleanup
$subcat->delete($subcat->id);
$category->delete($parentId);

echo "--- Category Model Tests Passed! ---\n";
