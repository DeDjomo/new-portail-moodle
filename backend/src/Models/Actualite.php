<?php

namespace Models;

require_once 'BaseModel.php';

/**
 * Model for the 'actualites' table.
 */
class Actualite extends BaseModel {
    protected $table_name = "actualites";

    public $id;
    public $administrator_id;
    public $title;
    public $description;
    public $video_url;
    public $image_url;
    public $created_at;
    public $updated_at;

    /**
     * Get all news items
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get a single news item with its linked courses
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) return null;

        $actualite = $row;
        $actualite['courses'] = $this->getLinkedCourses($id);
        
        return $actualite;
    }

    /**
     * Get courses linked to an actualite
     */
    public function getLinkedCourses($actualite_id) {
        $query = "SELECT c.*, cat.name as category_name,
                         GROUP_CONCAT(i.full_name SEPARATOR ', ') as instructor_names,
                         GROUP_CONCAT(i.photo_url SEPARATOR ',') as instructor_photos
                  FROM courses c
                  JOIN actualite_courses ac ON c.id = ac.course_id
                  LEFT JOIN categories cat ON c.category_id = cat.id
                  LEFT JOIN course_instructors ci ON c.id = ci.course_id
                  LEFT JOIN instructors i ON ci.instructor_id = i.id
                  WHERE ac.actualite_id = ? AND c.status = 'PUBLISHED'
                  GROUP BY c.id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $actualite_id);
        $stmt->execute();
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Create news (Placeholder for admin side integration later)
     */
    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET administrator_id=:administrator_id, title=:title, description=:description, video_url=:video_url, image_url=:image_url";
        
        $stmt = $this->db->prepare($query);

        $stmt->bindParam(":administrator_id", $data['administrator_id']);
        $stmt->bindParam(":title", $data['title']);
        $stmt->bindParam(":description", $data['description']);
        $stmt->bindParam(":video_url", $data['video_url']);
        $stmt->bindParam(":image_url", $data['image_url']);

        if($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Get news items by administrator
     */
    public function getByAdmin($admin_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE administrator_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $admin_id);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Update news
     */
    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET title=:title, description=:description, video_url=:video_url, image_url=:image_url 
                  WHERE id=:id";
        
        $stmt = $this->db->prepare($query);

        $stmt->bindParam(":title", $data['title']);
        $stmt->bindParam(":description", $data['description']);
        $stmt->bindParam(":video_url", $data['video_url']);
        $stmt->bindParam(":image_url", $data['image_url']);
        $stmt->bindParam(":id", $id);

        return $stmt->execute();
    }

    /**
     * Link courses to news
     */
    public function linkCourses($actualite_id, $course_ids) {
        // Clear existing links
        $query = "DELETE FROM actualite_courses WHERE actualite_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$actualite_id]);

        if (empty($course_ids)) return true;

        // Insert new links
        $query = "INSERT INTO actualite_courses (actualite_id, course_id) VALUES (?, ?)";
        $stmt = $this->db->prepare($query);
        
        foreach ($course_ids as $course_id) {
            $stmt->execute([$actualite_id, $course_id]);
        }
        
        return true;
    }

    /**
     * Delete news
     */
    public function delete($id) {
        // Delete links first
        $query = "DELETE FROM actualite_courses WHERE actualite_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);

        // Delete actualite
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([$id]);
    }
}
