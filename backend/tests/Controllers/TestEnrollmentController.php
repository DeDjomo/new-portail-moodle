<?php

require_once 'config/database.php';
require_once 'src/Controllers/EnrollmentController.php';
require_once 'src/Controllers/CourseController.php'; // For setup
require_once 'src/Controllers/StudentController.php'; // For setup

use Controllers\EnrollmentController;
use Controllers\CourseController;
use Controllers\StudentController;

echo "--- Testing EnrollmentController ---\n";

$database = new Database();
$db = $database->getConnection();
$enrollController = new EnrollmentController($db);
$courseController = new CourseController($db);
$studentController = new StudentController($db);

$uniqueSuffix = uniqid();

// 1. Setup Dependencies
echo "1. Setup Dependencies...\n";
// Create Admin
$db->exec("INSERT INTO administrators (last_name, first_name, email, password_hash, type) VALUES ('Admin', 'Enroll', 'admin.enroll.$uniqueSuffix@test.com', 'hash', 'SUPER_ADMIN')");
$adminId = $db->lastInsertId();

// Create Instructor
$db->exec("INSERT INTO instructors (full_name) VALUES ('Instructor Enroll $uniqueSuffix')");
$instructorId = $db->lastInsertId();

// Create Category
$db->exec("INSERT INTO categories (name, slug) VALUES ('Category Enroll $uniqueSuffix', 'cat-enroll-$uniqueSuffix')");
$categoryId = $db->lastInsertId();

// Create Published Course
$db->exec("INSERT INTO courses (administrator_id, instructor_id, category_id, title, slug, status, image_url, moodle_url) 
          VALUES ($adminId, $instructorId, $categoryId, 'Course Enroll Test', 'course-enroll-$uniqueSuffix', 'PUBLISHED', 'img.png', 'http://moodle/1')");
$courseId = $db->lastInsertId();

// Create Student
$resReg = $studentController->create([
    'last_name' => 'Student',
    'first_name' => 'Enroll',
    'email' => "student.enroll.$uniqueSuffix@test.com",
    'password' => 'secret'
]);
$studentId = $resReg['id'];

// 2. Test Success Enrollment
echo "2. Testing Success Enrollment...\n";
$res = $enrollController->enroll(['student_id' => $studentId, 'course_id' => $courseId]);
if (isset($res['status']) && $res['status'] === 'PENDING' && $res['message'] === 'Enrollment successful') {
    echo "SUCCESS: Student enrolled as PENDING.\n";
} else {
    echo "FAILURE: Enrollment failed.\n";
    print_r($res);
    exit(1);
}

// 3. Check Course Increment
echo "3. Verifying Course Record Increment...\n";
$courseData = $courseController->show($courseId);
if (isset($courseData['enrolled_count']) && $courseData['enrolled_count'] == 1) {
    echo "SUCCESS: Course enrolled_count is 1.\n";
} else {
    echo "FAILURE: Count mismatch: " . ($courseData['enrolled_count'] ?? 'N/A') . "\n";
    exit(1);
}

// 4. Test Duplicate
echo "4. Testing Duplicate Enrollment (Expect Failure)...\n";
$res = $enrollController->enroll(['student_id' => $studentId, 'course_id' => $courseId]);
if (isset($res['message']) && strpos($res['message'], 'already enrolled') !== false) {
    echo "SUCCESS: Duplicate blocked correctly.\n";
} else {
    echo "FAILURE: Duplicate not blocked correctly.\n";
    exit(1);
}

// 5. Test Export/Mark Done
echo "5. Testing Export (Mark as DONE)...\n";
$res = $enrollController->exportComplete($courseId);
if (isset($res['message']) && $res['message'] === 'All pending enrollments marked as DONE') {
    $enrolls = $enrollController->getCourseEnrollments($courseId);
    if (isset($enrolls[0]['status']) && $enrolls[0]['status'] === 'DONE') {
        echo "SUCCESS: Enrollment status transitioned to DONE.\n";
    } else {
        echo "FAILURE: Status transition failed.\n";
        exit(1);
    }
} else {
    echo "FAILURE: Export call failed.\n";
    exit(1);
}

// Cleanup
$db->exec("DELETE FROM enrollments WHERE course_id = $courseId");
$db->exec("DELETE FROM courses WHERE id = $courseId");
$db->exec("DELETE FROM students WHERE id = $studentId");
$db->exec("DELETE FROM administrators WHERE id = $adminId");
$db->exec("DELETE FROM instructors WHERE id = $instructorId");
$db->exec("DELETE FROM categories WHERE id = $categoryId");

echo "--- EnrollmentController Tests Passed! ---\n";
