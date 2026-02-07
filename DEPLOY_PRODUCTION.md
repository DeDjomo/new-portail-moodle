# 🌐 Guide de Déploiement en Production

Ce guide explique comment déployer le portail de formation sur un serveur de production.

## Prérequis Serveur

### Configuration minimale

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| RAM | 1 GB | 2 GB |
| CPU | 1 vCPU | 2 vCPU |
| Stockage | 10 GB | 20 GB |
| OS | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |

### Logiciels requis

- Apache 2.4+ ou Nginx
- PHP 8.0+ avec extensions (pdo_mysql, json, mbstring, fileinfo)
- MySQL 8.0+ ou MariaDB 10.5+
- Git
- Certbot (pour SSL)

## Installation sur Ubuntu/Debian

### 1. Installer les dépendances

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Apache, PHP et MySQL
sudo apt install -y apache2 php php-mysql php-mbstring php-json php-fileinfo mysql-server git

# Activer les modules Apache
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### 2. Configurer MySQL

```bash
# Sécuriser MySQL
sudo mysql_secure_installation

# Créer la base de données
sudo mysql -u root -p
```

```sql
CREATE DATABASE portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE_SECURISE';
GRANT ALL PRIVILEGES ON portal.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Déployer le code

```bash
# Cloner dans /var/www
cd /var/www
sudo git clone <repo-url> portal
sudo chown -R www-data:www-data portal
```

### 4. Initialiser la base de données

```bash
mysql -u portal_user -p portal < /var/www/portal/backend/sql/schema.sql
mysql -u portal_user -p portal < /var/www/portal/backend/sql/seed_database.sql
```

### 5. Configurer la connexion

Éditer `/var/www/portal/backend/src/Utils/Database.php` :

```php
private static $config = [
    'host' => 'localhost',
    'dbname' => 'portal',
    'username' => 'portal_user',
    'password' => 'MOT_DE_PASSE_SECURISE',
    'charset' => 'utf8mb4'
];
```

### 6. Configurer les permissions

```bash
sudo mkdir -p /var/www/portal/backend/public/uploads/{avatars,courses}
sudo chown -R www-data:www-data /var/www/portal/backend/public/uploads
sudo chmod -R 755 /var/www/portal/backend/public/uploads
```

## Configuration Apache

### VirtualHost pour l'API (port 8000)

Créer `/etc/apache2/sites-available/portal-api.conf` :

```apache
Listen 8000
<VirtualHost *:8000>
    ServerName votre-domaine.com
    DocumentRoot /var/www/portal/backend/public
    
    <Directory /var/www/portal/backend/public>
        AllowOverride All
        Require all granted
        
        # URL Rewriting
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    # CORS Headers
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
    
    ErrorLog ${APACHE_LOG_DIR}/portal-api-error.log
    CustomLog ${APACHE_LOG_DIR}/portal-api-access.log combined
</VirtualHost>
```

### VirtualHost pour le Frontend (port 80/443)

Créer `/etc/apache2/sites-available/portal-frontend.conf` :

```apache
<VirtualHost *:80>
    ServerName votre-domaine.com
    DocumentRoot /var/www/portal/frontend
    
    <Directory /var/www/portal/frontend>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/portal-frontend-error.log
    CustomLog ${APACHE_LOG_DIR}/portal-frontend-access.log combined
</VirtualHost>
```

### Activer les sites

```bash
sudo a2enmod headers rewrite
sudo a2ensite portal-api.conf portal-frontend.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

## Configuration Nginx (Alternative)

### Backend API

```nginx
# /etc/nginx/sites-available/portal-api
server {
    listen 8000;
    server_name votre-domaine.com;
    root /var/www/portal/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
}
```

### Frontend

```nginx
# /etc/nginx/sites-available/portal-frontend
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/portal/frontend;
    index index.html catalog.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## Configuration SSL avec Certbot

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-apache

# Générer le certificat
sudo certbot --apache -d votre-domaine.com

# Renouvellement automatique
sudo systemctl enable certbot.timer
```

## Configurer l'URL de l'API dans le Frontend

Éditer `/var/www/portal/frontend/src/services/api.js` :

```javascript
const BASE_URL = 'https://votre-domaine.com:8000';
// ou si vous utilisez un sous-domaine
const BASE_URL = 'https://api.votre-domaine.com';
```

## Configuration Email (Optionnel)

Éditer `/var/www/portal/backend/src/Utils/EmailService.php` avec vos paramètres SMTP :

```php
private static $smtpHost = 'smtp.gmail.com';
private static $smtpPort = 587;
private static $smtpUser = 'votre-email@gmail.com';
private static $smtpPass = 'mot-de-passe-application';
```

## Sécurisation Production

### 1. Désactiver les erreurs PHP

Éditer `/etc/php/8.1/apache2/php.ini` :

```ini
display_errors = Off
log_errors = On
error_log = /var/log/php/errors.log
```

### 2. Configurer le pare-feu

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### 3. Changer les mots de passe par défaut

Connectez-vous en tant que Super Admin et changez immédiatement les mots de passe des comptes par défaut.

## Mise à jour du code

```bash
cd /var/www/portal
sudo git pull origin main
sudo chown -R www-data:www-data .
sudo systemctl restart apache2
```

## Sauvegarde

### Script de sauvegarde

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/portal"

mkdir -p $BACKUP_DIR

# Sauvegarde BDD
mysqldump -u portal_user -p'MOT_DE_PASSE' portal > $BACKUP_DIR/db_$DATE.sql

# Sauvegarde uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/portal/backend/public/uploads

# Nettoyer les sauvegardes > 7 jours
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Cron job quotidien

```bash
sudo crontab -e
# Ajouter :
0 2 * * * /var/www/portal/backup.sh
```

## Monitoring

### Vérifier les logs

```bash
# Apache
tail -f /var/log/apache2/portal-api-error.log
tail -f /var/log/apache2/portal-frontend-error.log

# MySQL
tail -f /var/log/mysql/error.log
```

### Vérifier les services

```bash
sudo systemctl status apache2
sudo systemctl status mysql
```

## Dépannage

| Problème | Solution |
|----------|----------|
| 500 Internal Server Error | Vérifier les logs Apache, permissions des fichiers |
| Connection refused API | Vérifier que le port 8000 est ouvert |
| Images non chargées | Vérifier les permissions du dossier uploads |
| CORS errors | Vérifier les headers dans la config Apache |

## Support

En cas de problème, vérifier :
1. Les logs d'erreur Apache/Nginx
2. Les logs PHP
3. La connectivité MySQL
4. Les permissions des fichiers
