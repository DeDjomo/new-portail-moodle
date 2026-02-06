<?php

require_once 'config/database.php';
require_once 'src/Controllers/CourseController.php';
require_once 'src/Controllers/StudentController.php';
require_once 'src/Controllers/EnrollmentController.php';

use Controllers\CourseController;
use Controllers\StudentController;
use Controllers\EnrollmentController;

echo "--- Testing Enrollment Email Notification Flow ---\n";

$database = new Database();
$db = $database->getConnection();

$courseCtrl = new CourseController($db);
$studentCtrl = new StudentController($db);
$enrollCtrl = new EnrollmentController($db);

// 1. Get Admin ID (dedjomokarlyn@gmail.com should be ID 11 from previous step)
$stmt = $db->prepare("SELECT id FROM administrators WHERE email = 'dedjomokarlyn@gmail.com'");
$stmt->execute();
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    echo "FAILURE: Admin dedjomokarlyn@gmail.com not found.\n";
    exit(1);
}
$adminId = $admin['id'];
echo "Found Admin ID: $adminId\n";

// 2. Ensure we have an instructor and category (for simplicity, using IDs from previous tests or creating new)
$db->exec("INSERT IGNORE INTO instructors (id, full_name) VALUES (100, 'Test Instructor Email')");
$db->exec("INSERT IGNORE INTO categories (id, name, slug) VALUES (100, 'Test Category Email', 'test-cat-email')");

// 3. Create a Published Course for this Admin
echo "Creating Published Course...\n";
$courseData = [
    'administrator_id' => $adminId,
    'instructor_id' => 100,
    'category_id' => 100,
    'title' => 'Mastering AI Automation',
    'short_synopsis' => 'A comprehensive guide to AI agents.',
    'moodle_url' => 'http://moodle.test/ai-mastery',
    'status' => 'PUBLISHED',
    'image_url' => 'https://example.com/ai.png'
];
// We manually insert to ensure it's PUBLISHED even if mandatory fields are missing for the controller
$db->prepare("INSERT INTO courses (administrator_id, instructor_id, category_id, title, slug, status, image_url, moodle_url) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
   ->execute([
       $courseData['administrator_id'], 
       $courseData['instructor_id'], 
       $courseData['category_id'], 
       $courseData['title'], 
       'mastering-ai-automation-' . uniqid(), 
       'PUBLISHED', 
       $courseData['image_url'], 
       $courseData['moodle_url']
   ]);
$courseId = $db->lastInsertId();
echo "Course Created ID: $courseId\n";

// 4. Create a Student
echo "Creating Student...\n";
$studentData = [
    'last_name' => 'John',
    'first_name' => 'Tester',
    'email' => 'student.tester.' . uniqid() . '@test.com',
    'password' => 'pass123'
];
$resStudent = $studentCtrl->create($studentData);
$studentId = $resStudent['id'];
echo "Student Created ID: $studentId\n";

// 5. Enroll Student into Course (This should trigger the email to Admin)
echo "Enrolling Student (Triggering Email to $adminId)...\n";
$enrollData = [
    'student_id' => $studentId,
    'course_id' => $courseId
];
$resEnroll = $enrollCtrl->enroll($enrollData);

if (isset($resEnroll['message']) && $resEnroll['message'] === 'Enrollment successful') {
    echo "SUCCESS: Student enrolled! Admin dedjomokarlyn@gmail.com should receive a notification email.\n";
} else {
    echo "FAILURE: Enrollment failed.\n";
    print_r($resEnroll);
}

echo "--- Flow Complete ---\n";
