<?php

namespace Utils;

class FileUploader {
    private $targetDir;
    private $allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ];
    private $maxSize = 104857600; // 100MB

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
     * Upload a file from an external URL
     * @param string $url The external URL
     * @return string|false The relative path to the file or false on failure
     */
    public function uploadFromUrl($url) {
        if (empty($url)) return false;

        // Use cURL for better reliability
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXFILESIZE, $this->maxSize);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local dev simplicity
        
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);

        if ($httpCode !== 200 || !$data) {
            return false;
        }

        // Simple content type validation (extract base type if complex)
        $baseType = explode(';', $contentType)[0];
        if (!in_array($baseType, $this->allowedTypes)) {
            return false;
        }

        // Determine extension from URL or content type
        $extension = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
        if (!$extension) {
            $extensions = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'video/mp4' => 'mp4'
            ];
            $extension = $extensions[$baseType] ?? 'bin';
        }

        $fileName = uniqid() . '.' . $extension;
        $targetFile = $this->targetDir . $fileName;

        if (file_put_contents($targetFile, $data)) {
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
