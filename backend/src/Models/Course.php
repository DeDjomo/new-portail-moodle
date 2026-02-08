<?php

namespace Models;

require_once 'BaseModel.php';

/**
 * Model for the 'courses' table.
 */
class Course extends BaseModel {
    protected $table_name = "courses";

    public $id;
    public $administrator_id;
    public $instructor_id;
    public $category_id;
    public $title;
    public $slug;
    public $short_synopsis;
    public $full_description;
    public $pedagogical_objectives;
    public $target_audience;
    public $prerequisites;
    public $total_duration_minutes;
    public $level;
    public $language;
    public $format;
    public $is_certifying;
    public $status;
    public $published_at;
    public $meta_title;
    public $meta_description;
    public $enrolled_count;
    public $image_url;
    public $video_url;
    public $moodle_url;

    /**
     * Get all courses with joined instructor and category details
     */
    public function getAllWithDetails($status = null) {
        $query = "SELECT c.*, 
                         i.full_name as instructor_name, 
                         i.photo_url as instructor_photo_url,
                         i.professional_title as instructor_title,
                         i.short_bio as instructor_bio,
                         cat.name as category_name
                  FROM " . $this->table_name . " c
                  LEFT JOIN instructors i ON c.instructor_id = i.id
                  LEFT JOIN categories cat ON c.category_id = cat.id AND cat.status != 'DELETED'
                  WHERE c.status != 'DELETED'";
        
        if ($status) {
            $query .= " AND c.status = :status";
        }
        
        $query .= " ORDER BY c.created_at DESC";

        $stmt = $this->db->prepare($query);
        if ($status) {
            $stmt->bindParam(':status', $status);
        }
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get all courses for a specific administrator
     */
    public function getByAdmin($admin_id) {
        $query = "SELECT c.*, 
                         i.full_name as instructor_name, 
                         i.photo_url as instructor_photo_url,
                         i.professional_title as instructor_title,
                         i.short_bio as instructor_bio,
                         cat.name as category_name
                  FROM " . $this->table_name . " c
                  LEFT JOIN instructors i ON c.instructor_id = i.id
                  LEFT JOIN categories cat ON c.category_id = cat.id AND cat.status != 'DELETED'
                  WHERE c.administrator_id = ? AND c.status != 'DELETED'
                  ORDER BY c.created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $admin_id);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get course details with joined instructor and category details
     */
    public function getByIdWithDetails($id) {
        $query = "SELECT c.*, 
                         i.full_name as instructor_name, 
                         i.photo_url as instructor_photo_url,
                         i.professional_title as instructor_title,
                         i.short_bio as instructor_bio,
                         cat.name as category_name
                  FROM " . $this->table_name . " c
                  LEFT JOIN instructors i ON c.instructor_id = i.id
                  LEFT JOIN categories cat ON c.category_id = cat.id AND cat.status != 'DELETED'
                  WHERE c.id = ? AND c.status != 'DELETED'
                  LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * Create a new course
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                (administrator_id, instructor_id, category_id, title, slug, short_synopsis, 
                full_description, pedagogical_objectives, target_audience, prerequisites, 
                total_duration_minutes, level, language, format, is_certifying, status, 
                published_at, meta_title, meta_description, enrolled_count, image_url, 
                video_url, moodle_url)
                VALUES (:administrator_id, :instructor_id, :category_id, :title, :slug, :short_synopsis, 
                :full_description, :pedagogical_objectives, :target_audience, :prerequisites, 
                :total_duration_minutes, :level, :language, :format, :is_certifying, :status, 
                :published_at, :meta_title, :meta_description, :enrolled_count, :image_url, 
                :video_url, :moodle_url)";

        $stmt = $this->db->prepare($query);

        $this->bindAllParams($stmt);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Update a course
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET administrator_id = :administrator_id, instructor_id = :instructor_id, 
                    category_id = :category_id, title = :title, slug = :slug, 
                    short_synopsis = :short_synopsis, full_description = :full_description, 
                    pedagogical_objectives = :pedagogical_objectives, target_audience = :target_audience, 
                    prerequisites = :prerequisites, total_duration_minutes = :total_duration_minutes, 
                    level = :level, language = :language, format = :format, 
                    is_certifying = :is_certifying, status = :status, published_at = :published_at, 
                    meta_title = :meta_title, meta_description = :meta_description, 
                    enrolled_count = :enrolled_count, image_url = :image_url, 
                    video_url = :video_url, moodle_url = :moodle_url
                WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $this->bindAllParams($stmt);
        $stmt->bindValue(':id', $this->id, \PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * Increment the enrollment counter
     */
    public function incrementEnrollmentCount($id) {
        $query = "UPDATE " . $this->table_name . " SET enrolled_count = enrolled_count + 1 WHERE id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }

    /**
     * Find by Slug
     */
    public function findBySlug($slug) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE slug = ? AND status != 'DELETED' LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $slug);
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * Helper to bind all parameters with correct types
     */
    private function bindAllParams($stmt) {
        $stmt->bindValue(':administrator_id', $this->administrator_id, \PDO::PARAM_INT);
        $stmt->bindValue(':instructor_id', $this->instructor_id, \PDO::PARAM_INT);
        $stmt->bindValue(':category_id', $this->category_id, \PDO::PARAM_INT);
        $stmt->bindValue(':title', $this->title);
        $stmt->bindValue(':slug', $this->slug);
        $stmt->bindValue(':short_synopsis', $this->short_synopsis);
        $stmt->bindValue(':full_description', $this->full_description);
        $stmt->bindValue(':pedagogical_objectives', $this->pedagogical_objectives);
        $stmt->bindValue(':target_audience', $this->target_audience);
        $stmt->bindValue(':prerequisites', $this->prerequisites);
        $stmt->bindValue(':total_duration_minutes', $this->total_duration_minutes, \PDO::PARAM_INT);
        $stmt->bindValue(':level', $this->level);
        $stmt->bindValue(':language', $this->language);
        $stmt->bindValue(':format', $this->format);
        $stmt->bindValue(':is_certifying', $this->is_certifying ? 1 : 0, \PDO::PARAM_INT);
        $stmt->bindValue(':status', $this->status);
        $stmt->bindValue(':published_at', $this->published_at);
        $stmt->bindValue(':meta_title', $this->meta_title);
        $stmt->bindValue(':meta_description', $this->meta_description);
        $stmt->bindValue(':enrolled_count', $this->enrolled_count, \PDO::PARAM_INT);
        $stmt->bindValue(':image_url', $this->image_url);
        $stmt->bindValue(':video_url', $this->video_url);
        $stmt->bindValue(':moodle_url', $this->moodle_url);
    }
}
