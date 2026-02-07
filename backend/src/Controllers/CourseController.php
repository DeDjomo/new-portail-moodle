<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Course.php';
require_once __DIR__ . '/../Models/Administrator.php';
require_once __DIR__ . '/../Models/Instructor.php';
require_once __DIR__ . '/../Models/Category.php';
require_once __DIR__ . '/../Utils/FileUploader.php';

use Models\Course;
use Models\Administrator;
use Models\Instructor;
use Models\Category;
use Utils\FileUploader;

/**
 * Controller for managing Courses.
 * Handles complex validation, state transitions, and dual file uploads.
 */
class CourseController {
    private $db;
    private $courseModel;
    private $adminModel;
    private $instructorModel;
    private $categoryModel;
    private $uploader;

    public function __construct($db) {
        $this->db = $db;
        $this->courseModel = new Course($db);
        $this->adminModel = new Administrator($db);
        $this->instructorModel = new Instructor($db);
        $this->categoryModel = new Category($db);
        $this->uploader = new FileUploader('courses');
    }

    /**
     * List all courses
     */
    public function index() {
        $stmt = $this->courseModel->getAllWithDetails();
        $courses = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Decode JSON fields for response
        foreach ($courses as &$course) {
            $course = $this->decodeCourseJsonFields($course);
        }
        
        return $this->jsonResponse($courses, 200);
    }

    /**
     * Get course details
     */
    public function show($id) {
        $course = $this->courseModel->getByIdWithDetails($id);
        if ($course) {
            $course = $this->decodeCourseJsonFields($course);
            return $this->jsonResponse($course, 200);
        }
        return $this->jsonResponse(['message' => 'Course not found'], 404);
    }

    /**
     * Create a new course
     */
    public function create($data) {
        // 1. Strict mandatory fields
        $required = ['administrator_id', 'instructor_id', 'category_id', 'title', 'moodle_url'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->jsonResponse(['message' => "Field '$field' is required"], 400);
            }
        }

        // 2. Integrity Checks
        if (!$this->adminModel->getById($data['administrator_id'])) {
            return $this->jsonResponse(['message' => 'Administrator not found'], 400);
        }
        if (!$this->instructorModel->getById($data['instructor_id'])) {
            return $this->jsonResponse(['message' => 'Instructor not found'], 400);
        }
        if (!$this->categoryModel->getById($data['category_id'])) {
            return $this->jsonResponse(['message' => 'Category not found'], 400);
        }

        // 3. Handle Uploads
        $imageUrl = null;
        if (isset($_FILES['image'])) {
            $imageUrl = $this->uploader->upload($_FILES['image']);
        } elseif (!empty($data['image_url'])) {
            $imageUrl = $this->uploader->uploadFromUrl($data['image_url']);
        }

        $videoUrl = null;
        if (isset($_FILES['video'])) {
            $videoUrl = $this->uploader->upload($_FILES['video']);
        } elseif (!empty($data['video_url'])) {
            $videoUrl = $this->uploader->uploadFromUrl($data['video_url']);
        }

        // 4. State Determination (Draft vs Published)
        $status = $this->determineStatus($data, $imageUrl);

        // 5. Map to Model
        $this->courseModel->administrator_id = $data['administrator_id'];
        $this->courseModel->instructor_id = $data['instructor_id'];
        $this->courseModel->category_id = $data['category_id'];
        $this->courseModel->title = $data['title'];
        $this->courseModel->moodle_url = $data['moodle_url'];
        
        $this->courseModel->slug = $data['slug'] ?? $this->slugify($data['title']);
        $this->courseModel->short_synopsis = $data['short_synopsis'] ?? null;
        $this->courseModel->full_description = $data['full_description'] ?? null;
        
        // JSON Fields
        $this->courseModel->pedagogical_objectives = $this->prepareJsonField($data['pedagogical_objectives'] ?? null);
        $this->courseModel->target_audience = $this->prepareJsonField($data['target_audience'] ?? null);
        $this->courseModel->prerequisites = $this->prepareJsonField($data['prerequisites'] ?? null);
        
        $this->courseModel->target_audience = $data['target_audience'] ?? null;
        $this->courseModel->prerequisites = $data['prerequisites'] ?? null;
        $this->courseModel->total_duration_minutes = $data['total_duration_minutes'] ?? null;
        $this->courseModel->level = $data['level'] ?? 'BEGINNER';
        $this->courseModel->language = $data['language'] ?? 'FR';
        $this->courseModel->format = $data['format'] ?? 'VIDEO';
        $this->courseModel->is_certifying = isset($data['is_certifying']) ? (bool)$data['is_certifying'] : false;
        
        $this->courseModel->status = $status;
        $this->courseModel->published_at = ($status === 'PUBLISHED') ? date('Y-m-d H:i:s') : null;
        
        $this->courseModel->meta_title = $data['meta_title'] ?? null;
        $this->courseModel->meta_description = $data['meta_description'] ?? null;
        $this->courseModel->enrolled_count = 0;
        $this->courseModel->image_url = $imageUrl;
        $this->courseModel->video_url = $videoUrl;

        // Ensure unique slug
        if ($this->courseModel->findBySlug($this->courseModel->slug)) {
            $this->courseModel->slug .= '-' . uniqid();
        }

        if ($this->courseModel->create()) {
            return $this->jsonResponse([
                'message' => 'Course created successfully',
                'id' => $this->courseModel->id,
                'status' => $this->courseModel->status
            ], 201);
        }

