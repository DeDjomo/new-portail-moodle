<?php

require_once __DIR__ . '/../config/database.php';

echo "--- Seeding Database ---\n";

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo "FAILURE: Could not connect to database.\n";
    exit(1);
}

$sqlFile = __DIR__ . '/../sql/seed_database.sql';
if (!file_exists($sqlFile)) {
    echo "FAILURE: SQL file not found at $sqlFile\n";
    exit(1);
}

$sql = file_get_contents($sqlFile);

try {
    // Note: PDO exec() doesn't handle multiple statements well if there are variables like SET @var.
    // However, for this seed script, it might work if we split by semicolon or use a multi-statement approach.
    // Given the complexity of the seed script with variables, splitting carefully is better.
    
    // Simple approach: execute as one block if supported by the driver, or use a loop.
    $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, 0); 
    $db->exec($sql);
    echo "SUCCESS: Database seeded successfully.\n";
} catch (PDOException $e) {
    echo "FAILURE: Seeding failed: " . $e->getMessage() . "\n";
}

echo "--- Seeding Complete ---\n";
