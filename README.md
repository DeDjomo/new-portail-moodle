# 🎓 Portail de Formation ENSPY

Plateforme de gestion de formations en ligne développée pour l'École Nationale Supérieure Polytechnique de Yaoundé.

![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?logo=php)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript)

## 📋 Fonctionnalités

### 👨‍🎓 Côté Public
- Catalogue des cours avec filtres par catégorie
- Page de détails d'un cours (description, instructeur, contenu)
- Inscription aux cours via formulaire
- Affichage des instructeurs et biographies

### 👨‍💼 Administration Standard
- Tableau de bord avec statistiques
- Gestion des cours (CRUD, images, vidéos)
- Gestion des étudiants inscrits
- Export CSV des inscriptions
- Statistiques et graphiques
- Paramètres du profil

### 🛡️ Super Administration
- Vue globale de la plateforme
- Gestion des administrateurs
- Gestion des instructeurs
- Gestion des catégories
- Vue de tous les cours (tous admins)
- Accès aux fonctions admin standard

## 🛠️ Stack Technique

| Composant | Technologies |
|-----------|--------------|
| **Backend** | PHP 8.x, Architecture MVC custom |
| **Base de données** | MySQL 8.0 |
| **Frontend** | HTML5, CSS3, JavaScript ES6+ |
| **Serveur** | Apache/Nginx ou serveur PHP intégré |

## 📁 Structure du Projet

```
PortalNew/
├── backend/
│   ├── public/           # Point d'entrée (index.php)
│   │   └── uploads/      # Fichiers uploadés
│   ├── src/
│   │   ├── Controllers/  # Contrôleurs API
│   │   ├── Models/       # Modèles de données
│   │   └── Utils/        # Utilitaires (DB, Auth, Email)
│   └── sql/              # Scripts SQL
├── frontend/
│   ├── admin/            # Pages administration
│   ├── superadmin/       # Pages super-administration
│   ├── public/           # Assets statiques
│   └── src/
│       ├── services/     # Services API JS
│       └── views/        # Logique des pages
```

## 🚀 Démarrage Rapide

### Prérequis
- PHP 8.0+
- MySQL 8.0+
- Composer (optionnel)

### Installation

```bash
# 1. Cloner le repo
git clone <repo-url>
cd PortalNew

# 2. Configurer la base de données
mysql -u root -p < backend/sql/schema.sql
mysql -u root -p portal < backend/sql/seed_database.sql

# 3. Configurer les variables d'environnement
# Éditer backend/src/Utils/Database.php avec vos credentials

# 4. Lancer les serveurs
php -S localhost:8000 -t backend/public  # API Backend
php -S localhost:3000 -t frontend         # Frontend
```

### Accès
- **Catalogue public** : http://localhost:3000/catalog.html
- **Login admin** : http://localhost:3000/login.html

### Comptes par défaut

| Type | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | atangana.roger@portal.com | SuperAdmin123 |
| Admin Standard | bella.marie@portal.com | Admin123! |

## 📚 Documentation

- [Guide de déploiement local](./DEPLOY_LOCAL.md)
- [Guide de déploiement en production](./DEPLOY_PRODUCTION.md)

## 📧 Fonctionnalité Email

Le système envoie des emails lors des inscriptions aux cours. Configurer les paramètres SMTP dans `backend/src/Utils/EmailService.php`.

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Validation des entrées côté serveur
- Protection CORS configurée
- Tokens de session sécurisés

## 👥 Auteurs

- ENSPY - Équipe de développement

## 📄 Licence

Projet académique - ENSPY © 2026
