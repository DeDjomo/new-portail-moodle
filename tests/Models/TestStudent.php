<?php

require_once 'config/database.php';
require_once 'src/Models/BaseModel.php';
require_once 'src/Models/Student.php';

use Models\Student;

echo "--- Testing Student Model ---\n";

$database = new Database();
$db = $database->getConnection();

$student = new Student($db);

// 1. Create Test
echo "1. Testing Create...\n";
$student->last_name = "Ndong";
$student->first_name = "Armand";
$student->email = "armand.ndong@test.com";
$student->password = password_hash("studentpass", PASSWORD_BCRYPT);
$student->major = "Génie Civil";
$student->level = "Licence 1";

if ($student->create()) {
    echo "SUCCESS: Student created with ID: " . $student->id . "\n";
} else {
    echo "FAILURE: Could not create student.\n";
    exit(1);
}

// 2. FindByEmail Test
echo "2. Testing FindByEmail...\n";
$found = $student->findByEmail("armand.ndong@test.com");
if ($found && $found['id'] == $student->id) {
    echo "SUCCESS: Found student by email.\n";
} else {
    echo "FAILURE: Could not find student by email.\n";
    exit(1);
}

// Cleanup
$student->delete($student->id);

echo "--- Student Model Tests Passed! ---\n";
