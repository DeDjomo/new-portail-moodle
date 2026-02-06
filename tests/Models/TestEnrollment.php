<?php

require_once 'config/database.php';
require_once 'src/Models/BaseModel.php';
require_once 'src/Models/Student.php';
require_once 'src/Models/Administrator.php';
require_once 'src/Models/Instructor.php';
require_once 'src/Models/Category.php';
require_once 'src/Models/Course.php';
require_once 'src/Models/Enrollment.php';

use Models\Student;
use Models\Course;
use Models\Enrollment;
use Models\Administrator;
use Models\Instructor;
use Models\Category;

echo "--- Testing Enrollment Model ---\n";

$database = new Database();
$db = $database->getConnection();

// Setup Dependencies
$student = new Student($db);
$student->last_name = "EnrollStudent";
$student->first_name = "StudentFN";
$student->email = "enroll" . uniqid() . "@test.com";
$student->password = "pass";
$student->create();

$admin = new Administrator($db);
$admin->last_name = "EnrollAdmin";
$admin->first_name = "AdminFN";
$admin->email = "enrolladmin" . uniqid() . "@test.com";
$admin->password_hash = "hash";
$admin->type = "STANDARD_ADMIN";
$admin->status = "ACTIVE";
$admin->create();

$instructor = new Instructor($db);
$instructor->full_name = "EnrollInstructor";
$instructor->create();

$category = new Category($db);
$category->name = "EnrollCategory";
$category->slug = "enroll-cat";
$category->create();

$course = new Course($db);
$course->administrator_id = $admin->id;
$course->instructor_id = $instructor->id;
$course->category_id = $category->id;
$course->title = "Enroll Course";
$course->slug = "enroll-course";
$course->create();

$enrollment = new Enrollment($db);

// 1. Create Test
echo "1. Testing Create...\n";
$enrollment->student_id = $student->id;
$enrollment->course_id = $course->id;
$enrollment->status = "PENDING";

if ($enrollment->create()) {
    echo "SUCCESS: Enrollment created.\n";
} else {
    echo "FAILURE: Could not create enrollment.\n";
    exit(1);
}

// 2. Update Status Test
echo "2. Testing Update Status...\n";
if ($enrollment->updateStatus($student->id, $course->id, "DONE")) {
    echo "SUCCESS: Enrollment status updated.\n";
} else {
    echo "FAILURE: Could not update enrollment status.\n";
    exit(1);
}

// 3. Get By Course Test
echo "3. Testing GetByCourse...\n";
$stmt = $enrollment->getByCourse($course->id);
if ($stmt->rowCount() > 0) {
    echo "SUCCESS: Found enrollment by course.\n";
} else {
    echo "FAILURE: Could not find enrollment by course.\n";
    exit(1);
}

// Cleanup (Note: enrollments use student_id and course_id as PK, we delete via cascade or manual)
// For simplicity, we just delete dependencies and MySQL ON DELETE CASCADE takes care of it.
$course->delete($course->id);
$student->delete($student->id);
$category->delete($category->id);
$instructor->delete($instructor->id);
$admin->delete($admin->id);

echo "--- Enrollment Model Tests Passed! ---\n";
