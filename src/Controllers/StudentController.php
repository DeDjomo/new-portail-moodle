<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Student.php';

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
                return $this->jsonResponse(['message' => "Field '$field' is required"], 400);
            }
        }

        // 2. Email Uniqueness
        if ($this->studentModel->findByEmail($data['email'])) {
            return $this->jsonResponse(['message' => 'Email already in use'], 400);
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

        if (!$student || !password_verify($data['password'], $student['password'])) {
            return $this->jsonResponse(['message' => 'Invalid credentials'], 401);
        }

        // Remove sensitive info
        unset($student['password']);

        // Start session if not started
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['student_id'] = $student['id'];
        $_SESSION['user_type'] = 'STUDENT';

        return $this->jsonResponse([
            'message' => 'Login successful',
            'student' => $student
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
