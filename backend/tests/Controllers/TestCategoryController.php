<?php

require_once 'config/database.php';
require_once 'src/Controllers/CategoryController.php';

use Controllers\CategoryController;

echo "--- Testing CategoryController ---\n";

$database = new Database();
$db = $database->getConnection();
$controller = new CategoryController($db);

// 1. Test Create Parent
echo "1. Testing Create Parent Category...\n";
$createData = [
    'name' => 'Architecture Logicielle',
    'description' => 'Tout sur l\'architecture des systèmes.'
];
$res = $controller->create($createData);
if (isset($res['id'])) {
    echo "SUCCESS: Parent created ID: " . $res['id'] . " Slug: " . $res['slug'] . "\n";
    $parentId = $res['id'];
} else {
    echo "FAILURE: Parent not created.\n";
    print_r($res);
    exit(1);
}

// 2. Test Create Subcategory
echo "2. Testing Create Subcategory...\n";
$subData = [
    'name' => 'Microservices',
    'parent_id' => $parentId
];
$res = $controller->create($subData);
if (isset($res['id']) && $res['slug'] === 'microservices') {
    echo "SUCCESS: Subcategory created ID: " . $res['id'] . "\n";
    $subId = $res['id'];
} else {
    echo "FAILURE: Subcategory not created correctly.\n";
    exit(1);
}

// 3. Test Show with Subcategories
echo "3. Testing Show (Hierarchy)...\n";
$res = $controller->show($parentId);
if (count($res['subcategories']) > 0) {
    echo "SUCCESS: Subcategories detected in parent details.\n";
} else {
    echo "FAILURE: No subcategories found for parent.\n";
    exit(1);
}

// 4. Test Update (Parent check)
echo "4. Testing Update (Self-Parenting check)...\n";
$updateData = ['parent_id' => $parentId];
$res = $controller->update($parentId, $updateData);
if ($res['message'] === 'A category cannot be its own parent') {
    echo "SUCCESS: Self-parenting blocked.\n";
} else {
    echo "FAILURE: Self-parenting not blocked.\n";
    exit(1);
}

// 5. Test Delete
echo "5. Testing Soft Delete...\n";
$res = $controller->delete($subId);
if ($res['message'] === 'Category deleted successfully') {
    $resShow = $controller->show($subId);
    if ($resShow['message'] === 'Category not found') {
        echo "SUCCESS: Soft delete verified.\n";
    } else {
        echo "FAILURE: Still visible after delete.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Delete failed.\n";
    exit(1);
}

// Cleanup
$db->exec("DELETE FROM categories WHERE id IN ($parentId, $subId)");

echo "--- CategoryController Tests Passed! ---\n";
