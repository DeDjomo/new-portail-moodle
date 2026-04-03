<?php

namespace Utils;

/**
 * Utility class for sending emails via SMTP using native PHP sockets.
 * Optimized for Gmail app passwords.
 */
class EmailService {
    private $host = "ssl://smtp.gmail.com";
    private $port = 465;
    private $username = "portailmoodle@gmail.com"; 
    private $password = "hpfpsmsuxtcgcwwo"; 
    private $fromName = "Portail Moodle";

    public function __construct() {
    }

    /**
     * Send a formatted HTML email
     */
    public function send($to, $subject, $body, $attachment = null) {
        $boundary = md5(uniqid(time()));

        if ($attachment) {
            $headers = "Subject: {$subject}\r\n" .
                "To: {$to}\r\n" .
                "From: {$this->fromName} <{$this->username}>\r\n" .
                "MIME-Version: 1.0\r\n" .
                "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n\r\n";

            $message = "--{$boundary}\r\n" .
                "Content-Type: text/html; charset=UTF-8\r\n\r\n" .
                $body . "\r\n\r\n" .
                "--{$boundary}\r\n" .
                "Content-Type: text/csv; name=\"{$attachment['name']}\"\r\n" .
                "Content-Disposition: attachment; filename=\"{$attachment['name']}\"\r\n" .
                "Content-Transfer-Encoding: base64\r\n\r\n" .
                $attachment['data'] . "\r\n\r\n" .
                "--{$boundary}--";
        } else {
            $headers = "Subject: {$subject}\r\n" .
                "To: {$to}\r\n" .
                "From: {$this->fromName} <{$this->username}>\r\n" .
                "MIME-Version: 1.0\r\n" .
                "Content-Type: text/html; charset=UTF-8\r\n\r\n";
            $message = $body;
        }

        $data = [
            "EHLO " . gethostname(),
            "AUTH LOGIN",
            base64_encode($this->username),
            base64_encode($this->password),
            "MAIL FROM: <{$this->username}>",
            "RCPT TO: <{$to}>",
            "DATA",
            $headers . $message . "\r\n.",
            "QUIT"
        ];

        try {
            // Reduced timeout from 15s to 5s for faster error detection
            $socket = fsockopen($this->host, $this->port, $errno, $errstr, 5);
            if (!$socket) throw new \Exception("Socket error: $errstr ($errno)");

            // Set read timeout to 3 seconds
            stream_set_timeout($socket, 3);

            $this->getResponse($socket);

            // Send EHLO
            fwrite($socket, $data[0] . "\r\n");
            $this->getResponse($socket);

            // AUTH LOGIN
            fwrite($socket, $data[1] . "\r\n");
            $this->getResponse($socket);
            fwrite($socket, $data[2] . "\r\n");
            $this->getResponse($socket);
            fwrite($socket, $data[3] . "\r\n");
            $authResponse = $this->getResponse($socket);
            if (strpos($authResponse, '235') === false) {
                 throw new \Exception("Authentication Failed: " . $authResponse);
            }

            // MAIL FROM
            fwrite($socket, $data[4] . "\r\n");
            $this->getResponse($socket);

            // RCPT TO
            fwrite($socket, $data[5] . "\r\n");
            $this->getResponse($socket);

            // DATA
            fwrite($socket, $data[6] . "\r\n");
            $this->getResponse($socket);

            // Content
            fwrite($socket, $data[7] . "\r\n");
            $this->getResponse($socket);

            // QUIT
            fwrite($socket, $data[8] . "\r\n");
            fclose($socket);

            return true;
        } catch (\Exception $e) {
            error_log("Email sending failed (To: $to): " . $e->getMessage());
            return false;
        }
    }

