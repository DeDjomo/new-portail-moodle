<?php

namespace Models;

require_once 'BaseModel.php';

class Administrator extends BaseModel {
    protected $table_name = "administrators";

    public $id;
    public $last_name;
    public $first_name;
    public $email;
    public $password_hash;
    public $type;
    public $status;
    public $avatar_url;
    public $phone;
    public $last_login;

    /**
     * Create a new administrator
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                (last_name, first_name, email, password_hash, type, status, avatar_url, phone)
                VALUES (:last_name, :first_name, :email, :password_hash, :type, :status, :avatar_url, :phone)";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password_hash', $this->password_hash);
        $stmt->bindParam(':type', $this->type);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':avatar_url', $this->avatar_url);
        $stmt->bindParam(':phone', $this->phone);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Update an administrator
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET last_name = :last_name, first_name = :first_name, email = :email, 
                    type = :type, status = :status, avatar_url = :avatar_url, phone = :phone
                WHERE id = :id";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':type', $this->type);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':avatar_url', $this->avatar_url);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }
}
