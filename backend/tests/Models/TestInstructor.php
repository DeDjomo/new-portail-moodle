<?php

require_once 'config/database.php';
require_once 'src/Models/BaseModel.php';
require_once 'src/Models/Instructor.php';

use Models\Instructor;

echo "--- Testing Instructor Model ---\n";

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed.\n");
}

$instructor = new Instructor($db);

// 1. Create Test
echo "1. Testing Create...\n";
$instructor->full_name = "Pr. Jean-Bosco Talla";
$instructor->professional_title = "Doyen de la Faculté des Sciences";
$instructor->organization = "Université de Dschang";
$instructor->short_bio = "Expert en mathématiques appliquées.";

if ($instructor->create()) {
    echo "SUCCESS: Instructor created with ID: " . $instructor->id . "\n";
} else {
    echo "FAILURE: Could not create instructor.\n";
    exit(1);
}

// 2. Read Test
echo "2. Testing Read...\n";
$found = $instructor->getById($instructor->id);
if ($found && $found['full_name'] == "Pr. Jean-Bosco Talla") {
    echo "SUCCESS: Found instructor: " . $found['full_name'] . "\n";
} else {
    echo "FAILURE: Could not find instructor.\n";
    exit(1);
}

// 3. Delete Test
echo "3. Testing Delete...\n";
if ($instructor->delete($instructor->id)) {
    echo "SUCCESS: Instructor deleted.\n";
} else {
    echo "FAILURE: Could not delete instructor.\n";
    exit(1);
}

echo "--- Instructor Model Tests Passed! ---\n";
