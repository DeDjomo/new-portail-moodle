<?php
require_once __DIR__ . '/../config/database.php';

// use Config\Database; // Database is in global namespace

$database = new Database();
$db = $database->getConnection();

try {
    // Check if column exists
    $checkQuery = "SHOW COLUMNS FROM categories LIKE 'parent_id'";
    $stmt = $db->prepare($checkQuery);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        echo "Column 'parent_id' does not exist. Adding it...\n";
        $alterQuery = "ALTER TABLE categories ADD COLUMN parent_id INT NULL DEFAULT NULL AFTER description";
        $db->exec($alterQuery);
        
        // Add Foreign Key constraint for integrity
        $fkQuery = "ALTER TABLE categories ADD CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL";
        $db->exec($fkQuery);
        
        echo "Column 'parent_id' added successfully.\n";
    } else {
        echo "Column 'parent_id' already exists.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
