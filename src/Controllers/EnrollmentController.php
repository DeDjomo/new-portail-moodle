<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Enrollment.php';
require_once __DIR__ . '/../Models/Course.php';
require_once __DIR__ . '/../Models/Student.php';

use Models\Enrollment;
use Models\Course;
use Models\Student;

/**
 * Controller for managing Course Enrollments.
 * Handles student enrollment and admin list exports.
 */
class EnrollmentController {
    private $db;
    private $enrollmentModel;
    private $courseModel;
    private $studentModel;

    public function __construct($db) {
        $this->db = $db;
        $this->enrollmentModel = new Enrollment($db);
        $this->courseModel = new Course($db);
        $this->studentModel = new Student($db);
    }

    /**
     * Enroll a student in a course
     */
    public function enroll($data) {
        // 1. Validation basics
        if (empty($data['student_id']) || empty($data['course_id'])) {
            return $this->jsonResponse(['message' => 'Student ID and Course ID are required'], 400);
        }

        $studentId = $data['student_id'];
        $courseId = $data['course_id'];

        // 2. Check existences
        $student = $this->studentModel->getById($studentId);
        if (!$student) {
            return $this->jsonResponse(['message' => 'Student not found'], 404);
        }

        $course = $this->courseModel->getById($courseId);
        if (!$course) {
            return $this->jsonResponse(['message' => 'Course not found'], 404);
        }

        // 3. Status check (Course must be published)
        if ($course['status'] !== 'PUBLISHED') {
            return $this->jsonResponse(['message' => 'Enrollment is only allowed for published courses'], 403);
        }

        // 4. Duplicate check
        if ($this->enrollmentModel->exists($studentId, $courseId)) {
            return $this->jsonResponse(['message' => 'Student is already enrolled in this course'], 409);
        }

        // 5. Create Enrollment
        $this->enrollmentModel->student_id = $studentId;
        $this->enrollmentModel->course_id = $courseId;
        $this->enrollmentModel->status = 'PENDING';

        if ($this->enrollmentModel->create()) {
            // 6. Post-enrollment actions
            $this->courseModel->incrementEnrollmentCount($courseId);
            
            // 7. Notification (Simulated)
            $this->notifyParties($student, $course);

            return $this->jsonResponse([
                'message' => 'Enrollment successful',
                'status' => 'PENDING'
            ], 201);
        }

        return $this->jsonResponse(['message' => 'Failed to process enrollment'], 500);
    }

    /**
     * Mark all pending enrollments of a course as DONE (Export action)
     */
    public function exportComplete($courseId) {
        $course = $this->courseModel->getById($courseId);
        if (!$course) {
            return $this->jsonResponse(['message' => 'Course not found'], 404);
        }

        if ($this->enrollmentModel->markAllAsDone($courseId)) {
            return $this->jsonResponse(['message' => 'All pending enrollments marked as DONE'], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to update enrollment statuses'], 500);
    }

    /**
     * Return enrollments for a specific course
     */
    public function getCourseEnrollments($courseId, $status = null) {
        $stmt = $this->enrollmentModel->getByCourse($courseId, $status);
        return $this->jsonResponse($stmt->fetchAll(\PDO::FETCH_ASSOC), 200);
    }

    /**
     * Simulated notification system
     */
    private function notifyParties($student, $course) {
        // In a real app, this would send an actual email.
        // For this project, we log the intent.
        error_log("Enrollment Notification: Student {$student['email']} enrolled in Course '{$course['title']}'.");
        error_log("Admin Notification: New enrollment for Course '{$course['title']}'.");
    }

    /**
     * Helper for JSON responses
     */
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        return $data;
    }
}
