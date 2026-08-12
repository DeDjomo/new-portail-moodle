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
        if (empty($data['token']) || empty($data['privatetoken'])) {
            return $this->jsonResponse(['message' => 'Jetons manquants pour le SSO'], 400);
        }

        $ssoData = \MoodleApiService::getAutologinUrl($data['token'], $data['privatetoken']);

        // Récupérer l'ID utilisateur Moodle (indispensable pour l'URL finale)
        $siteInfo = \MoodleApiService::curlPost(MOODLE_URL . '/webservice/rest/server.php', [
            'wstoken' => $data['token'],
            'moodlewsrestformat' => 'json',
            'wsfunction' => 'core_webservice_get_site_info'
        ]);

        if (!$ssoData || !isset($ssoData['autologinurl']) || !isset($ssoData['key'])) {
            $errorMsg = 'Impossible de générer le lien de connexion Moodle';
            if (isset($ssoData['message'])) {
                $errorMsg .= ' : ' . $ssoData['message'];
            }
            return $this->jsonResponse([
                'message' => $errorMsg,
                'details' => $ssoData
            ], 500);
        }

        return $this->jsonResponse([
            'message' => 'SSO URL Generated',
            'autologinurl' => $ssoData['autologinurl'],
            'key' => $ssoData['key'],
            'moodle_userid' => $siteInfo['userid'] ?? null
        ], 200);
    }
    
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        return true;
    }
}
