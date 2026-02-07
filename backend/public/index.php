<?php

/**
 * Main Entry Point and Router for the Portal Backend.
 */

// 0. Handle Static Files (for PHP built-in server)
if (php_sapi_name() === 'cli-server') {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (is_file(__DIR__ . $path)) {
        return false;
    }
}

// 1. Headers & CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Initializations
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Controllers/AdminController.php';
require_once __DIR__ . '/../src/Controllers/InstructorController.php';
require_once __DIR__ . '/../src/Controllers/CategoryController.php';
require_once __DIR__ . '/../src/Controllers/CourseController.php';
require_once __DIR__ . '/../src/Controllers/StudentController.php';
require_once __DIR__ . '/../src/Controllers/EnrollmentController.php';

use Controllers\AdminController;
use Controllers\InstructorController;
use Controllers\CategoryController;
use Controllers\CourseController;
use Controllers\StudentController;
use Controllers\EnrollmentController;

$database = new Database();
$db = $database->getConnection();

/**
 * Handle 404
 */
if (!function_exists('routeNotFound')) {
    function routeNotFound() {
        http_response_code(404);
        echo json_encode(['message' => 'Resource not found or method not allowed']);
    }
}

// 3. Request Parsing
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = $_SERVER['SCRIPT_NAME'];

// Remove script name from URI to get clean path
$base_path = str_replace('index.php', '', $script_name);
$path = $request_uri;

if ($base_path !== '/' && strpos($path, $base_path) === 0) {
    $path = substr($path, strlen($base_path));
}
$path = parse_url($path, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Get Input Data
$input_data = [];
if ($method === 'POST' || $method === 'PUT') {
    // Check for JSON
    $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($content_type, 'application/json') !== false) {
        $input_data = json_decode(file_get_contents("php://input"), true) ?? [];
    } else {
        // Fallback to $_POST for multipart or form-url-encoded
        $input_data = $_POST;
    }
}

// 4. Routing Table
try {
    $resource = $path_parts[0] ?? '';
    $id = $path_parts[1] ?? null;

    switch ($resource) {
        case 'administrators':
            $controller = new AdminController($db);
            if ($method === 'POST') {
                if ($id === 'login') $controller->login($input_data);
                else $controller->create($input_data);
            } elseif ($method === 'GET') {
                if ($id) $controller->show($id);
                else $controller->index();
            } elseif ($method === 'PUT' && $id) $controller->update($id, $input_data);
            elseif ($method === 'DELETE' && $id) $controller->delete($id);
            else routeNotFound();
            break;

        case 'instructors':
            $controller = new InstructorController($db);
            if ($method === 'POST') $controller->create($input_data);
            elseif ($method === 'GET') {
                if ($id) $controller->show($id);
                else $controller->index();
            } elseif ($method === 'PUT' && $id) $controller->update($id, $input_data);
            elseif ($method === 'DELETE' && $id) $controller->delete($id);
            else routeNotFound();
            break;

        case 'categories':
            $controller = new CategoryController($db);
            if ($method === 'POST') $controller->create($input_data);
            elseif ($method === 'GET') {
                if ($id) $controller->show($id);
                else $controller->index();
            } elseif ($method === 'PUT' && $id) $controller->update($id, $input_data);
            elseif ($method === 'DELETE' && $id) $controller->delete($id);
            else routeNotFound();
            break;

        case 'courses':
            $controller = new CourseController($db);
            if ($method === 'POST') $controller->create($_POST);
            elseif ($method === 'GET') {
                if (isset($_GET['action']) && $_GET['action'] === 'getAdminCourses' && isset($_GET['admin_id'])) {
                    $controller->getAdminCourses($_GET['admin_id']);
                } elseif (isset($path_parts[1])) {
                    $controller->show($path_parts[1]);
                } else {
                    $controller->index();
                }
            }
            elseif ($method === 'PUT' && isset($path_parts[1])) $controller->update($path_parts[1], $_PUT ?? $_POST); // Handle FormData via POST spoofing if needed, but here assuming strict REST or method override
            elseif ($method === 'DELETE' && isset($path_parts[1])) $controller->delete($path_parts[1]);
            else routeNotFound();
            break;

        case 'students':
            $controller = new StudentController($db);
            if ($method === 'POST') {
                if ($id === 'login') $controller->login($input_data);
                else $controller->create($input_data);
            } elseif ($method === 'GET') {
                if ($id) $controller->show($id);
                else $controller->index();
            } elseif ($method === 'PUT' && $id) $controller->update($id, $input_data);
            elseif ($method === 'DELETE' && $id) $controller->delete($id);
            else routeNotFound();
            break;

        case 'enrollments':
            $controller = new EnrollmentController($db);
            if ($method === 'POST') $controller->enroll($input_data);
            elseif ($method === 'GET') {
                if (isset($_GET['action']) && $_GET['action'] === 'getAdminEnrollments' && isset($_GET['admin_id'])) {
                    $controller->getAdminEnrollments($_GET['admin_id']);
                } elseif (isset($path_parts[1]) && $path_parts[1] === 'course' && isset($path_parts[2])) {
                    $status = $_GET['status'] ?? null;
                    $controller->getCourseEnrollments($path_parts[2], $status);
                } else {
                    routeNotFound();
                }
            } elseif ($method === 'PUT' && isset($path_parts[1]) && $path_parts[1] === 'mark-done' && isset($path_parts[2])) {
                $controller->exportComplete($path_parts[2]);
            } else routeNotFound();
            break;

        default:
            routeNotFound();
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Internal Server Error', 'error' => $e->getMessage()]);
}

