# Spécifications : Création d'un Administrateur

Ce document détaille la logique métier et les règles de validation pour la création d'un compte administrateur dans le système.

## 1. Analyse des Champs

### A. Champs Obligatoires (Requis dans la requête)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `last_name` | String | Nom de famille de l'administrateur. |
| `first_name` | String | Prénom de l'administrateur. |
| `email` | String | Identifiant unique (format email valide). |
| `password` | String | Mot de passe en clair (sera haché avant insertion). |
| `type` | Enum | `SUPER_ADMIN` ou `STANDARD_ADMIN`. |

### B. Champs Optionnels (Acceptés par le contrôleur)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `status` | Enum | Par défaut `ACTIVE`. Peut être `SUSPENDED` ou `DELETED`. |
| `avatar_url` | String | URL vers l'image de profil (nullable). |
| `phone` | String | Numéro de téléphone (nullable). |
| `last_login` | Datetime | Peut être forcé manuellement (rare), sinon géré par le système. |

### C. Champs Système (Auto-gérés ou Internes)
| Champ | Type | Source |
| :--- | :--- | :--- |
| `id` | BigInt | Auto-incrément (MySQL). |
| `created_at` | Timestamp | Date de création (MySQL). |
| `updated_at` | Timestamp | Date de modification (MySQL). |
| `password_hash` | String | Résultat du hachage de `password`. |
| `last_login` | Datetime | Initialement `NULL`. |

---

## 2. Logique Métier & Actions Différées

La création d'un administrateur suit le flux logique suivant :

### 1. Validation & Intégrité
- **Validation Syntaxique** : Vérifier que tous les champs obligatoires sont présents et que l'email est valide.
- **Vérification d'Unicité** : S'assurer que l'adresse `email` ne figure pas déjà dans la table `administrators`.
- **Hachage** : Utiliser `password_hash()` avec l'algorithme BCRYPT pour sécuriser le mot de passe.

### 2. Normalisation des Données
- Convertir l'email en minuscules (`strtolower`).
- Formater les noms (ex: Première lettre en majuscule).

### 3. Persistance
- Appel au modèle `Administrator` pour l'insertion en base de données.

### 4. Actions Différées (Post-création)
- **Notification par Email** (À implémenter ultérieurement) :
    - Envoi d'un mail de bienvenue contenant le lien vers le portail.
    - Information sur le type de compte créé.
- **Audit Logging** : Enregistrer l'action de création dans un journal d'audit (qui a créé qui, et quand).

---

## 3. Workflow du Contrôleur (Pseudo-code)

```php
// 1. Récupération des données POST
// 2. Validation (Is Required? Email valid? Type valid?)
// 3. IF email_exists() THEN Return Error 409 (Conflict)
// 4. Hash password
// 5. Save to Database
// 6. IF Success THEN 
//      // TODO: Trigger WelcomeEmail (Deferred)
//      Return Success 201 (Created)
//    ELSE Return Error 500
```
