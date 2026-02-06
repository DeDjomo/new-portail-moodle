<?php

require_once 'src/Utils/EmailService.php';

use Utils\EmailService;

echo "--- Testing EmailService (Formatting only) ---\n";

$emailService = new EmailService();

// 1. Test Admin Welcome Template
echo "1. Testing Admin Welcome Template Rendering...\n";
$adminName = "Boris Nnanga";
$body = $emailService->getAdminWelcomeTemplate($adminName);

if (strpos($body, "Bienvenue") !== false && strpos($body, $adminName) !== false) {
    echo "SUCCESS: Admin Welcome template correctly rendered.\n";
} else {
    echo "FAILURE: Admin Welcome template rendering failed.\n";
    exit(1);
}

// 2. Test New Enrollment Template
echo "2. Testing Enrollment Notification Template Rendering...\n";
$adminName = "Super Admin";
$studentName = "John Doe";
$courseTitle = "Apprendre le PHP";
$body = $emailService->getNewEnrollmentTemplate($adminName, $studentName, $courseTitle);

if (strpos($body, $studentName) !== false && strpos($body, $courseTitle) !== false) {
    echo "SUCCESS: Enrollment notification template correctly rendered.\n";
} else {
    echo "FAILURE: Enrollment notification template rendering failed.\n";
    exit(1);
}

// 3. SMTP Connectivity Test (Optional/Caution: Might fail if internet is blocked or creds wrong)
echo "3. Sending Real Test Email to portailmoodle@mail.com...\n";
$res = $emailService->send("portailmoodle@mail.com", "Test IHM Portail", "Ceci est un test de l'envoi de mail avec le nouveau service.");
if ($res) {
    echo "SUCCESS: Email sent successfully!\n";
} else {
    echo "FAILURE: Email sending failed. Check credentials or connection.\n";
}

echo "--- EmailService Preliminary Tests Done ---\n";
