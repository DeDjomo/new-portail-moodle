<?php

require_once 'config/database.php';
require_once 'src/Models/BaseModel.php';
require_once 'src/Models/Administrator.php';

use Models\Administrator;

echo "--- Testing Soft Delete (Logical Deletion) ---\n";

$database = new Database();
$db = $database->getConnection();

$admin = new Administrator($db);

// 1. Create a test admin
$admin->last_name = "Soft";
$admin->first_name = "Delete";
$admin->email = "soft.delete" . uniqid() . "@test.com";
$admin->password_hash = "hash";
$admin->type = "STANDARD_ADMIN";
$admin->status = "ACTIVE";

echo "1. Creating record...\n";
$admin->create();
$id = $admin->id;

// 2. Verify it exists
echo "2. Verifying existence via getById()...\n";
$found = $admin->getById($id);
if ($found) {
    echo "SUCCESS: Record found.\n";
} else {
    echo "FAILURE: Record not found.\n";
    exit(1);
}

// 3. Perform soft delete
echo "3. Performing soft delete...\n";
if ($admin->delete($id)) {
    echo "SUCCESS: delete() returned true.\n";
} else {
    echo "FAILURE: delete() returned false.\n";
    exit(1);
}

// 4. Verify invisibility via getById()
echo "4. Verifying record is INVISIBLE via getById()...\n";
$foundAfter = $admin->getById($id);
if (!$foundAfter) {
    echo "SUCCESS: Record is hidden (soft deleted).\n";
} else {
    echo "FAILURE: Record is still visible via getById()!\n";
    exit(1);
}

// 5. Verify visibility via raw SQL (it's still in the DB)
echo "5. Verifying record still exists in DB via raw SQL (Hard Check)...\n";
$stmt = $db->prepare("SELECT status FROM administrators WHERE id = ?");
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row && $row['status'] == 'DELETED') {
    echo "SUCCESS: Record exists in DB with status 'DELETED'.\n";
} else {
    echo "FAILURE: Record not found in DB or status incorrect.\n";
    exit(1);
}

// 6. Test getAll() filtering
echo "6. Testing getAll() filtering...\n";
$stmt = $admin->getAll();
$foundInAll = false;
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if ($r['id'] == $id) {
        $foundInAll = true;
        break;
    }
}

if (!$foundInAll) {
    echo "SUCCESS: Record not found in getAll() results.\n";
} else {
    echo "FAILURE: Record still returned by getAll()!\n";
    exit(1);
}

// Cleanup (Hard Delete)
echo "7. Cleaning up (Hard Delete)...\n";
$admin->hardDelete($id);

echo "--- Soft Delete Verification Passed! ---\n";
