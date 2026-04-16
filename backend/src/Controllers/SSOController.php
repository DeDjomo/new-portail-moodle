<?php

namespace Controllers;

require_once __DIR__ . '/../Services/MoodleApiService.php';

class SSOController {

    public function __construct() {}

    /**
     * Génère l'URL d'auto-connexion Moodle (SSO)
     * Attend dans payload: { "moodle_token": "...", "moodle_privatetoken": "..." }
     */
    public function getMoodleSSOUrl($data) {
        if (empty($data['moodle_token']) || empty($data['moodle_privatetoken'])) {
            return $this->jsonResponse(['message' => 'Jetons manquants pour le SSO'], 400);
        }

        $ssoData = \MoodleApiService::getAutologinUrl($data['moodle_token'], $data['moodle_privatetoken']);

        if (!$ssoData || !isset($ssoData['autologinurl']) || !isset($ssoData['key'])) {
            return $this->jsonResponse([
                'message' => 'Impossible de générer le lien de connexion Moodle',
                'details' => $ssoData
            ], 500);
        }

        return $this->jsonResponse([
            'message' => 'SSO URL Generated',
            'autologinurl' => $ssoData['autologinurl'],
            'key' => $ssoData['key']
        ], 200);
    }
    
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        return true;
    }
}