        return $this->jsonResponse(['message' => 'Failed to create course'], 500);
    }

    /**
     * Update course
     */
    public function update($id, $data) {
        $existing = $this->courseModel->getById($id);
        if (!$existing) {
            return $this->jsonResponse(['message' => 'Course not found'], 404);
        }

        // Handle Uploads
        $imageUrl = $existing['image_url'];
        if (isset($_FILES['image'])) {
            $newPath = $this->uploader->upload($_FILES['image']);
            if ($newPath) {
                if ($existing['image_url']) $this->uploader->delete($existing['image_url']);
                $imageUrl = $newPath;
            }
        }

        $videoUrl = $existing['video_url'];
        if (isset($_FILES['video'])) {
            $newPath = $this->uploader->upload($_FILES['video']);
            if ($newPath) {
                if ($existing['video_url']) $this->uploader->delete($existing['video_url']);
                $videoUrl = $newPath;
            }
        }

        // Merge Data for status determination
        $merged = array_merge($existing, $data);
        $newStatus = $this->determineStatus($merged, $imageUrl);

        // If manual override requested
        if (isset($data['status'])) {
            $newStatus = $data['status'];
        }

        $this->courseModel->id = $id;
        $this->courseModel->administrator_id = $data['administrator_id'] ?? $existing['administrator_id'];
        $this->courseModel->instructor_id = $data['instructor_id'] ?? $existing['instructor_id'];
        $this->courseModel->category_id = $data['category_id'] ?? $existing['category_id'];
        $this->courseModel->title = $data['title'] ?? $existing['title'];
        $this->courseModel->slug = $data['slug'] ?? $existing['slug'];
        $this->courseModel->short_synopsis = $data['short_synopsis'] ?? $existing['short_synopsis'];
        $this->courseModel->full_description = $data['full_description'] ?? $existing['full_description'];
        
        // JSON Fields handling
        $this->courseModel->pedagogical_objectives = isset($data['pedagogical_objectives']) 
            ? $this->prepareJsonField($data['pedagogical_objectives']) 
            : $existing['pedagogical_objectives'];
        $this->courseModel->target_audience = isset($data['target_audience']) 
            ? $this->prepareJsonField($data['target_audience']) 
            : $existing['target_audience'];
        $this->courseModel->prerequisites = isset($data['prerequisites']) 
            ? $this->prepareJsonField($data['prerequisites']) 
            : $existing['prerequisites'];

        $this->courseModel->total_duration_minutes = $data['total_duration_minutes'] ?? $existing['total_duration_minutes'];
        $this->courseModel->level = $data['level'] ?? $existing['level'];
        $this->courseModel->language = $data['language'] ?? $existing['language'];
        $this->courseModel->format = $data['format'] ?? $existing['format'];
        $this->courseModel->is_certifying = isset($data['is_certifying']) ? (bool)$data['is_certifying'] : $existing['is_certifying'];
        
        $this->courseModel->status = $newStatus;
        $this->courseModel->published_at = ($newStatus === 'PUBLISHED' && !$existing['published_at']) ? date('Y-m-d H:i:s') : $existing['published_at'];
        
        $this->courseModel->meta_title = $data['meta_title'] ?? $existing['meta_title'];
        $this->courseModel->meta_description = $data['meta_description'] ?? $existing['meta_description'];
        $this->courseModel->enrolled_count = $existing['enrolled_count'];
        $this->courseModel->image_url = $imageUrl;
        $this->courseModel->video_url = $videoUrl;
        $this->courseModel->moodle_url = $data['moodle_url'] ?? $existing['moodle_url'];

        if ($this->courseModel->update()) {
            return $this->jsonResponse(['message' => 'Course updated successfully', 'status' => $newStatus], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to update course'], 500);
    }

    /**
     * Soft delete course
     */
    public function delete($id) {
        if ($this->courseModel->delete($id)) {
            return $this->jsonResponse(['message' => 'Course deleted successfully'], 200);
        }
        return $this->jsonResponse(['message' => 'Failed to delete course'], 500);
    }

    /**
     * Internal logic for state machine
     */
    private function determineStatus($data, $imageUrl) {
        $requiredForPublish = [
            'short_synopsis', 'full_description', 'pedagogical_objectives', 
            'level', 'language', 'format', 'total_duration_minutes'
        ];

        foreach ($requiredForPublish as $field) {
            // Check if field is present and not empty (even if it's a JSON string '[]')
            if (empty($data[$field]) || $data[$field] === '[]' || $data[$field] === 'null') return 'DRAFT';
        }

        if (empty($imageUrl)) return 'DRAFT';

        return 'PUBLISHED';
    }

    /**
     * Prepare field for JSON column
     */
    private function prepareJsonField($data) {
        if (is_null($data)) return '[]';
        if (is_array($data)) return json_encode($data);
        if (is_string($data)) {
            // Check if already valid JSON list
            $decoded = json_decode($data, true);
            if (is_array($decoded)) return $data;
            // Otherwise wrap it as a single element list
            return json_encode([$data]);
        }
        return '[]';
    }

    /**
     * Decode JSON fields for response
     */
    private function decodeCourseJsonFields($course) {
        $jsonFields = ['pedagogical_objectives', 'target_audience', 'prerequisites'];
        foreach ($jsonFields as $field) {
            if (isset($course[$field])) {
                $decoded = json_decode($course[$field], true);
                $course[$field] = is_array($decoded) ? $decoded : [];
            }
        }
        return $course;
    }

    private function slugify($text) {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        if (function_exists('iconv')) $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return empty($text) ? 'n-a' : $text;
    }

    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        return $data;
    }
}
