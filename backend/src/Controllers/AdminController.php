<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Administrator.php';
require_once __DIR__ . '/../Utils/FileUploader.php';
require_once __DIR__ . '/../Utils/EmailService.php';

use Models\Administrator;
use Utils\FileUploader;
use Utils\EmailService;

/**
 * Controller for managing Administrators.
 * Handles CRUD operations, Authentication (Login), and Avatar uploads.
 */
class AdminController {
    private $db;
    private $adminModel;
    private $uploader;
    private $emailService;

    public function __construct($db) {
        $this->db = $db;
        $this->adminModel = new Administrator($db);
        $this->uploader = new FileUploader('avatars');
        $this->emailService = new EmailService();
    }

    /**
     * Authenticate an administrator
     */
    public function login($data) {
        if (empty($data['email']) || empty($data['password'])) {
            return $this->jsonResponse(['message' => 'Email and password are required'], 400);
        }

        $admin = $this->adminModel->findByEmail($data['email']);

        if (!$admin) {
            return $this->jsonResponse(['message' => 'Invalid credentials'], 401);
        }

        if ($admin['status'] === 'SUSPENDED') {
            return $this->jsonResponse(['message' => 'Account suspended'], 403);
        }

        if (password_verify($data['password'], $admin['password_hash'])) {
            $this->adminModel->updateLastLogin($admin['id']);
            
            // Session management (if sessions are used)
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_type'] = $admin['type'];

            unset($admin['password_hash']); // Security: remove hash from response
            return $this->jsonResponse([
                'message' => 'Login successful',
                'admin' => $admin
            ], 200);
        }

        return $this->jsonResponse(['message' => 'Invalid credentials'], 401);
    }

    /**
     * Create a new administrator
     */
    public function create($data) {
        // Mandatory fields check
        $required = ['last_name', 'first_name', 'email', 'password', 'type'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->jsonResponse(['message' => "Field '$field' is required"], 400);
            }
        }

        // Check if email unique
        if ($this->adminModel->findByEmail($data['email'])) {
            return $this->jsonResponse(['message' => 'Email already exists'], 409);
        }

        // Handle Avatar Upload
        $avatarUrl = null;
        if (isset($_FILES['avatar'])) {
            $uploadedPath = $this->uploader->upload($_FILES['avatar']);
            if ($uploadedPath) {
                $avatarUrl = $uploadedPath;
            }
        }

        // Map data to model
        $this->adminModel->last_name = $data['last_name'];
        $this->adminModel->first_name = $data['first_name'];
        $this->adminModel->email = strtolower($data['email']);
        $this->adminModel->password_hash = password_hash($data['password'], PASSWORD_BCRYPT);
        $this->adminModel->type = $data['type'];
        
        // Optional fields
        $this->adminModel->status = $data['status'] ?? 'ACTIVE';
        $this->adminModel->avatar_url = $avatarUrl ?? ($data['avatar_url'] ?? null);
        $this->adminModel->phone = $data['phone'] ?? null;

        if ($this->adminModel->create()) {
            // Trigger Welcome Email with credentials
            $fullName = $this->adminModel->first_name . ' ' . $this->adminModel->last_name;
            $body = $this->emailService->getAdminWelcomeTemplate($fullName, $data['email'], $data['password']);
            $this->emailService->send($this->adminModel->email, "Bienvenue sur le Portail Moodle", $body);
            
            return $this->jsonResponse([
                'message' => 'Administrator created successfully',
                'id' => $this->adminModel->id
            ], 201);
        }

        return $this->jsonResponse(['message' => 'Failed to create administrator'], 500);
    }

    /**
     * List all administrators
     */
    public function index() {
        $stmt = $this->adminModel->getAll();
        $admins = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($admins as &$admin) {
            unset($admin['password_hash']);
        }

        return $this->jsonResponse($admins, 200);
    }

    /**
     * Get administrator details
     */
    public function show($id) {
        $admin = $this->adminModel->getById($id);
        if ($admin) {
            unset($admin['password_hash']);
            return $this->jsonResponse($admin, 200);
        }
        return $this->jsonResponse(['message' => 'Administrator not found'], 404);
    }

    /**
     * Update administrator
     */
    public function update($id, $data) {
        $existing = $this->adminModel->getById($id);
        if (!$existing) {
            return $this->jsonResponse(['message' => 'Administrator not found'], 404);
        }

        // Check email uniqueness if it changed
        if (!empty($data['email']) && $data['email'] !== $existing['email']) {
            if ($this->adminModel->findByEmail($data['email'])) {
                return $this->jsonResponse(['message' => 'Email already exists'], 409);
            }
        }

        // Handle Avatar Upload
        $avatarUrl = $existing['avatar_url'];
        if (isset($_FILES['avatar'])) {
            $uploadedPath = $this->uploader->upload($_FILES['avatar']);
            if ($uploadedPath) {
                // Delete old avatar if it exists
                if ($existing['avatar_url']) {
                    $this->uploader->delete($existing['avatar_url']);
                }
                $avatarUrl = $uploadedPath;
            }
        }

        $this->adminModel->id = $id;
        $this->adminModel->last_name = $data['last_name'] ?? $existing['last_name'];
        $this->adminModel->first_name = $data['first_name'] ?? $existing['first_name'];
        $this->adminModel->email = strtolower($data['email'] ?? $existing['email']);
        $this->adminModel->type = $data['type'] ?? $existing['type'];
        $this->adminModel->status = $data['status'] ?? $existing['status'];
        $this->adminModel->avatar_url = $avatarUrl;
        $this->adminModel->phone = $data['phone'] ?? $existing['phone'];

        // Handle Password Update
        if (!empty($data['password'])) {
            $hash = password_hash($data['password'], PASSWORD_BCRYPT);
            $this->adminModel->updatePassword($id, $hash);
        }

        if ($this->adminModel->update()) {
            // Fetch updated admin to return new avatar_url
            $updatedAdmin = $this->adminModel->getById($id);
            unset($updatedAdmin['password_hash']);
            
            return $this->jsonResponse([
                'message' => 'Administrator updated successfully',
                'admin' => $updatedAdmin
            ], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to update administrator'], 500);
    }

    /**
     * Soft delete administrator
     */
    public function delete($id) {
        // Guard: Prevent self-deletion
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['admin_id']) && $_SESSION['admin_id'] == $id) {
            return $this->jsonResponse(['message' => 'You cannot delete yourself'], 400);
        }

        // TODO: Guard: Prevent deleting the last SUPER_ADMIN
        
        if ($this->adminModel->delete($id)) {
            return $this->jsonResponse(['message' => 'Administrator deleted successfully'], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to delete administrator'], 500);
    }

    /**
     * Helper for JSON responses
     */
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        return $data; // For internal testing
    }
}