    private function getResponse($socket) {
        $response = "";
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            // SMTP multiline response check: 3 digits followed by a space means end of response
            if (preg_match("/^[0-9]{3} /", $str)) break;
            
            // Safety break if socket times out
            $info = stream_get_meta_data($socket);
            if ($info['timed_out']) break;
        }
        return $response;
    }

    /* --- Email Templates --- */

    public function getAdminWelcomeTemplate($adminName, $email, $password) {
        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                <h2 style='color: #004a99; text-align: center;'>Bienvenue sur le Portail de Formation</h2>
                <hr style='border: 0; border-top: 10px solid #004a99;'>
                <p>Bonjour <strong>{$adminName}</strong>,</p>
                <p>Votre compte administrateur a été créé avec succès sur notre plateforme.</p>
                
                <div style='background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #004a99;'>
                    <h3 style='margin-top: 0; color: #004a99;'>Vos identifiants de connexion :</h3>
                    <p style='margin: 5px 0;'><strong>Email (Login) :</strong> {$email}</p>
                    <p style='margin: 5px 0;'><strong>Mot de passe :</strong> <span style='background: #eee; padding: 2px 5px; border-radius: 3px;'>{$password}</span></p>
                </div>

                <div style='background: #fff5f5; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 5px solid #ff4d4d;'>
                    <p style='margin: 0; font-size: 0.9em;'><strong>Conseil de sécurité :</strong> Pour votre sécurité, nous vous recommandons de changer votre mot de passe dès votre première connexion.</p>
                </div>

                <p>Vous pouvez dès à présent vous connecter pour gérer le catalogue de cours et les étudiants.</p>
                <p>Pour toute question ou assistance, n'hésitez pas à contacter le support technique.</p>
                <br>
                <p>Cordialement,<br><strong>L'équipe Portail Moodle</strong></p>
                <hr style='border: 0; border-top: 1px solid #eee;'>
                <p style='font-size: 0.8em; color: #777; text-align: center;'>Ceci est un message automatique, merci de ne pas y répondre.</p>
            </div>
        </body>
        </html>";
    }

    public function getNewEnrollmentTemplate($adminName, $studentName, $courseTitle) {
        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                <h2 style='color: #004a99; text-align: center;'>Nouvelle Inscription</h2>
                <hr style='border: 0; border-top: 10px solid #004a99;'>
                <p>Bonjour <strong>{$adminName}</strong>,</p>
                <p>Un nouvel étudiant vient de s'inscrire à l'un de vos cours :</p>
                <div style='background: #f4f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #004a99;'>
                    <p style='margin: 5px 0;'><strong>Cours :</strong> {$courseTitle}</p>
                    <p style='margin: 5px 0;'><strong>Étudiant :</strong> {$studentName}</p>
                    <p style='margin: 5px 0;'><strong>Date :</strong> " . date('d/m/Y H:i') . "</p>
                </div>
                <p>Vous pouvez consulter la liste complète des participants depuis votre tableau de bord.</p>
                <br>
                <p>Cordialement,<br><strong>L'équipe Portail Moodle</strong></p>
                <hr style='border: 0; border-top: 1px solid #eee;'>
                <p style='font-size: 0.8em; color: #777; text-align: center;'>Notifications automatiques du Portail Moodle.</p>
            </div>
        </body>
        </html>";
    }

    public function getStudentConfirmationTemplate($studentName, $courseTitle) {
        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                <h2 style='color: #F59E0B; text-align: center;'>Inscription en attente de validation</h2>
                <hr style='border: 0; border-top: 10px solid #F59E0B;'>
                <p>Bonjour <strong>{$studentName}</strong>,</p>
                <p>Votre demande d'inscription au cours suivant a bien été reçue :</p>
                <div style='background: #fffbeb; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #F59E0B;'>
                    <h3 style='margin: 0; color: #92400e;'>{$courseTitle}</h3>
                    <p style='margin: 5px 0;'><strong>Date :</strong> " . date('d/m/Y') . "</p>
                    <p style='margin: 5px 0;'><strong>Statut :</strong> <span style='color: #F59E0B; font-weight: bold;'>En attente</span></p>
                </div>
                <p>Votre inscription est actuellement en cours de validation par l'administrateur du cours.</p>
                <p>Vous recevrez une notification dès que votre accès sera validé.</p>
                <p>Pensez à consulter régulièrement vos e-mails (et vos spams) dans les 2 jours qui suivent votre inscription.</p>
                <br>
                <p>Cordialement,<br><strong>L'équipe ENSPY Training</strong></p>
                <hr style='border: 0; border-top: 1px solid #eee;'>
            </div>
        </body>
        </html>";
    }

    public function getEnrollmentApprovedTemplate($studentName, $courseTitle, $email, $password) {
        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                <h2 style='color: #10B981; text-align: center;'>🎉 Inscription Validée !</h2>
                <hr style='border: 0; border-top: 10px solid #10B981;'>
                <p>Bonjour <strong>{$studentName}</strong>,</p>
                <p>Nous avons le plaisir de vous informer que votre inscription au cours suivant a été <strong style='color: #10B981;'>validée</strong> :</p>
                <div style='background: #ECFDF5; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #10B981;'>
                    <h3 style='margin: 0; color: #065F46;'>{$courseTitle}</h3>
                    <p style='margin: 5px 0;'><strong>Date de validation :</strong> " . date('d/m/Y') . "</p>
                    <p style='margin: 5px 0;'><strong>Statut :</strong> <span style='color: #10B981; font-weight: bold;'>✅ Validé</span></p>
                </div>
                
                <h3 style='color: #065F46; margin-top: 30px;'>Vos identifiants de connexion Moodle</h3>
                <div style='background: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #e2e8f0;'>
                    <p style='margin: 5px 0;'><strong>Nom d'utilisateur :</strong> {$email}</p>
                    <p style='margin: 5px 0;'><strong>Mot de passe :</strong> <span style='background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;'>{$password}</span></p>
                </div>

                <p>Vous pouvez dès à présent accéder au contenu du cours sur la plateforme Moodle de l'ENSPY. Lors de votre première connexion, il vous sera demandé de modifier ce mot de passe par défaut pour des raisons de sécurité.</p>
                <p>Si vous avez des questions, n'hésitez pas à contacter l'administrateur du cours.</p>
                <br>
                <p>Cordialement,<br><strong>L'équipe ENSPY Training</strong></p>
                <hr style='border: 0; border-top: 1px solid #eee;'>
                <p style='font-size: 0.8em; color: #777; text-align: center;'>Ceci est un message automatique du Portail ENSPY Training.</p>
            </div>
        </body>
        </html>";
    }
}
