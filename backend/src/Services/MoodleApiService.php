<?php

require_once __DIR__ . '/../../config/moodle.php';

class MoodleApiService {

    /**
     * Crée un utilisateur dans Moodle via l'API.
     * Utilise l'email comme nom d'utilisateur Moodle.
     * 
     * @param string $firstname
     * @param string $lastname
     * @param string $email
     * @param string $password
     * @return array|null Response data or null on failure
     */
    public static function createUser($firstname, $lastname, $email, $password) {
        $url = MOODLE_URL . '/webservice/rest/server.php';
        
        $data = [
            'wstoken' => MOODLE_TOKEN_PORTAL_API,
            'moodlewsrestformat' => 'json',
            'wsfunction' => 'core_user_create_users',
            'users[0][username]' => strtolower($email),
            'users[0][password]' => $password,
            'users[0][firstname]' => $firstname,
            'users[0][lastname]' => $lastname,
            'users[0][email]' => strtolower($email),
        ];

        return self::curlPost($url, $data);
    }

    /**
     * Récupère le jeton personnel de l'utilisateur Moodle ("token" et "privatetoken")
     */
    public static function getUserPersonalToken($email, $password) {
        $url = MOODLE_URL . '/login/token.php';
        $data = [
            'username' => strtolower($email),
            'password' => $password,
            'service'  => 'moodle_mobile_app'
        ];

        return self::curlPost($url, $data);
    }

    /**
     * Récupère l'URL d'auto-login Moodle et la clé unique.
     */
    public static function getAutologinUrl($userToken, $privateToken) {
        $url = MOODLE_URL . '/webservice/rest/server.php';
        $data = [
            'wstoken' => $userToken,
            'privatetoken' => $privateToken,
            'moodlewsrestformat' => 'json',
            'wsfunction' => 'tool_mobile_get_autologin_key'
        ];

        return self::curlPost($url, $data, ['User-Agent: MoodleMobile']);
    }

    /**
     * Helper pour faire des requêtes POST cURL
     */
    private static function curlPost($url, $postData, $headers = []) {
        $options = [
            'http' => [
                'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
                'method'  => 'POST',
                'content' => http_build_query($postData),
                'ignore_errors' => true // to fetch HTTP error contents as well
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];

        // Ajouter les headers supplémentaires si présents
        if (!empty($headers)) {
            $options['http']['header'] .= implode("\r\n", $headers) . "\r\n";
        }

        $context  = stream_context_create($options);
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            error_log("Moodle API Error: Could not reach Moodle Server ($url)");
            return null;
        }

        return json_decode($response, true);
    }
}
