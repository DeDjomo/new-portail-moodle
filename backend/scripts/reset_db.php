<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Resetting database...\n";

    // Disable Foreign Key Checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");

    // Truncate Tables
    $tables = [
        'enrollments',
        'courses',
        'students',
        'categories',
        'instructors',
        'administrators'
    ];

    foreach ($tables as $table) {
        $db->exec("TRUNCATE TABLE `$table`");
        echo "Truncated table: $table\n";
    }

    // Enable Foreign Key Checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Create Super Admin
    $password = "password123";
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    $sql = "INSERT INTO administrators (first_name, last_name, email, password_hash, type, status) VALUES (:first_name, :last_name, :email, :password_hash, :type, :status)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':first_name' => 'Super',
        ':last_name' => 'Admin',
        ':email' => 'superadmin@portailmoodle.cm',
        ':password_hash' => $hashed_password,
        ':type' => 'SUPER_ADMIN',
        ':status' => 'ACTIVE'
    ]);

    echo "Super Admin created successfully.\n";
    echo "Email: superadmin@portailmoodle.cm\n";
    echo "Password: password123\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
