<?php

namespace Controllers;

require_once __DIR__ . '/../Models/Actualite.php';
require_once __DIR__ . '/../Utils/FileUploader.php';
use Models\Actualite;
use Utils\FileUploader;

class ActualiteController {
    private $db;
    private $actualite;
    private $uploader;

    public function __construct($db) {
        $this->db = $db;
        $this->actualite = new Actualite($db);
        $this->uploader = new FileUploader('actualites');
    }

    /**
     * List all news
     */
    public function index() {
        // Support filtering by admin
        $admin_id = $_GET['admin_id'] ?? null;
        if ($admin_id) {
            $stmt = $this->actualite->getByAdmin($admin_id);
        } else {
            $stmt = $this->actualite->getAll();
        }
        $actualites = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        echo json_encode($actualites);
    }

    /**
     * Show single news with linked courses
     */
    public function show($id) {
        $item = $this->actualite->getById($id);
        
        if ($item) {
            echo json_encode($item);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Actualité non trouvée"]);
        }
    }

    /**
     * Create news (for future admin use)
     */
    public function create($data) {
        // Validation basic
        if (empty($data['title'])) {
            http_response_code(400);
            echo json_encode(["message" => "Le titre est requis"]);
            return;
        }

        // Handle Uploads (similar to CourseController)
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
            // Check for embeddable links (YouTube/Vimeo)
            if (preg_match('/(?:youtube\.com|youtu\.be|vimeo\.com)/', $data['video_url'])) {
                 $videoUrl = $data['video_url'];
            } else {
                 $videoUrl = $this->uploader->uploadFromUrl($data['video_url']);
            }
        }

        // Video is optional — no validation needed

        $data['image_url'] = $imageUrl;
        $data['video_url'] = $videoUrl;
        // Ensure administrator_id is set
        if (empty($data['administrator_id'])) {
            http_response_code(400);
            echo json_encode(["message" => "L'identifiant de l'administrateur est requis"]);
            return;
        }

        if ($this->actualite->create($data)) {
            // Handle course linking if provided
            if (isset($data['course_ids'])) {
                $courseIds = is_array($data['course_ids']) ? $data['course_ids'] : json_decode($data['course_ids'], true);
                if (is_array($courseIds)) {
                    $this->actualite->linkCourses($this->actualite->id, $courseIds);
                }
            }
            
            http_response_code(201);
            echo json_encode(["message" => "Actualité créée", "id" => $this->actualite->id]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erreur lors de la création"]);
        }
    }

    /**
     * Update news
     */
    public function update($id, $data) {
        $existing = $this->actualite->getById($id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(["message" => "Actualité non trouvée"]);
            return;
        }

        if (empty($data['title'])) {
            http_response_code(400);
            echo json_encode(["message" => "Le titre est requis"]);
            return;
        }

        // Handle Uploads
        $imageUrl = $existing['image_url'];
        if (isset($_FILES['image'])) {
            $newPath = $this->uploader->upload($_FILES['image']);
            if ($newPath) {
                if ($existing['image_url'] && !str_starts_with($existing['image_url'], 'http')) {
                    $this->uploader->delete($existing['image_url']);
                }
                $imageUrl = $newPath;
            }
        } elseif (isset($data['image_url'])) {
            // If explicit URL provided and different
            if ($data['image_url'] !== $existing['image_url']) {
                $imageUrl = $this->uploader->uploadFromUrl($data['image_url']) ?: $data['image_url'];
            }
        }

        $videoUrl = $existing['video_url'];
        if (isset($_FILES['video'])) {
            $newPath = $this->uploader->upload($_FILES['video']);
            if ($newPath) {
                if ($existing['video_url'] && !str_starts_with($existing['video_url'], 'http')) {
                    $this->uploader->delete($existing['video_url']);
                }
                $videoUrl = $newPath;
            }
        } elseif (isset($data['video_url'])) {
            if ($data['video_url'] !== $existing['video_url']) {
                if (preg_match('/(?:youtube\.com|youtu\.be|vimeo\.com)/', $data['video_url'])) {
                    $videoUrl = $data['video_url'];
                } else {
                    $videoUrl = $this->uploader->uploadFromUrl($data['video_url']) ?: $data['video_url'];
                }
            }
        }

        $data['image_url'] = $imageUrl;
        $data['video_url'] = $videoUrl;

        if ($this->actualite->update($id, $data)) {
            // Update course links
            if (isset($data['course_ids'])) {
                $courseIds = is_array($data['course_ids']) ? $data['course_ids'] : json_decode($data['course_ids'], true);
                if (is_array($courseIds)) {
                    $this->actualite->linkCourses($id, $courseIds);
                }
            }
            echo json_encode(["message" => "Actualité mise à jour"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erreur lors de la mise à jour"]);
        }
    }

    /**
     * Delete news
     */
    public function delete($id) {
        if ($this->actualite->delete($id)) {
            echo json_encode(["message" => "Actualité supprimée"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erreur lors de la suppression"]);
        }
    }
}
