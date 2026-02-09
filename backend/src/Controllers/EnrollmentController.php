<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Enrollment.php';
require_once __DIR__ . '/../Models/Course.php';
require_once __DIR__ . '/../Models/Student.php';
require_once __DIR__ . '/../Models/Administrator.php';
require_once __DIR__ . '/../Utils/EmailService.php';

use Models\Enrollment;
use Models\Course;
use Models\Student;
use Models\Administrator;
use Utils\EmailService;

/**
 * Controller for managing Course Enrollments.
 * Handles student enrollment and admin list exports.
 */
class EnrollmentController {
    private $db;
    private $enrollmentModel;
    private $courseModel;
    private $studentModel;
    private $adminModel;
    private $emailService;

    public function __construct($db) {
        $this->db = $db;
        $this->enrollmentModel = new Enrollment($db);
        $this->courseModel = new Course($db);
        $this->studentModel = new Student($db);
        $this->adminModel = new Administrator($db);
        $this->emailService = new EmailService();
    }

    /**
     * Enroll a student in a course
     */
    public function enroll($data) {
        // 1. Validation basics
        if (empty($data['email']) || empty($data['course_id'])) {
            return $this->jsonResponse(['message' => 'Email and Course ID are required'], 400);
        }

        $email = $data['email'];
        $courseId = $data['course_id'];

        // 2. Check existences (Find Student by Email)
        $student = $this->studentModel->findByEmail($email);
        if (!$student) {
            return $this->jsonResponse(['message' => 'Student account not found. Please register first.'], 404);
        }
        $studentId = $student['id'];

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
            
            // 7. Notification (Admin + Student)
            $this->notifyParties($student, $course);

            return $this->jsonResponse([
                'message' => 'Enrollment successful. Confirmation email sent.',
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
     * Return all enrollments for an admin
     */
    public function getAdminEnrollments($adminId) {
        $stmt = $this->enrollmentModel->getByAdmin($adminId);
        return $this->jsonResponse($stmt->fetchAll(\PDO::FETCH_ASSOC), 200);
    }
    
    /**
     * Return aggregated statistics for an admin
     */
    public function getAdminStats($adminId) {
        $stats = $this->enrollmentModel->getAdminStats($adminId);
        return $this->jsonResponse($stats, 200);
    }

    /**
     * Get recent enrollments for SuperAdmin dashboard
     */
    public function getRecentEnrollments($limit = 5) {
        $query = "SELECT e.*, 
                         s.first_name, s.last_name, s.email,
                         c.title as course_title,
                         a.first_name as admin_first, a.last_name as admin_last
                  FROM enrollments e
                  JOIN students s ON e.student_id = s.id
                  JOIN courses c ON e.course_id = c.id
                  LEFT JOIN administrators a ON c.administrator_id = a.id
                  ORDER BY e.enrolled_at DESC
                  LIMIT :limit";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, \PDO::PARAM_INT);
        $stmt->execute();
        
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Format admin name
        foreach ($results as &$row) {
            $row['admin_name'] = trim(($row['admin_first'] ?? '') . ' ' . ($row['admin_last'] ?? ''));
        }
        
        return $this->jsonResponse($results, 200);
    }

    /**
     * Check enrollment status for a specific student and course
     */
    public function checkStatus($email, $courseId) {
        $student = $this->studentModel->findByEmail($email);
        if (!$student) {
            return $this->jsonResponse(['status' => 'NOT_ENROLLED'], 200);
        }

        $query = "SELECT status FROM enrollments WHERE student_id = ? AND course_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$student['id'], $courseId]);
        $status = $stmt->fetchColumn();

        if ($status) {
            return $this->jsonResponse(['status' => $status], 200);
        }
        
        return $this->jsonResponse(['status' => 'NOT_ENROLLED'], 200);
    }

    /**
     * Email notification system
     */
    private function notifyParties($student, $course) {
        // Fetch Admin of the course
        $adminId = $course['administrator_id'];
        $admin = $this->adminModel->getById($adminId);

        if ($admin) {
            $adminName = $admin['first_name'] . ' ' . $admin['last_name'];
            $studentName = $student['first_name'] . ' ' . $student['last_name'];
            
            // Email to Admin
            $bodyAdmin = $this->emailService->getNewEnrollmentTemplate($adminName, $studentName, $course['title']);
            $this->emailService->send($admin['email'], "Nouvelle Inscription : " . $course['title'], $bodyAdmin);
        }

        // Email to Student
        $studentName = $student['first_name'] . ' ' . $student['last_name'];
        $bodyStudent = $this->emailService->getStudentConfirmationTemplate($studentName, $course['title']);
        $this->emailService->send($student['email'], "Confirmation d'inscription - ENSPY Training", $bodyStudent);

        error_log("Enrollment Notification: Student {$student['email']} enrolled in Course '{$course['title']}'.");
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
