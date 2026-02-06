# Spécifications : Gestion des Étudiants

Ce document détaille la logique du contrôleur pour la gestion des comptes étudiants, incluant l'inscription (registration), l'authentification et la gestion du profil.

## 1. Analyse des Champs

### A. Champs Obligatoires (Inscription)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `last_name` | String | Nom de famille. |
| `first_name` | String | Prénom. |
| `email` | String | Email unique (sert d'identifiant de connexion). |
| `password` | String | Mot de passe (sera haché avant stockage). |

### B. Champs Optionnels Profil
| Champ | Type | Description |
| :--- | :--- | :--- |
| `major` | String | Filière d'étude (ex: "Génie Logiciel"). |
| `level` | String | Niveau (ex: "Licence 3", "Master 1"). |
| `phone` | String | Numéro de téléphone. |
| `status` | Enum | `ACTIVE` (par défaut) ou `DELETED`. |

### C. Champs Système
- `id` : Géré par la base de données.
- `created_at` : Date d'inscription.

---

## 2. Logique Métier

### 1. Inscription (`Register`)
- **Unicité** : Vérifier que l'email n'est pas déjà utilisé par un autre étudiant actif.
- **Sécurité** : Utiliser `password_hash()` avec `PASSWORD_BCRYPT`.
- **Initialisation** : Le statut par défaut est `ACTIVE`.

### 2. Connexion (`Login`)
- Rechercher l'étudiant par son email.
- Vérifier si le compte n'est pas supprimé (`status != 'DELETED'`).
- Utiliser `password_verify()` pour valider le mot de passe.
- **Session** : Initialiser une session PHP (`$_SESSION['student_id']`) en cas de succès.

### 3. Gestion du Profil
- Mise à jour des informations personnelles.
- Un changement d'email nécessite une nouvelle vérification d'unicité.
- **Suppression** : Logique (Soft Delete) via le statut `'DELETED'`.

---

## 3. Workflow du Contrôleur (Pseudo-code)

### Register (`POST /students`)
```php
// 1. Valider last_name, first_name, email, password
// 2. Vérifier l'unicité de l'email
// 3. Hacher le mot de passe
// 4. Créer l'étudiant via le modèle
// 5. Retourner 201 Created
```

### Login (`POST /students/login`)
```php
// 1. Valider email, password
// 2. Trouver l'étudiant par email
// 3. Vérifier le mot de passe
// 4. Initialiser la session
// 5. Retourner les infos de l'étudiant (sans le mot de passe)
```
