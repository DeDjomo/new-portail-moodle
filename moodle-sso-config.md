# Configuration de Moodle pour le Single Sign-On (SSO)

Cette documentation decrit la procedure etape par etape pour configurer le serveur Moodle afin de permettre au portail de generer les cles d'auto-connexion.

Connectez-vous a Moodle avec un compte Administrateur, puis suivez les instructions ci-dessous :

## Etape 1 : Activer les services web globaux
Moodle bloque les communications API par defaut.
1. Allez dans **Administration du site** > **General** > **Fonctions avancees**.
2. Descendez dans la page jusqu'a trouver l'option **Activer les services web** (`enablewebservices`).
3. Cochez la case.
4. Cliquez sur **Enregistrer les modifications** tout en bas de la page.

## Etape 2 : Activer le protocole "REST"
Le portail communiquera avec Moodle via des requetes HTTP REST.
1. Allez dans **Administration du site** > **Serveurs** > **Services web** > **Gerer les protocoles**.
2. Trouvez la ligne correspondante au **Protocole REST** (`rest`).
3. Cliquez sur l'icone activer (habituellement un oeil barre) pour l'activer.
4. Cliquez sur **Enregistrer les modifications**.

## Etape 3 : Activer le service Mobile
La fonction permettant de generer la cle d'auto-connexion (`tool_mobile_get_autologin_key`) fait partie du service web pour l'application mobile Moodle. Nous utilisons ce service car il est securise et natif.
1. Allez dans **Administration du site** > **General** > **Fonctions avancees**.
2. Assurez-vous que **Activer les services web pour les appareils mobiles** (`enablewebservicesmobile`) est coche. Si ce n'est pas le cas, cochez-le et enregistrez.

*(Note : Si l'option ne se trouve pas dans "Fonctions avancees", cherchez dans **Administration du site** > **App Mobile** > **Serveur mobile** > Activer les services web mobile)*

## Etape 4 : Autoriser l'auto-connexion
Il faut s'assurer que Moodle accepte bien les cles d'auto-connexion (Autologin).
1. Allez dans **Administration du site** > **App Mobile** > **Fonctionnalites de l'app mobile**.
2. Cherchez le champ nomme **Type d'authentification** ou **Activer l'auto-connexion** (`autologin`). Assurez-vous que la fonctionnalite est permise.
*(Dans les versions recentes de Moodle, cette fonctionnalite est activee par defaut des que le service mobile est actif).*

## Etape 5 : Creer le Jeton d'acces (Token) secret
Le portail aura besoin d'un token pour s'authentifier aupres de Moodle en tant qu'administrateur afin de demander les cles pour chaque etudiant.
1. Allez dans **Administration du site** > **Serveurs** > **Services web** > **Creer un jeton** (ou via *Gerer les jetons* puis *Ajouter*).
2. Dans le champ "Utilisateur", recherchez et **selectionnez votre compte Administrateur**.
3. Dans le champ "Service", selectionnez le service **Service web Moodle mobile** (`moodle_mobile_app`).
4. Ne mettez pas d'adresse IP restrictive ni de date de validite, sauf imperatif de securite strict.
5. Cliquez sur **Enregistrer modifications**.
6. **Une longue cle alphanumerique va s'afficher.** Copiez-la precieusement.

---

## Informations requises pour le portail
Une fois cette configuration terminee, vous devrez ajouter les informations suivantes dans le fichier `.server-credentials` du portail :
1. **L'URL de base du serveur Moodle**.
2. **Le Token secret** genere a l'Etape 5.
