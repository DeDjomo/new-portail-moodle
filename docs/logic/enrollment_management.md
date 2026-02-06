# Spécifications : Gestion des Inscriptions (Enrollments)

Ce document détaille la logique du contrôleur pour l'inscription des étudiants aux cours, en respectant le diagramme d'états et d'activités.

## 1. Analyse des Champs

### A. Champs Requis
| Champ | Type | Description |
| :--- | :--- | :--- |
| `student_id` | BigInt | L'étudiant qui s'inscrit. |
| `course_id` | BigInt | Le cours concerné. |

### B. États (Status)
Conformément au `statemachine_enrollment.puml` :
- **PENDING** : État initial lors de l'inscription.
- **DONE** : Marqué après l'exportation de la liste par l'administrateur.

---

## 2. Logique Métier (Workflow d'Inscription)

### 1. Inscription (`POST /enrollments`)
Selon le diagramme d'activités, le processus suit ces étapes :
1.  **Validation** : Vérifier que l'étudiant et le cours existent et sont actifs.
2.  **Duplication** : Vérifier que l'étudiant n'est pas déjà inscrit à ce cours.
3.  **Création** : Créer l'enregistrement avec le statut `'PENDING'`.
4.  **Mise à jour Cours** : Incrémenter le champ `enrolled_count` dans la table `courses`.
5.  **Notifications** (Simulées) :
    - Envoyer un email de confirmation à l'étudiant.
    - Envoyer une notification à l'administrateur.

### 2. Exportation & Clôture
- Action déclenchée par l'administrateur.
- Lors de l'exportation des inscrits pour un cours, passer tous les enregistrements `PENDING` correspondants à l'état `DONE`.

---

## 3. Workflow du Contrôleur (Pseudo-code)

### Enroll (`POST /enrollments`)
```php
// 1. Recevoir student_id (ou email) et course_id
// 2. Vérifier existence et statut (Course must be PUBLISHED)
// 3. Vérifier si déjà inscrit
// 4. Enrollment->create(['status' => 'PENDING'])
// 5. Course->incrementEnrollmentCount($course_id)
// 6. Return success
```

### Mark as Done (`PUT /enrollments/mark-done`)
```php
// 1. Recevoir course_id
// 2. Mettre à jour tous les statuts 'PENDING' en 'DONE' pour ce cours
```
