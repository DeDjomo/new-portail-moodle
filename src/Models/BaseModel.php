<?php

namespace Models;

use PDO;

abstract class BaseModel {
    protected $db;
    protected $table_name;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get all records from the table (filtering out DELETED records)
     */
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE status != 'DELETED'";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Get a single record by ID (filtering out if DELETED)
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? AND status != 'DELETED' LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Logical Delete (Soft Delete) by setting status to 'DELETED'
     */
    public function delete($id) {
        $query = "UPDATE " . $this->table_name . " SET status = 'DELETED' WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        
        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Physical Delete (Hard Delete) - use with caution
     */
    public function hardDelete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        return $stmt->execute();
    }
}
