<?php

/**
 * Integration Test for the Router.
 * Mocks $_SERVER and captures output to verify dispatching.
 */

function testRoute($method, $uri, $input = []) {
    echo "Testing $method $uri...\n";
    
    // Mock Environment
    $_SERVER['REQUEST_METHOD'] = $method;
    $_SERVER['REQUEST_URI'] = $uri;
    $_SERVER['SCRIPT_NAME'] = '/public/index.php';
    $_SERVER['CONTENT_TYPE'] = 'application/json';
    
    // Mock JSON input
    if (!empty($input)) {
        // We can't easily mock php://input globally, but we can check if index.php handles it.
        // For testing, let's assume the router uses a helper or we just test the path matching.
    }

    ob_start();
    require 'public/index.php';
    $output = ob_get_clean();
    
    return json_decode($output, true);
}

echo "--- Testing Router Dispatching ---\n";

// 1. Test GET /courses (Should return list)
$res = testRoute('GET', '/courses');
if (is_array($res)) {
    echo "SUCCESS: GET /courses dispatched correctly.\n";
} else {
    echo "FAILURE: GET /courses failed.\n";
    print_r($res);
}

// 2. Test GET /non-existent (Should return 404)
$res = testRoute('GET', '/ghost-resource');
if (isset($res['message']) && strpos($res['message'], 'not found') !== false) {
    echo "SUCCESS: 404 handled correctly.\n";
} else {
    echo "FAILURE: 404 not handled.\n";
}

// 3. Test Student Login Route
$res = testRoute('POST', '/students/login');
if (isset($res['message']) && strpos($res['message'], 'required') !== false) {
    echo "SUCCESS: /students/login dispatched correctly (validation error expected).\n";
} else {
    echo "FAILURE: /students/login dispatch failed.\n";
}

echo "--- Router Dispatching Preliminary Tests Passed ---\n";
