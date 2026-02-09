<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Instructor.php';
require_once __DIR__ . '/../Utils/FileUploader.php';

use Models\Instructor;
use Utils\FileUploader;

/**
 * Controller for managing Instructor profiles.
 * Handles CRUD operations and photo uploads.
 */
class InstructorController {
    private $db;
    private $instructorModel;
    private $uploader;

    public function __construct($db) {
        $this->db = $db;
        $this->instructorModel = new Instructor($db);
        $this->uploader = new FileUploader('instructors');
    }

    /**
     * List all instructors
     */
    public function index() {
        $stmt = $this->instructorModel->getAll();
        $instructors = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        return $this->jsonResponse($instructors, 200);
    }

    /**
     * Get instructor details
     */
    public function show($id) {
        $instructor = $this->instructorModel->getById($id);
        if ($instructor) {
            return $this->jsonResponse($instructor, 200);
        }
        return $this->jsonResponse(['message' => 'Instructor not found'], 404);
    }

    /**
     * Create a new instructor
     */
    public function create($data) {
        if (empty($data['full_name'])) {
            return $this->jsonResponse(['message' => "Field 'full_name' is required"], 400);
        }
        if (empty($data['professional_title'])) {
            return $this->jsonResponse(['message' => "Field 'professional_title' is required"], 400);
        }
        if (empty($data['organization'])) {
            return $this->jsonResponse(['message' => "Field 'organization' is required"], 400);
        }

        // Handle Photo Upload
        $photoUrl = null;
        if (isset($_FILES['photo'])) {
            try {
                $uploadedPath = $this->uploader->upload($_FILES['photo']);
                if ($uploadedPath) {
                    $photoUrl = $uploadedPath;
                }
            } catch (\Throwable $e) {
                // Log error but allow creation without photo to prevent freezing
                error_log("Photo Upload Failed: " . $e->getMessage());
            }
        }

        $this->instructorModel->full_name = $data['full_name'];
        $this->instructorModel->professional_title = $data['professional_title'] ?? null;
        $this->instructorModel->organization = $data['organization'] ?? null;
        $this->instructorModel->short_bio = $data['short_bio'] ?? null;
        $this->instructorModel->full_bio = $data['full_bio'] ?? null;
        $photoVal = $photoUrl ?? ($data['photo_url'] ?? null);
        error_log("Instructor Create: photo_url received: " . ($data['photo_url'] ?? 'NULL'));
        error_log("Instructor Create: final photo_url: " . ($photoVal ?? 'NULL'));
        
        $this->instructorModel->photo_url = $photoVal;
        $this->instructorModel->website = $data['website'] ?? null;
        $this->instructorModel->linkedin_url = $data['linkedin_url'] ?? null;
        $this->instructorModel->status = $data['status'] ?? 'ACTIVE';

        if ($this->instructorModel->create()) {
            return $this->jsonResponse([
                'message' => 'Instructor created successfully',
                'id' => $this->instructorModel->id
            ], 201);
        }

        return $this->jsonResponse(['message' => 'Failed to create instructor'], 500);
    }

    /**
     * Update instructor
     */
    public function update($id, $data) {
        $existing = $this->instructorModel->getById($id);
        if (!$existing) {
            return $this->jsonResponse(['message' => 'Instructor not found'], 404);
        }

        // Handle Photo Upload
        $photoUrl = $existing['photo_url'];
        if (isset($_FILES['photo'])) {
            try {
                $uploadedPath = $this->uploader->upload($_FILES['photo']);
                if ($uploadedPath) {
                    // Delete old photo if it exists
                    if ($existing['photo_url']) {
                        $this->uploader->delete($existing['photo_url']);
                    }
                    $photoUrl = $uploadedPath;
                }
            } catch (\Throwable $e) {
                error_log("Photo Upload Update Failed: " . $e->getMessage());
            }
        }

        $this->instructorModel->id = $id;
        $this->instructorModel->full_name = $data['full_name'] ?? $existing['full_name'];
        $this->instructorModel->professional_title = $data['professional_title'] ?? $existing['professional_title'];
        $this->instructorModel->organization = $data['organization'] ?? $existing['organization'];
        $this->instructorModel->short_bio = $data['short_bio'] ?? $existing['short_bio'];
        $this->instructorModel->full_bio = $data['full_bio'] ?? $existing['full_bio'];
        $this->instructorModel->photo_url = $photoUrl;
        $this->instructorModel->website = $data['website'] ?? $existing['website'];
        $this->instructorModel->linkedin_url = $data['linkedin_url'] ?? $existing['linkedin_url'];
        $this->instructorModel->status = $data['status'] ?? $existing['status'];

        if ($this->instructorModel->update()) {
            return $this->jsonResponse(['message' => 'Instructor updated successfully'], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to update instructor'], 500);
    }

    /**
     * Soft delete instructor
     */
    public function delete($id) {
        // TODO: Check if instructor is linked to active courses before deleting
        
        if ($this->instructorModel->delete($id)) {
            return $this->jsonResponse(['message' => 'Instructor deleted successfully'], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to delete instructor'], 500);
    }

    /**
     * Helper for JSON responses
     */
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        return $data;
    }
}
