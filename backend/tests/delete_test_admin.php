<?php

require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Cleaning up test data for dedjomokarlyn@gmail.com...\n";

// 1. Get Admin ID
$stmt = $db->prepare("SELECT id FROM administrators WHERE email = 'dedjomokarlyn@gmail.com'");
$stmt->execute();
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin) {
    $adminId = $admin['id'];
    
    // 2. Delete enrollments related to courses of this admin
    $db->prepare("DELETE FROM enrollments WHERE course_id IN (SELECT id FROM courses WHERE administrator_id = ?)")
       ->execute([$adminId]);
       
    // 3. Delete courses of this admin
    $db->prepare("DELETE FROM courses WHERE administrator_id = ?")
       ->execute([$adminId]);
       
    // 4. Delete admin
    $db->prepare("DELETE FROM administrators WHERE id = ?")
       ->execute([$adminId]);
       
    echo "Cleanup successful.\n";
} else {
    echo "Admin not found, no cleanup needed.\n";
}
