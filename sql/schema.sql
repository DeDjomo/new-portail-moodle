-- =============================================================================
-- SCHÉMA DE BASE DE DONNÉES DU PORTAIL DE FORMATION
-- =============================================================================
-- Ce script crée l'ensemble des tables nécessaires pour le backend PHP.
-- Il respecte le modèle logique de données défini dans le dossier diagrams.
--
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0; -- Désactive temporairement les contraintes pour éviter les erreurs d'ordre

-- -----------------------------------------------------------------------------
-- 1. TABLE : ADMINISTRATORS
-- -----------------------------------------------------------------------------
-- Stocke les comptes des administrateurs du système.
-- Un administrateur peut être SUPER_ADMIN (accès complet) ou STANDARD_ADMIN.
DROP TABLE IF EXISTS `administrators`;
CREATE TABLE `administrators` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,                -- Identifiant unique
    `last_name` VARCHAR(100) NOT NULL,                     -- Nom de famille
    `first_name` VARCHAR(100) NOT NULL,                    -- Prénom
    `email` VARCHAR(255) NOT NULL UNIQUE,                  -- Email (login), doit être unique
    `password_hash` VARCHAR(255) NOT NULL,                 -- Mot de passe haché (ex: bcrypt/argon2)
    `type` ENUM('SUPER_ADMIN', 'STANDARD_ADMIN') NOT NULL DEFAULT 'STANDARD_ADMIN', -- Rôle
    `status` ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',      -- État du compte
    `avatar_url` VARCHAR(255),                             -- URL vers l'image de profil (nullable)
    `phone` VARCHAR(20),                                   -- Numéro de téléphone 
    `last_login` DATETIME,                                 -- Timestamp de la dernière connexion réussie
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Date de création automatique
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Date de maj automatique
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table des administrateurs du back-office';

-- -----------------------------------------------------------------------------
-- 2. TABLE : INSTRUCTORS
-- -----------------------------------------------------------------------------
-- Stocke les profils des formateurs/instructeurs.
-- Ces profils sont affichés sur la page du cours mais ne se connectent pas au système.
DROP TABLE IF EXISTS `instructors`;
CREATE TABLE `instructors` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(150) NOT NULL,          -- Nom complet affiché
    `professional_title` VARCHAR(150),          -- Ex: "Expert DevOps", "PhD en Mathématiques"
    `organization` VARCHAR(150),                -- Entreprise ou institution de rattachement
    `short_bio` TEXT,                           -- Biographie courte pour les aperçus
    `full_bio` TEXT,                            -- Biographie complète pour la page détail
    `photo_url` VARCHAR(255),                   -- URL de la photo de l'instructeur
    `website` VARCHAR(255),                     -- Site web personnel
    `linkedin_url` VARCHAR(255),                -- Profil LinkedIn
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table des profils instructeurs';

-- -----------------------------------------------------------------------------
-- 3. TABLE : CATEGORIES
-- -----------------------------------------------------------------------------
-- Organisation hiérarchique des cours (ex: Développement > Web > Backend).
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,               -- Nom de la catégorie (ex: "Développement Web")
    `slug` VARCHAR(100) NOT NULL UNIQUE,        -- Identifiant URL (ex: "developpement-web")
    `description` TEXT,                         -- Description de la catégorie
    `parent_id` BIGINT NULL,                    -- ID de la catégorie parente (NULL si racine)
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clé étrangère auto-référencée pour la hiérarchie
    CONSTRAINT `fk_category_parent` 
        FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catégories de cours (structure arborescente)';

-- -----------------------------------------------------------------------------
-- 4. TABLE : STUDENTS (ETUDIANTS)
-- -----------------------------------------------------------------------------
-- Comptes des utilisateurs finaux (étudiants) qui s'inscrivent aux cours.
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `last_name` VARCHAR(100) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,       -- Email unique pour login
    `major` VARCHAR(100),                       -- Filière ou spécialité de l'étudiant
    `level` VARCHAR(50),                        -- Niveau d'études (ex: "Licence 3")
    `phone` VARCHAR(20),                        -- Téléphone de contact
    `password` VARCHAR(255) NOT NULL,           -- Mot de passe haché
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table des étudiants inscrits';

