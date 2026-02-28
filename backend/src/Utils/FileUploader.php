<?php

namespace Utils;

class FileUploader {
    private $targetDir;
    private $allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ];
    private $maxSize = 524288000; // 500MB

    public function __construct($targetSubDir) {
        $this->targetDir = __DIR__ . '/../../public/uploads/' . \trim($targetSubDir, '/') . '/';
        
        if (!\is_dir($this->targetDir)) {
            \mkdir($this->targetDir, 0777, true);
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
        if (!\in_array($mimeType, $this->allowedTypes)) {
            return false;
        }

        // Generate unique name
        $extension = \pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = \uniqid() . '.' . $extension;
        $targetFile = $this->targetDir . $fileName;

        if (\move_uploaded_file($file['tmp_name'], $targetFile)) {
            return 'uploads/' . \trim(\str_replace(__DIR__ . '/../../public/uploads/', '', $this->targetDir), '/') . '/' . $fileName;
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

        $data = null;
        $contentType = null;

        // Try cURL first
        if (\function_exists('curl_init')) {
            $ch = \curl_init($url);
            \curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            \curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            \curl_setopt($ch, CURLOPT_MAXFILESIZE, $this->maxSize);
            \curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            \curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            \curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            $data = \curl_exec($ch);
            $httpCode = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = \curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            \curl_close($ch);

            if ($httpCode !== 200) {
                $data = null;
            }
        } 
        
        // Fallback to file_get_contents if cURL failed or is missing
        if (!$data && \ini_get('allow_url_fopen')) {
            $context = \stream_context_create([
                'http' => [
                    'timeout' => 60,
                    'header' => "User-Agent: Mozilla/5.0\r\n"
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ]);
            $data = @\file_get_contents($url, false, $context);
            if ($data) {
                // Get Content-Type from headers
                foreach ($http_response_header as $header) {
                    if (\preg_match('/^Content-Type: (.*)/i', $header, $matches)) {
                        $contentType = \trim($matches[1]);
                        break;
                    }
                }
            }
        }

        if (!$data) {
            return false;
        }

        // Simple content type validation
        $baseType = $contentType ? \explode(';', $contentType)[0] : null;
        if ($baseType && !\in_array($baseType, $this->allowedTypes)) {
            return false;
        }

        // Determine extension
        $extension = \pathinfo(\parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
        if (!$extension || !\strlen($extension)) {
            $extensions = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'video/mp4' => 'mp4'
            ];
            $extension = $extensions[$baseType] ?? 'bin';
        }

        $fileName = \uniqid() . '.' . $extension;
        $targetFile = $this->targetDir . $fileName;

        if (\file_put_contents($targetFile, $data)) {
            return 'uploads/' . \trim(\str_replace(__DIR__ . '/../../public/uploads/', '', $this->targetDir), '/') . '/' . $fileName;
        }

        return false;
    }

    /**
     * Delete a file
     */
    public function delete($relativePath) {
        $filePath = __DIR__ . '/../../public/' . $relativePath;
        if (\file_exists($filePath) && \is_file($filePath)) {
            return \unlink($filePath);
        }
        return false;
    }
}
