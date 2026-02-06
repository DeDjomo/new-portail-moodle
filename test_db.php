<?php
require_once 'config/database.php';

echo "Testing connection...\n";

$database = new Database();
// Temporarily override db_name to check connection only, or catch the specific error
// But the class is hardcoded. Let's just try and see the error message.

try {
    $conn = $database->getConnection();
    if ($conn) {
        echo "Successfully connected to the database 'portal_db'.\n";
    } else {
        echo "Failed to connect (conn is null).\n";
    }
} catch (Exception $e) {
    echo "Exception caught: " . $e->getMessage() . "\n";
}
