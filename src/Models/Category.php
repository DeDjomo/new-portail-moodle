<?php

namespace Models;

require_once 'BaseModel.php';

class Category extends BaseModel {
    protected $table_name = "categories";

    public $id;
    public $name;
    public $slug;
    public $description;
    public $parent_id;
    public $status;

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
     * Get subcategories of a category
     */
    public function getSubcategories($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE parent_id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt;
    }
}
