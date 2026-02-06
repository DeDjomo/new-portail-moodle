<?php

require_once 'config/database.php';
require_once 'src/Models/BaseModel.php';
require_once 'src/Models/Administrator.php';
require_once 'src/Models/Instructor.php';
require_once 'src/Models/Category.php';
require_once 'src/Models/Course.php';

use Models\Administrator;
use Models\Instructor;
use Models\Category;
use Models\Course;

echo "--- Testing Course Model ---\n";

$database = new Database();
$db = $database->getConnection();

// Setup Dependencies
$admin = new Administrator($db);
$admin->last_name = "CourseAdmin";
$admin->first_name = "AdminFN";
$admin->email = "courseadmin" . uniqid() . "@test.com"; // Use uniqid to avoid duplicate email errors if run multiple times
$admin->password_hash = "hash";
$admin->type = "STANDARD_ADMIN";
$admin->status = "ACTIVE";
$admin->create();

$instructor = new Instructor($db);
$instructor->full_name = "CourseInstructor";
$instructor->create();

$category = new Category($db);
$category->name = "CourseCategory";
$category->slug = "course-cat";
$category->create();

$course = new Course($db);

// 1. Create Test
echo "1. Testing Create...\n";
$course->administrator_id = $admin->id;
$course->instructor_id = $instructor->id;
$course->category_id = $category->id;
$course->title = "Test Course PHP";
$course->slug = "test-course-php";
$course->level = "BEGINNER";
$course->status = "PUBLISHED";

if ($course->create()) {
    echo "SUCCESS: Course created with ID: " . $course->id . "\n";
} else {
    echo "FAILURE: Could not create course.\n";
    exit(1);
}

// 2. Read Test
echo "2. Testing Read...\n";
$found = $course->getById($course->id);
if ($found && $found['title'] == "Test Course PHP") {
    echo "SUCCESS: Found course.\n";
} else {
    echo "FAILURE: Could not find course.\n";
    exit(1);
}

// Cleanup
$course->delete($course->id);
$category->delete($category->id);
$instructor->delete($instructor->id);
$admin->delete($admin->id);

echo "--- Course Model Tests Passed! ---\n";