-- -----------------------------------------------------------------------------
-- 5. TABLE : COURSES (COURS)
-- -----------------------------------------------------------------------------
-- Table centrale contenant toutes les informations sur les formations.
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relations obligatoires
    `administrator_id` BIGINT NOT NULL,         -- Admin créateur du cours
    `instructor_id` BIGINT NOT NULL,            -- Instructeur qui dispense le cours
    `category_id` BIGINT NULL,                  -- Catégorie principale (peut être null si suppression cat)
    
    -- Informations principales
    `title` VARCHAR(255) NOT NULL,              -- Titre du cours
    `slug` VARCHAR(255) NOT NULL UNIQUE,        -- URL friendly (ex: "cours-php-complet")
    `short_synopsis` TEXT,                      -- Résumé court (carte d'aperçu)
    `full_description` TEXT,                    -- Description complète (HTML ou Markdown)
    
    -- Contenu détaillé (stocké en JSON pour flexibilité)
    `pedagogical_objectives` JSON,              -- Liste des objectifs ["Obj1", "Obj2"]
    `target_audience` JSON,                     -- Liste du public cible
    `prerequisites` JSON,                       -- Liste des prérequis
    
    -- Détails techniques
    `total_duration_minutes` INT,               -- Durée totale estimée en minutes
    `level` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'), -- Niveau de difficulté
    `language` ENUM('FR', 'EN'),                -- Langue du cours
    `format` ENUM('VIDEO', 'TEXT', 'MIXED'),    -- Format pédagogique
    `is_certifying` BOOLEAN DEFAULT FALSE,      -- Si le cours donne lieu à une certif
    
    -- État et Publication
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED') DEFAULT 'DRAFT',
    `published_at` DATETIME,                    -- Date de mise en ligne effective
    
    -- SEO et Statistiques
    `meta_title` VARCHAR(255),                  -- Tire pour balise <title>
    `meta_description` TEXT,                    -- Description pour meta tag
    `enrolled_count` INT DEFAULT 0,             -- Nombre total d'étudiants inscrits (cache)
    
    -- Médias
    `image_url` VARCHAR(255),                   -- Image de couverture du cours
    `video_url` VARCHAR(255),                   -- Vidéo de présentation (teaser)
    `moodle_url` VARCHAR(255),                  -- Lien vers la plateforme LMS externe
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Contraintes de clés étrangères
    CONSTRAINT `fk_course_admin`
        FOREIGN KEY (`administrator_id`) REFERENCES `administrators`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_course_instructor`
        FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_course_category`
        FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table principale des cours';

-- -----------------------------------------------------------------------------
-- 6. TABLE : ENROLLMENTS (INSCRIPTIONS)
-- -----------------------------------------------------------------------------
-- Table d'association "Many-to-Many" entre Students et Courses.
-- Gère l'inscription d'un étudiant à un cours.
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
    `student_id` BIGINT NOT NULL,
    `course_id` BIGINT NOT NULL,
    
    -- État de l'inscription (Workflow Export)
    -- PENDING : Inscrit, mais pas encore exporté/traité par l'admin
    -- DONE : Inscrit et traité (exporté)
    `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'PENDING',
    
    `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date d'inscription
    
    PRIMARY KEY (`student_id`, `course_id`), -- Un étudiant ne peut s'inscrire qu'une fois au même cours
    
    CONSTRAINT `fk_enrollment_student`
        FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_enrollment_course`
        FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table de liaison Étudiants <-> Cours';

SET FOREIGN_KEY_CHECKS = 1; -- Réactivation des contraintes
