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
    /**
     * Get all enrollments for courses owned by a specific admin
     */
    public function getByAdmin($admin_id) {
        $query = "SELECT e.*, s.first_name, s.last_name, s.email, c.title as course_title, c.image_url as course_image
                FROM " . $this->table_name . " e
                JOIN students s ON e.student_id = s.id
                JOIN courses c ON e.course_id = c.id
                WHERE c.administrator_id = ?
                ORDER BY e.enrolled_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $admin_id);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get aggregated statistics for an admin
     */
    public function getAdminStats($admin_id) {
        $stats = [];

        // 1. Total & Status Distribution
        $query = "SELECT e.status, COUNT(*) as count 
                  FROM " . $this->table_name . " e
                  JOIN courses c ON e.course_id = c.id
                  WHERE c.administrator_id = ?
                  GROUP BY e.status";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$admin_id]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $stats['total_enrollments'] = 0;
        $stats['status_distribution'] = ['PENDING' => 0, 'DONE' => 0];

        foreach($rows as $row) {
            $stats['total_enrollments'] += $row['count'];
            $stats['status_distribution'][$row['status']] = (int)$row['count'];
        }

        // 2. Top 5 Courses
        $query = "SELECT c.title, COUNT(*) as enrollment_count
                  FROM " . $this->table_name . " e
                  JOIN courses c ON e.course_id = c.id
                  WHERE c.administrator_id = ?
                  GROUP BY c.id, c.title
                  ORDER BY enrollment_count DESC
                  LIMIT 5";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$admin_id]);
        $stats['top_courses'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // 3. Total Unique Students
         $query = "SELECT COUNT(DISTINCT e.student_id)
                  FROM " . $this->table_name . " e
                  JOIN courses c ON e.course_id = c.id
                  WHERE c.administrator_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$admin_id]);
        $stats['total_students'] = $stmt->fetchColumn();

        return $stats;
    }
}
