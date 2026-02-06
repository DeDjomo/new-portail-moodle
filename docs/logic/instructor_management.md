# Spécifications : Gestion des Instructeurs

Ce document détaille la logique du contrôleur pour la gestion des profils d'instructeurs (formateurs). Contrairement aux administrateurs, les instructeurs n'ont pas de compte de connexion, ce sont des profils de présentation.

## 1. Analyse des Champs

### A. Champs Obligatoires
| Champ | Type | Description |
| :--- | :--- | :--- |
| `full_name` | String | Nom complet affiché sur la plateforme. |

### B. Champs Optionnels
| Champ | Type | Description |
| :--- | :--- | :--- |
| `professional_title` | String | Titre/Expertise (ex: "Expert Cloud AWS"). |
| `organization` | String | Entreprise ou institution d'origine. |
| `short_bio` | Text | Résumé de la biographie (liste). |
| `full_bio` | Text | Biographie complète (détail). |
| `photo` | File | Image traitée via `FileUploader` (devient `photo_url`). |
| `website` | String | URL du site personnel. |
| `linkedin_url` | String | Lien vers le profil LinkedIn. |
| `status` | Enum | `ACTIVE` (par défaut) ou `DELETED`. |

### C. Champs Système
- `id` : Géré par la base de données.
- `created_at` / `updated_at` : Timestamps automatiques.

---

## 2. Logique Métier

### 1. Création & Modification
- **Upload de Photo** : Utilisation du service `FileUploader` ciblant le dossier `uploads/instructors/`.
- **Validation** : Vérifier que `full_name` n'est pas vide.
- **Normalisation** : Nettoyage des chaînes de caractères (trim).

### 2. Suppression (Soft Delete)
- Comme pour les autres entités, la suppression est logique.
- **Action** : Le statut passe à `'DELETED'`.
- **Contrainte** : Un instructeur ne peut pas être supprimé s'il est lié à un cours **actif** (optionnel, à valider selon le besoin de cohérence).

---

## 3. Workflow du Contrôleur (Pseudo-code)

### Create (`POST /instructors`)
```php
// 1. Valider full_name
// 2. Traiter l'upload de photo si présente
// 3. Mapper les champs optionnels
// 4. Appeler $model->create()
// 5. Retourner 201 Created
```

### Update (`PUT /instructors/{id}`)
```php
// 1. Vérifier l'existence de l'instructeur
// 2. Si nouvelle photo -> Upload et suppression de l'ancienne
// 3. Mettre à jour les champs fournis
// 4. Appeler $model->update()
```
