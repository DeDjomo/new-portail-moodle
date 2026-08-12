<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Student.php';
require_once __DIR__ . '/../Services/MoodleApiService.php';

use Models\Student;

/**
 * Controller for managing Student accounts.
 * Handles Registration, Login, and Profile management.
 */
class StudentController {
    private $db;
    private $studentModel;

    public function __construct($db) {
        $this->db = $db;
        $this->studentModel = new Student($db);
    }

    /**
     * List all active students
     */
    public function index() {
        $stmt = $this->studentModel->getAll();
        $students = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Remove passwords from response
        foreach ($students as &$student) {
            unset($student['password']);
        }
        
        return $this->jsonResponse($students, 200);
    }

    /**
     * Get student details
     */
    public function show($id) {
        $student = $this->studentModel->getById($id);
        if ($student) {
            unset($student['password']);
            return $this->jsonResponse($student, 200);
        }
        return $this->jsonResponse(['message' => 'Student not found'], 404);
    }

    /**
     * Register a new student (Create)
     */
    public function create($data) {
        // 1. Validation
        $required = ['last_name', 'first_name', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->jsonResponse(['message' => "Le champ '$field' est obligatoire."], 400);
            }
        }

        // Password minimum length
        if (strlen($data['password']) < 8) {
            return $this->jsonResponse(['message' => 'Le mot de passe doit contenir au moins 8 caractères.'], 400);
        }

        // 2. Email Uniqueness
        if ($this->studentModel->findByEmail($data['email'])) {
            return $this->jsonResponse(['message' => 'Email already in use'], 409);
        }

        // 3. Map to Model
        $this->studentModel->last_name = $data['last_name'];
        $this->studentModel->first_name = $data['first_name'];
        $this->studentModel->email = $data['email'];
        $this->studentModel->major = $data['major'] ?? null;
        $this->studentModel->level = $data['level'] ?? null;
        $this->studentModel->phone = $data['phone'] ?? null;
        $this->studentModel->password = password_hash($data['password'], PASSWORD_BCRYPT);
        $this->studentModel->status = 'ACTIVE';

        // Synchroniser avec Moodle
        $moodleResponse = \MoodleApiService::createUser(
            $data['first_name'], 
            $data['last_name'], 
            $data['email'], 
            $data['password']
        );

        if (isset($moodleResponse['exception'])) {
            error_log("[Moodle] REGISTRATION FAILED for " . $data['email'] . ". Error: " . ($moodleResponse['message'] ?? 'Unknown'));

            $cleanMsg = strip_tags($moodleResponse['message'] ?? 'Erreur lors de la création sur Moodle.');
            return $this->jsonResponse(['message' => 'Moodle Error: ' . $cleanMsg], 400);
        }

        error_log("[Moodle] REGISTRATION SUCCESS for " . $data['email']);

        if ($this->studentModel->create()) {
            return $this->jsonResponse([
                'message' => 'Student registered successfully',
                'id' => $this->studentModel->id
            ], 201);
        }

        return $this->jsonResponse(['message' => 'Failed to register student'], 500);
    }

    /**
     * Student Login
     */
    public function login($data) {
        if (empty($data['email']) || empty($data['password'])) {
            return $this->jsonResponse(['message' => 'Email and password are required'], 400);
        }

        $student = $this->studentModel->findByEmail($data['email']);

        if (!$student) {
            return $this->jsonResponse(['message' => 'Invalid credentials'], 401);
        }

        // Check account status
        if ($student['status'] === 'SUSPENDED') {
            return $this->jsonResponse(['message' => 'Account suspended. Please contact an administrator.'], 403);
        }

        if (!password_verify($data['password'], $student['password'])) {
            return $this->jsonResponse(['message' => 'Invalid credentials'], 401);
        }

        // Fetch Moodle user token (for SSO)
        $moodleTokenData = \MoodleApiService::getUserPersonalToken($data['email'], $data['password']);
        $moodleTokens = null;
        
        if ($moodleTokenData && isset($moodleTokenData['token']) && isset($moodleTokenData['privatetoken'])) {
            $moodleTokens = [
                'token' => $moodleTokenData['token'],
                'privatetoken' => $moodleTokenData['privatetoken']
            ];
            error_log("[Moodle] SUCCESS: Tokens retrieved for " . $data['email']);
        } else {
            error_log("[Moodle] FAILED: Tokens for " . $data['email'] . ". Response: " . json_encode($moodleTokenData));
        }

        // Remove sensitive info
        unset($student['password']);

        return $this->jsonResponse([
            'message' => 'Login successful',
            'student' => $student,
            'moodle_keys' => $moodleTokens
        ], 200);
    }

    /**
     * Update student profile
     */
    public function update($id, $data) {
        $existing = $this->studentModel->getById($id);
        if (!$existing) {
            return $this->jsonResponse(['message' => 'Student not found'], 404);
        }

        // Check email uniqueness if changed
        if (isset($data['email']) && $data['email'] !== $existing['email']) {
            if ($this->studentModel->findByEmail($data['email'])) {
                return $this->jsonResponse(['message' => 'Email already in use'], 400);
            }
        }

        $this->studentModel->id = $id;
        $this->studentModel->last_name = $data['last_name'] ?? $existing['last_name'];
        $this->studentModel->first_name = $data['first_name'] ?? $existing['first_name'];
        $this->studentModel->email = $data['email'] ?? $existing['email'];
        $this->studentModel->major = $data['major'] ?? $existing['major'];
        $this->studentModel->level = $data['level'] ?? $existing['level'];
        $this->studentModel->phone = $data['phone'] ?? $existing['phone'];
        
        // Handle password update if provided
        if (!empty($data['password'])) {
            $this->studentModel->password = password_hash($data['password'], PASSWORD_BCRYPT);
        } else {
            $this->studentModel->password = $existing['password'];
        }
        
        $this->studentModel->status = $data['status'] ?? $existing['status'];

        if ($this->studentModel->update()) {
            return $this->jsonResponse(['message' => 'Profile updated successfully'], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to update profile'], 500);
    }

    /**
     * Soft delete student account
     */
    public function delete($id) {
        if ($this->studentModel->delete($id)) {
            return $this->jsonResponse(['message' => 'Account deleted successfully'], 200);
        }
        return $this->jsonResponse(['message' => 'Failed to delete account'], 500);
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
