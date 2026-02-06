<?php

namespace Models;

require_once 'BaseModel.php';

/**
 * Model for the 'categories' table.
 * Supports hierarchical structures (parent/child).
 */
class Category extends BaseModel {
    protected $table_name = "categories";

    public $id;
    public $name;
    public $slug;
    public $description;
    public $parent_id;
    public $status;

    /**
     * Create a new category
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                (name, slug, description, parent_id, status)
                VALUES (:name, :slug, :description, :parent_id, :status)";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':slug', $this->slug);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':parent_id', $this->parent_id);
        $stmt->bindParam(':status', $this->status);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Update a category
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET name = :name, slug = :slug, description = :description, 
                    parent_id = :parent_id, status = :status
                WHERE id = :id";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':slug', $this->slug);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':parent_id', $this->parent_id);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Get subcategories of a category
     */
    public function getSubcategories($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE parent_id = ? AND status != 'DELETED'";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Find category by slug (for uniqueness check)
     */
    public function findBySlug($slug) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE slug = ? AND status != 'DELETED' LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $slug);
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
}
