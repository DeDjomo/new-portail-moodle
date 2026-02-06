<?php

namespace Models;

require_once 'BaseModel.php';

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

        $stmt->bindParam(':administrator_id', $this->administrator_id);
        $stmt->bindParam(':instructor_id', $this->instructor_id);
        $stmt->bindParam(':category_id', $this->category_id);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':slug', $this->slug);
        $stmt->bindParam(':short_synopsis', $this->short_synopsis);
        $stmt->bindParam(':full_description', $this->full_description);
        $stmt->bindParam(':pedagogical_objectives', $this->pedagogical_objectives);
        $stmt->bindParam(':target_audience', $this->target_audience);
        $stmt->bindParam(':prerequisites', $this->prerequisites);
        $stmt->bindParam(':total_duration_minutes', $this->total_duration_minutes);
        $stmt->bindParam(':level', $this->level);
        $stmt->bindParam(':language', $this->language);
        $stmt->bindParam(':format', $this->format);
        $stmt->bindParam(':is_certifying', $this->is_certifying);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':published_at', $this->published_at);
        $stmt->bindParam(':meta_title', $this->meta_title);
        $stmt->bindParam(':meta_description', $this->meta_description);
        $stmt->bindParam(':enrolled_count', $this->enrolled_count);
        $stmt->bindParam(':image_url', $this->image_url);
        $stmt->bindParam(':video_url', $this->video_url);
        $stmt->bindParam(':moodle_url', $this->moodle_url);

        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }
}
