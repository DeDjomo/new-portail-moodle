# Spécifications : Gestion des Téléchargements (Uploads)

Ce document détaille la manière dont le système gère les fichiers médias (avatars, photos, etc.).

## 1. Structure de Stockage
Les fichiers seront stockés dans le dossier `/public/uploads/`.
- Avatars : `/public/uploads/avatars/`
- Photos Instructeurs : `/public/uploads/instructors/`
- Images Cours : `/public/uploads/courses/`

## 2. Règles de Validation
Le contrôleur ou un service dédié doit vérifier :
- **Type MIME** : Uniquement images (JPEG, PNG, WEBP).
- **Extension** : `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Taille Max** : 2 Mo par défaut.
- **Nommage** : Renommer le fichier avec un identifiant unique (`uniqid`) pour éviter les collisions.

## 3. Logique de Traitement (Upload)
1. Vérifier si un fichier est présent dans `$_FILES`.
2. Valider le type et la taille.
3. Si un ancien fichier existait (cas d'une mise à jour), le supprimer du serveur.
4. Déplacer le nouveau fichier vers le destination.
5. Retourner l'URL/le chemin relatif à stocker en base de données.

## 4. Intégration dans les Contrôleurs
Les méthodes `create()` et `update()` doivent :
- Passer de la lecture de `JSON` à la lecture de `multipart/form-data` ou gérer les deux.
- Appeler le service d'upload pour le champ `avatar_url` (ou équivalent).
