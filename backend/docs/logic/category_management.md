# Spécifications : Gestion des Catégories

Ce document détaille la logique du contrôleur pour la gestion des catégories de cours. Les catégories peuvent être hiérarchiques (parent/enfant).

## 1. Analyse des Champs

### A. Champs Obligatoires
| Champ | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Nom de la catégorie (ex: "Développement Web"). |

### B. Champs Optionnels / Auto-générés
| Champ | Type | Description |
| :--- | :--- | :--- |
| `slug` | String | Identifiant URL unique. Si absent, généré à partir de `name`. |
| `description` | Text | Courte description de la thématique. |
| `parent_id` | BigInt | ID de la catégorie parente (nullable). |
| `status` | Enum | `ACTIVE` (par défaut) ou `DELETED`. |

### C. Champs Système
- `id` : Géré par la base de données.
- `created_at` / `updated_at` : Timestamps automatiques.

---

## 2. Logique Métier

### 1. Génération du Slug
- Transformer le `name` en minuscules, remplacer les espaces et caractères spéciaux par des tirets.
- Vérifier l'unicité du slug.

### 2. Hiérarchie
- Un `parent_id` doit correspondre à une catégorie existante et **active**.
- Empêcher une catégorie d'être son propre parent.

### 3. Suppression (Soft Delete)
- Le statut passe à `'DELETED'`.
- **Règle de cascade logique** : Si une catégorie est supprimée, ses sous-catégories doivent-elles être également marquées comme supprimées ? (À valider, mais recommandé pour la cohérence des filtres).

---

## 3. Workflow du Contrôleur (Pseudo-code)

### Create (`POST /categories`)
```php
// 1. Valider name
// 2. Générer slug si vide
// 3. Vérifier unicité du slug
// 4. Si parent_id présent, vérifier existence du parent
// 5. Appeler $model->create()
```

### Update (`PUT /categories/{id}`)
```php
// 1. Vérifier existence
// 2. Si name change, recalculer le slug (optionnel)
// 3. Empêcher parent_id == current_id
```
