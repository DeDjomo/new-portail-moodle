<?php

namespace Models;

require_once 'BaseModel.php';

/**
 * Model for the 'students' table.
 */
class Student extends BaseModel {
    protected $table_name = "students";

    public $id;
    public $last_name;
    public $first_name;
    public $email;
    public $major;
    public $level;
    public $phone;
    public $password;
    public $status;

    /**
     * Create a new student (Registration)
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                (last_name, first_name, email, major, level, phone, password, status)
                VALUES (:last_name, :first_name, :email, :major, :level, :phone, :password, :status)";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':major', $this->major);
        $stmt->bindParam(':level', $this->level);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':status', $this->status);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Update student profile
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET last_name = :last_name, first_name = :first_name, email = :email, 
                    major = :major, level = :level, phone = :phone, 
                    password = :password, status = :status
                WHERE id = :id";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':major', $this->major);
        $stmt->bindParam(':level', $this->level);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Find student by email
     */
    public function findByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? AND status != 'DELETED' LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
}
