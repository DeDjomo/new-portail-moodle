# 🖥️ Guide de Déploiement Local

Ce guide explique comment configurer et lancer le portail de formation sur votre machine locale.

## Prérequis

### Logiciels requis

| Logiciel | Version minimale | Vérification |
|----------|-----------------|--------------|
| PHP | 8.0+ | `php -v` |
| MySQL | 8.0+ | `mysql --version` |
| Git | 2.x | `git --version` |

### Extensions PHP requises
```bash
# Vérifier les extensions installées
php -m

# Extensions nécessaires :
# - pdo_mysql
# - json
# - mbstring
# - fileinfo
```

## Installation étape par étape

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd PortalNew
```

### 2. Configurer MySQL

```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données
CREATE DATABASE portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Créer un utilisateur (optionnel mais recommandé)
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON portal.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Initialiser la base de données

```bash
# Créer les tables
mysql -u root -p portal < backend/sql/schema.sql

# Insérer les données de test
mysql -u root -p portal < backend/sql/seed_database.sql
```

### 4. Configurer la connexion base de données

Éditer le fichier `backend/src/Utils/Database.php` :

```php
private static $config = [
    'host' => 'localhost',
    'dbname' => 'portal',
    'username' => 'root',        // Votre utilisateur MySQL
    'password' => '',             // Votre mot de passe MySQL
    'charset' => 'utf8mb4'
];
```

### 5. Configurer les permissions

```bash
# Créer le dossier uploads s'il n'existe pas
mkdir -p backend/public/uploads/avatars
mkdir -p backend/public/uploads/courses

# Donner les permissions d'écriture
chmod -R 755 backend/public/uploads
```

### 6. Lancer les serveurs

Ouvrir **deux terminaux** :

**Terminal 1 - Backend API (port 8000)**
```bash
cd PortalNew
php -S localhost:8000 -t backend/public
```

**Terminal 2 - Frontend (port 3000)**
```bash
cd PortalNew
php -S localhost:3000 -t frontend
```

## Vérification de l'installation

### Test du backend

```bash
# Tester l'API
curl http://localhost:8000/categories

# Réponse attendue : JSON avec les catégories
```

### Test du frontend

Ouvrir dans le navigateur :
- http://localhost:3000/catalog.html → Catalogue des cours
- http://localhost:3000/login.html → Page de connexion

## Comptes de test

| Type | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | atangana.roger@portal.com | SuperAdmin123 |
| Admin Standard | bella.marie@portal.com | Admin123! |

## Résolution des problèmes courants

### Erreur "Connection refused"

```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql
sudo systemctl start mysql
```

### Erreur "Access denied for user"

Vérifier les credentials dans `Database.php` et les droits de l'utilisateur MySQL.

### Erreur CORS

Le backend inclut déjà les headers CORS. Si problème persiste, vérifier que le frontend appelle `localhost:8000` (pas 127.0.0.1).

### Images non affichées

```bash
# Vérifier les permissions
ls -la backend/public/uploads/

# Si nécessaire
chmod -R 755 backend/public/uploads/
```

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -i :8000

# Tuer le processus ou utiliser un autre port
php -S localhost:8001 -t backend/public
```

## Développement

### Structure des URLs API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /courses | Liste des cours |
| GET | /courses/{id} | Détail d'un cours |
| POST | /courses | Créer un cours |
| POST | /courses/{id} | Modifier un cours |
| DELETE | /courses/{id} | Supprimer un cours |
| GET | /categories | Liste des catégories |
| POST | /enrollments | Inscription à un cours |
| POST | /administrators/login | Connexion admin |

### Logs et débogage

Les erreurs PHP s'affichent dans le terminal du serveur backend.

Pour activer les logs détaillés, ajouter au début de `backend/public/index.php` :
```php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

## Arrêter les serveurs

Appuyer sur `Ctrl+C` dans chaque terminal pour arrêter les serveurs PHP.
