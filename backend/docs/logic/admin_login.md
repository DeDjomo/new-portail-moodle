# Spécifications : Authentification Administrateur

Ce document détaille la logique de connexion (Login) pour les administrateurs.

## 1. Analyse des Champs (Login)

### A. Champs Requis (Request Body)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `email` | String | L'adresse email de l'administrateur. |
| `password` | String | Le mot de passe en clair. |

### B. Réponse attendue
- **Succès (200 OK)** : Données de l'administrateur (ID, Nom, Prénom, Email, Type) et initialisation de la session.
- **Échec (401 Unauthorized)** : Message d'erreur générique ("Identifiants invalides") pour des raisons de sécurité.
- **Échec (403 Forbidden)** : Si le compte est `SUSPENDED` ou `DELETED`.

---

## 2. Logique Métier du Login

1.  **Recherche** : Trouver l'administrateur par son `email` dans la base de données.
2.  **Vérification de l'existence et du statut** :
    *   Si l'administrateur n'existe pas ou est marqué comme `DELETED` -> Échec.
    *   Si le statut est `SUSPENDED` -> Échec (Message spécifique : "Compte suspendu").
3.  **Vérification du mot de passe** :
    *   Utiliser `password_verify($password, $stored_hash)`.
4.  **Mise à jour Système** :
    *   Si succès, mettre à jour le champ `last_login` avec le timestamp actuel.
5.  **Gestion de Session** :
    *   Démarrer une session PHP (`session_start()`) et stocker les infos essentielles (`admin_id`, `admin_type`).

---

## 3. Workflow du Contrôleur (Pseudo-code)

```php
// 1. Recevoir email et password
// 2. $admin = $model->findByEmail($email)
// 3. IF !$admin OR $admin['status'] == 'DELETED' THEN Return 401
// 4. IF $admin['status'] == 'SUSPENDED' THEN Return 403 ("Account suspended")
// 5. IF password_verify($password, $admin['password_hash']) THEN
//      $model->updateLastLogin($admin['id'])
//      session_start()
//      $_SESSION['admin_id'] = $admin['id']
//      Return 200 + Admin Info
//    ELSE
//      Return 401
```
