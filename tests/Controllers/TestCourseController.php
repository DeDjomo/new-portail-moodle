<?php

require_once 'config/database.php';
require_once 'src/Controllers/CourseController.php';

use Controllers\CourseController;

echo "--- Testing CourseController ---\n";

$database = new Database();
$db = $database->getConnection();
$controller = new CourseController($db);

$uniqueSuffix = uniqid();

// 1. Setup Dependencies
echo "1. Setup Dependencies (Admin, Instructor, Category)...\n";
$db->exec("INSERT INTO administrators (last_name, first_name, email, password_hash, type) VALUES ('Admin', 'Test', 'admin.course.$uniqueSuffix@test.com', 'hash', 'SUPER_ADMIN')");
$adminId = $db->lastInsertId();

$db->exec("INSERT INTO instructors (full_name) VALUES ('Instructor Test $uniqueSuffix')");
$instructorId = $db->lastInsertId();

$db->exec("INSERT INTO categories (name, slug) VALUES ('Category Test $uniqueSuffix', 'cat-test-$uniqueSuffix')");
$categoryId = $db->lastInsertId();

// 2. Test Create (Draft - Missing info)
echo "2. Testing Create (Draft - Expected)...\n";
$createData = [
    'administrator_id' => $adminId,
    'instructor_id' => $instructorId,
    'category_id' => $categoryId,
    'title' => "Course Draft Test $uniqueSuffix",
    'moodle_url' => 'http://moodle.test/course/1'
];
$res = $controller->create($createData);
if ($res['status'] === 'DRAFT') {
    echo "SUCCESS: Course created as DRAFT.\n";
    $courseId = $res['id'];
} else {
    echo "FAILURE: Course status was " . $res['status'] . " instead of DRAFT.\n";
    exit(1);
}

// 3. Test Update (JSON Array support)
echo "3. Testing Update (JSON and Stay DRAFT)...\n";
$updateData = [
    'pedagogical_objectives' => ['Learn PHP', 'Master SQL'],
    'target_audience' => 'Everyone', // Should be auto-wrapped in array
    'short_synopsis' => 'Short bio',
    'full_description' => 'Full bio',
    'level' => 'BEGINNER',
    'language' => 'FR',
    'format' => 'VIDEO',
    'total_duration_minutes' => 120
];
$res = $controller->update($courseId, $updateData);
if ($res['status'] === 'DRAFT') {
    echo "SUCCESS: Update processed, still DRAFT (no image).\n";
} else {
    echo "FAILURE: Unexpected status: " . $res['status'] . "\n";
    exit(1);
}

// Verify JSON decoding in Show
echo "4. Verifying JSON decoding in Show...\n";
$show = $controller->show($courseId);
if (is_array($show['pedagogical_objectives']) && count($show['pedagogical_objectives']) === 2) {
    echo "SUCCESS: Pedagogical objectives decoded correctly as array.\n";
} else {
    echo "FAILURE: JSON decoding failed.\n";
    print_r($show['pedagogical_objectives']);
    exit(1);
}

if (is_array($show['target_audience']) && $show['target_audience'][0] === 'Everyone') {
    echo "SUCCESS: Target audience auto-wrapped and decoded correctly.\n";
} else {
    echo "FAILURE: Auto-wrapping failed.\n";
    exit(1);
}

// Cleanup
$db->exec("DELETE FROM courses WHERE id = $courseId");
$db->exec("DELETE FROM administrators WHERE id = $adminId");
$db->exec("DELETE FROM instructors WHERE id = $instructorId");
$db->exec("DELETE FROM categories WHERE id = $categoryId");

echo "--- CourseController Logic Verified! ---\n";
