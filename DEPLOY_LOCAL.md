# 🖥️ Guide de Déploiement Local

Ce guide explique comment configurer et lancer le portail de formation sur votre machine locale, quel que soit votre système d'exploitation.

## 📋 Prérequis Généraux

| Logiciel | Version minimale |
|----------|-----------------|
| PHP | 8.0+ |
| MySQL | 8.0+ |
| Git | 2.x |

---

## 🚀 Installation par Système d'Exploitation

### 🐧 Linux (Ubuntu/Debian/Fedora)

1. **Installer les dépendances** :
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install -y php php-mysql php-mbstring php-json php-fileinfo mysql-server git
   
   # Fedora
   sudo dnf install php php-mysqlnd php-mbstring php-json git mysql-server
   ```

2. **Utiliser le script automatique** (Recommandé) :
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### 🍎 macOS

1. **Installer Homebrew** (si non présent) :
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Installer les dépendances** :
   ```bash
   brew install php mysql git
   ```

3. **Lancer MySQL** :
   ```bash
   brew services start mysql
   ```

4. **Utiliser le script automatique** :
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### 🪟 Windows

#### Option A : Méthode Simple (XAMPP)
1. Téléchargez et installez [XAMPP](https://www.apachefriends.org/) (version avec PHP 8.0+).
2. Lancez **Apache** et **MySQL** depuis le panneau de contrôle XAMPP.
3. Utilisez **Git Bash** pour cloner le projet dans `C:\xampp\htdocs`.

#### Option B : Méthode Pro (WSL2) - Recommandé
1. Installez WSL2 avec Ubuntu : `wsl --install`.
2. Suivez ensuite les instructions pour **Linux** ci-dessus à l'intérieur de votre terminal Ubuntu.

---

## 🛠️ Configuration de la Base de Données

Si vous n'utilisez pas `start.sh`, suivez ces étapes manuellement :

1. **Créer la base de données** :
   ```sql
   CREATE DATABASE portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Initialiser le schéma et les données** :
   ```bash
   mysql -u root -p portal < backend/sql/schema.sql
   mysql -u root -p portal < backend/sql/seed_database.sql
   ```

3. **Configurer la connexion** :
   Éditer `backend/src/Utils/Database.php` avec vos accès MySQL.

---

## 📂 Permissions (Linux/macOS)

```bash
mkdir -p backend/public/uploads/{avatars,courses}
chmod -R 755 backend/public/uploads
```

---

## ⚡ Lancement Manuel des Serveurs

Ouvrez deux terminaux à la racine du projet :

**Terminal 1 (Backend)** :
```bash
php -S localhost:8000 -t backend/public
```

**Terminal 2 (Frontend)** :
```bash
php -S localhost:3000 -t frontend
```

---

## 🔐 Comptes de Test

| Type | Email | Mot de passe |
|------|-------|--------------|
| **Super Admin** | `superadmin@portailmoodle.cm` | `password123` |
| **Admin Standard** | `kamdem.sylvain@portal.com` | `Admin123!` |

---

## ❓ Résolution de problèmes

- **Erreur CORS** : Assurez-vous que le frontend appelle bien `http://localhost:8000`.
- **Extensions PHP** : Vérifiez que `extension=pdo_mysql` est décommenté dans votre `php.ini`.
- **MySQL Connection** : Sur Windows/XAMPP, laissez souvent le mot de passe vide (`''`) pour l'utilisateur `root`.
