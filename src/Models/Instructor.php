<?php

namespace Models;

require_once 'BaseModel.php';

/**
 * Model for the 'instructors' table.
 * Manages instructor profiles (not login accounts).
 */
class Instructor extends BaseModel {
    protected $table_name = "instructors";

    public $id;
    public $full_name;
    public $professional_title;
    public $organization;
    public $short_bio;
    public $full_bio;
    public $photo_url;
    public $website;
    public $linkedin_url;
    public $status;

    /**
     * Create a new instructor
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                (full_name, professional_title, organization, short_bio, full_bio, photo_url, website, linkedin_url, status)
                VALUES (:full_name, :professional_title, :organization, :short_bio, :full_bio, :photo_url, :website, :linkedin_url, :status)";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':professional_title', $this->professional_title);
        $stmt->bindParam(':organization', $this->organization);
        $stmt->bindParam(':short_bio', $this->short_bio);
        $stmt->bindParam(':full_bio', $this->full_bio);
        $stmt->bindParam(':photo_url', $this->photo_url);
        $stmt->bindParam(':website', $this->website);
        $stmt->bindParam(':linkedin_url', $this->linkedin_url);
        $stmt->bindParam(':status', $this->status);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Update an instructor profile
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET full_name = :full_name, professional_title = :professional_title, 
                    organization = :organization, short_bio = :short_bio, full_bio = :full_bio, 
                    photo_url = :photo_url, website = :website, linkedin_url = :linkedin_url, 
                    status = :status
                WHERE id = :id";

        $stmt = $this->db->prepare($query);

        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':professional_title', $this->professional_title);
        $stmt->bindParam(':organization', $this->organization);
        $stmt->bindParam(':short_bio', $this->short_bio);
        $stmt->bindParam(':full_bio', $this->full_bio);
        $stmt->bindParam(':photo_url', $this->photo_url);
        $stmt->bindParam(':website', $this->website);
        $stmt->bindParam(':linkedin_url', $this->linkedin_url);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }
}
