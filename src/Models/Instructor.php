<?php

namespace Models;

require_once 'BaseModel.php';

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
}
