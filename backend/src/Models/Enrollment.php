<?php

namespace Models;

/**
 * Model for the 'enrollments' table.
 * Association between Students and Courses.
 */
class Enrollment {
    private $db;
    private $table_name = "enrollments";

    public $student_id;
    public $course_id;
    public $status;
    public $enrolled_at;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Create enrollment record
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                (student_id, course_id, status)
                VALUES (:student_id, :course_id, :status)";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':student_id', $this->student_id);
        $stmt->bindParam(':course_id', $this->course_id);
        $stmt->bindParam(':status', $this->status);

        return $stmt->execute();
    }

    /**
     * Check if an enrollment already exists
     */
    public function exists($student_id, $course_id) {
        $query = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE student_id = ? AND course_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$student_id, $course_id]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Update enrollment status for a specific student/course
     */
    public function updateStatus($student_id, $course_id, $status) {
        $query = "UPDATE " . $this->table_name . " SET status = :status WHERE student_id = :student_id AND course_id = :course_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->bindParam(':course_id', $course_id);
        return $stmt->execute();
    }

    /**
     * Mark all pending enrollments as DONE for a course
     */
    public function markAllAsDone($course_id) {
        $query = "UPDATE " . $this->table_name . " SET status = 'DONE' WHERE course_id = ? AND status = 'PENDING'";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$course_id]);
    }

    /**
     * Get enrollments with student details by course ID
     */
    public function getByCourse($course_id, $status = null) {
        $query = "SELECT e.*, s.first_name, s.last_name, s.email 
                FROM " . $this->table_name . " e
                JOIN students s ON e.student_id = s.id
                WHERE e.course_id = ?";
        
        if ($status) {
            $query .= " AND e.status = ?";
        }

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $course_id);
        if ($status) {
            $stmt->bindParam(2, $status);
        }
        $stmt->execute();
        return $stmt;
    }
}
