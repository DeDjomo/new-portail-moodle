# Spécifications : Gestion des Cours (Révisé)

Ce document détaille la logique du contrôleur pour la gestion des cours, intégrant les règles de transition d'état et les nouveaux champs obligatoires.

## 1. Analyse des Champs

### A. Champs Obligatoires (Strict)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `administrator_id` | BigInt | Créateur du cours. |
| `instructor_id` | BigInt | Instructeur associé. |
| `category_id` | BigInt | Catégorie associée. |
| `title` | String | Titre unique du cours. |
| `moodle_url` | String | **Obligatoire**. Lien direct vers l'espace Moodle. |

### B. Champs Déterminant l'État (Draft vs Published)
Pour passer à l'état `PUBLISHED`, les champs suivants doivent être renseignés :
- `short_synopsis`, `full_description`, `pedagogical_objectives`.
- `level`, `language`, `format`.
- `total_duration_minutes`.
- `image_url` (Via upload).

### C. Médias (Upload Obligatoire pour Publication)
- **Image** : Couverture du cours (Champ `image` dans `$_FILES`).
- **Vidéo** : Vidéo de présentation (Champ `video` dans `$_FILES`).
  - *Note : Les deux sont traités par `FileUploader` et stockés dans `public/uploads/courses/`.*

---

## 2. Cycle de Vie & Transitions (State Machine)

Conformément au diagramme d'états :

1.  **Création (`POST`)** :
    - Si toutes les infos sont présentes -> Statut `PUBLISHED`.
    - Si infos manquantes -> Statut `DRAFT`.
2.  **Mise à jour (`PUT`)** :
    - `DRAFT` -> `PUBLISHED` : Automatique si les infos deviennent complètes.
    - `PUBLISHED` -> `DRAFT` : Si l'utilisateur choisit de "Dépublier" pour modification.
    - `DRAFT` / `PUBLISHED` -> `ARCHIVED` : Action manuelle de l'administrateur.
3.  **Archivage** :
    - État terminal. Le cours n'est plus modifiable vers d'autres états (selon le diagramme).

---

## 3. Workflow du Contrôleur (Pseudo-code)

### Create (`POST /courses`)
```php
// 1. Valider Title, Admin, Instructor, Category, MoodleURL
// 2. Traiter Uploads (Image + Vidéo)
// 3. Vérifier si "Complet" (Synopsis, Description, Level, etc.)
// 4. IF Complet THEN status = 'PUBLISHED' ELSE status = 'DRAFT'
// 5. Save to Database
```

### Update (`PUT /courses/{id}`)
```php
// 1. Charger le cours actuel
// 2. Traiter les nouveaux fichiers si fournis (supprimer les anciens)
// 3. Évaluer le nouvel état possible (Complete info check)
// 4. Appeler $model->update()
```
