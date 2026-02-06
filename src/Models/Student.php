<?php

namespace Models;

require_once 'BaseModel.php';

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
     * Find student by email
     */
    public function findByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
}
