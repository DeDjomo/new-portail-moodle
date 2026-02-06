<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Category.php';

use Models\Category;

/**
 * Controller for managing Categories.
 * Handles CRUD and hierarchical associations.
 */
class CategoryController {
    private $db;
    private $categoryModel;

    public function __construct($db) {
        $this->db = $db;
        $this->categoryModel = new Category($db);
    }

    /**
     * List all active categories
     */
    public function index() {
        $stmt = $this->categoryModel->getAll();
        $categories = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        return $this->jsonResponse($categories, 200);
    }

    /**
     * Get category details
     */
    public function show($id) {
        $category = $this->categoryModel->getById($id);
        if ($category) {
            $category['subcategories'] = $this->categoryModel->getSubcategories($id);
            return $this->jsonResponse($category, 200);
        }
        return $this->jsonResponse(['message' => 'Category not found'], 404);
    }

    /**
     * Create a new category
     */
    public function create($data) {
        if (empty($data['name'])) {
            return $this->jsonResponse(['message' => "Field 'name' is required"], 400);
        }

        // Generate slug if not provided
        $slug = $data['slug'] ?? $this->slugify($data['name']);
        
        // Check slug uniqueness
        if ($this->categoryModel->findBySlug($slug)) {
            $slug = $slug . '-' . uniqid(); // Append unique ID to avoid conflict
        }

        // Validate parent if provided
        if (!empty($data['parent_id'])) {
            $parent = $this->categoryModel->getById($data['parent_id']);
            if (!$parent) {
                return $this->jsonResponse(['message' => 'Parent category not found'], 400);
            }
        }

        $this->categoryModel->name = $data['name'];
        $this->categoryModel->slug = $slug;
        $this->categoryModel->description = $data['description'] ?? null;
        $this->categoryModel->parent_id = $data['parent_id'] ?? null;
        $this->categoryModel->status = $data['status'] ?? 'ACTIVE';

        if ($this->categoryModel->create()) {
            return $this->jsonResponse([
                'message' => 'Category created successfully',
                'id' => $this->categoryModel->id,
                'slug' => $this->categoryModel->slug
            ], 201);
        }

        return $this->jsonResponse(['message' => 'Failed to create category'], 500);
    }

    /**
     * Update category
     */
    public function update($id, $data) {
        $existing = $this->categoryModel->getById($id);
        if (!$existing) {
            return $this->jsonResponse(['message' => 'Category not found'], 404);
        }

        // Prevent self-parenting
        if (isset($data['parent_id']) && $data['parent_id'] == $id) {
            return $this->jsonResponse(['message' => 'A category cannot be its own parent'], 400);
        }

        $this->categoryModel->id = $id;
        $this->categoryModel->name = $data['name'] ?? $existing['name'];
        
        // If name changes and no slug provided, update slug? 
        // Better to keep slug stable but allow manual change.
        $this->categoryModel->slug = $data['slug'] ?? $existing['slug'];
        
        $this->categoryModel->description = $data['description'] ?? $existing['description'];
        $this->categoryModel->parent_id = $data['parent_id'] ?? $existing['parent_id'];
        $this->categoryModel->status = $data['status'] ?? $existing['status'];

        if ($this->categoryModel->update()) {
            return $this->jsonResponse(['message' => 'Category updated successfully'], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to update category'], 500);
    }

    /**
     * Soft delete category
     */
    public function delete($id) {
        // TODO: Handle subcategories? Mark them as deleted or move to root?
        // Default: just soft delete the target.
        if ($this->categoryModel->delete($id)) {
            return $this->jsonResponse(['message' => 'Category deleted successfully'], 200);
        }

        return $this->jsonResponse(['message' => 'Failed to delete category'], 500);
    }

    /**
     * Helper to create a slug
     */
    private function slugify($text) {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        if (function_exists('iconv')) {
            $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        }
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return empty($text) ? 'n-a' : $text;
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
