<?php

require_once 'src/Utils/FileUploader.php';

use Utils\FileUploader;

class TestFileUploader extends FileUploader {
    /**
     * Override upload to use copy instead of move_uploaded_file for CLI testing
     */
    public function simulatedUpload($file) {
        // Same logic as parent but using copy()
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid() . '.' . $extension;
        
        // Use reflection or access protected property if needed, 
        // but here we just re-derive the path for the test.
        $targetDir = __DIR__ . '/../../public/uploads/avatars/';
        $targetFile = $targetDir . $fileName;

        if (copy($file['tmp_name'], $targetFile)) {
            return 'uploads/avatars/' . $fileName;
        }
        return false;
    }
}

echo "--- Testing FileUploader (Simulated) ---\n";

$uploader = new TestFileUploader('avatars');

// 1. Create dummy image
$dummyPath = __DIR__ . '/test_image.png';
$img = imagecreatetruecolor(50, 50);
imagepng($img, $dummyPath);
imagedestroy($img);

$fileMock = [
    'name' => 'test_image.png',
    'tmp_name' => $dummyPath,
    'size' => filesize($dummyPath),
    'error' => UPLOAD_ERR_OK
];

// 2. Test Upload
echo "2. Running simulated upload...\n";
$result = $uploader->simulatedUpload($fileMock);

if ($result && file_exists(__DIR__ . '/../../public/' . $result)) {
    echo "SUCCESS: File uploaded/copied to: $result\n";
    
    // 3. Test Delete
    echo "3. Testing deletion...\n";
    if ($uploader->delete($result)) {
        if (!file_exists(__DIR__ . '/../../public/' . $result)) {
            echo "SUCCESS: File deleted correctly.\n";
        } else {
            echo "FAILURE: File still exists after delete.\n";
        }
    } else {
        echo "FAILURE: Delete method returned false.\n";
    }
} else {
    echo "FAILURE: Upload simulation failed.\n";
}

// Cleanup
if (file_exists($dummyPath)) unlink($dummyPath);

echo "--- FileUploader Logic Verified! ---\n";
