# Spécifications : Gestion des Administrateurs (Update & Delete)

Ce document détaille la logique de modification et de suppression des comptes administrateurs.

## 1. Modification (Update)

### A. Champs Modifiables
L'administrateur peut mettre à jour les informations suivantes :
- `first_name`, `last_name`
- `email` (avec vérification d'unicité si changé)
- `phone`, `avatar_url`
- `type` (Super Admin vs Standard Admin)
- `status` (Active, Suspended)

> [!IMPORTANT]
> Le mot de passe (`password`) doit être géré via un endpoint séparé ou un champ optionnel spécifique pour éviter les ré-hachages accidentels.

### B. Règles Métier (Update)
1. **Unicité de l'Email** : Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé par un autre compte (exclure l'ID actuel de la recherche).
2. **Protection Super-Admin** : Un administrateur standard ne peut pas changer son propre type en `SUPER_ADMIN` (nécessite une autorisation).
3. **Consistance** : Convertir l'email en minuscules.

---

## 2. Suppression (Delete/Soft Delete)

Comme convenu, la suppression est **logique** (Soft Delete).

### A. Règles Métier (Delete)
1. **Légalité de la Suppression** :
   - Un administrateur ne peut pas se supprimer lui-même (risque de verrouillage du système).
   - **Protection du dernier Super-Admin** : Le système doit empêcher la suppression du dernier Super-Admin actif pour garantir que le portail reste gérable.
2. **Action** : Appeler la méthode `delete($id)` du modèle qui passe le statut à `'DELETED'`.
3. **Conséquences** :
   - Le compte n'apparaît plus dans les listes.
   - Le compte ne peut plus se connecter.
   - Les données restent en base pour l'historique/audit.

---

## 3. Workflow du Contrôleur (Pseudo-code)

### Update
```php
// 1. Charger l'admin existant via $id
// 2. Valider les données reçues
// 3. IF email a changé AND email_exists($new_email, $exclude_id) THEN Return 409
// 4. Mettre à jour les propriétés du modèle
// 5. Appeler $model->update()
// 6. Return 200 + Updated Admin
```

### Delete
```php
// 1. IF $target_id == $_SESSION['admin_id'] THEN Return 400 ("Impossible de se supprimer soi-même")
// 2. IF is_last_super_admin($target_id) THEN Return 400 ("Impossible de supprimer le dernier Super Admin")
// 3. Appeler $model->delete($target_id)
// 4. Return 204 (No Content)
```
