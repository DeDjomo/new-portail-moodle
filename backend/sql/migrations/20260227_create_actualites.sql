-- =============================================================================
-- MIGRATION : CRÉATION DES TABLES POUR LES ACTUALITÉS
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. TABLE : ACTUALITES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `actualites`;
CREATE TABLE `actualites` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `video_url` VARCHAR(255) NOT NULL, -- Vidéo obligatoire
    `image_url` VARCHAR(255),          -- Image optionnelle
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table des actualités du portail';

-- -----------------------------------------------------------------------------
-- 2. TABLE : ACTUALITE_COURSES (LIAISON N:M)
-- -----------------------------------------------------------------------------
-- Une actualité peut présenter plusieurs cours.
DROP TABLE IF EXISTS `actualite_courses`;
CREATE TABLE `actualite_courses` (
    `actualite_id` BIGINT NOT NULL,
    `course_id` BIGINT NOT NULL,
    PRIMARY KEY (`actualite_id`, `course_id`),
    CONSTRAINT `fk_ac_actualite` FOREIGN KEY (`actualite_id`) REFERENCES `actualites`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ac_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Liaison entre Actualités et Cours';

SET FOREIGN_KEY_CHECKS = 1;
