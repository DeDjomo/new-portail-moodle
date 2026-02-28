-- =========================================================================
-- SCRIPT DE MISE À JOUR BASE DE DONNÉES (POUR PHPMYADMIN EN PRODUCTION)
-- =========================================================================

-- 1. Création de la table des actualités
CREATE TABLE IF NOT EXISTS `actualites` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `video_url` VARCHAR(255) NULL, 
    `image_url` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Création de la table de liaison avec les cours
CREATE TABLE IF NOT EXISTS `actualite_courses` (
    `actualite_id` BIGINT NOT NULL,
    `course_id` BIGINT NOT NULL,
    PRIMARY KEY (`actualite_id`, `course_id`),
    CONSTRAINT `fk_actualite_link` FOREIGN KEY (`actualite_id`) REFERENCES `actualites`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_course_link` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Ajout de la liaison avec l'administrateur
ALTER TABLE `actualites` ADD COLUMN `administrator_id` BIGINT AFTER `id`;

-- Renseigne les actualités existantes avec le premier admin (sécurité)
UPDATE `actualites` SET `administrator_id` = (SELECT id FROM administrators ORDER BY id ASC LIMIT 1) WHERE administrator_id IS NULL OR administrator_id = 0;

-- Force la colonne à ne pas être nulle et applique la clé étrangère
ALTER TABLE `actualites` MODIFY COLUMN `administrator_id` BIGINT NOT NULL;

-- Ajout de la clé étrangère
ALTER TABLE `actualites`
ADD CONSTRAINT `fk_actualite_admin` 
FOREIGN KEY (`administrator_id`) REFERENCES `administrators`(`id`) ON DELETE RESTRICT;
