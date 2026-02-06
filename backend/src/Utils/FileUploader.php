<?php

namespace Utils;

class FileUploader {
    private $targetDir;
    private $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    private $maxSize = 2097152; // 2MB

    public function __construct($targetSubDir) {
        $this->targetDir = __DIR__ . '/../../public/uploads/' . trim($targetSubDir, '/') . '/';
        
        if (!is_dir($this->targetDir)) {
            mkdir($this->targetDir, 0777, true);
        }
    }

    /**
     * Upload a file
     * @param array $file The element from $_FILES
     * @return string|false The relative path to the file or false on failure
     */
    public function upload($file) {
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }

        // Validate size
        if ($file['size'] > $this->maxSize) {
            return false;
        }

        // Validate type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, $this->allowedTypes)) {
            return false;
        }

        // Generate unique name
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid() . '.' . $extension;
        $targetFile = $this->targetDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            return 'uploads/' . trim(str_replace(__DIR__ . '/../../public/uploads/', '', $this->targetDir), '/') . '/' . $fileName;
        }

        return false;
    }

    /**
     * Delete a file
     */
    public function delete($relativePath) {
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        if (file_exists($filePath) && is_file($filePath)) {
            return unlink($filePath);
        }
        return false;
    }
}
