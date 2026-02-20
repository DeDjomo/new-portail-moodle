-- Migration : Relation N:M pour les Instructeurs et ajout de la colonne prerequis
-- Cette migration préserve les données existantes.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Création de la table de liaison course_instructors
CREATE TABLE IF NOT EXISTS `course_instructors` (
    `course_id` BIGINT NOT NULL,
    `instructor_id` BIGINT NOT NULL,
    PRIMARY KEY (`course_id`, `instructor_id`),
    CONSTRAINT `fk_ci_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ci_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Migration des données existantes (si la colonne instructor_id existe encore)
INSERT IGNORE INTO `course_instructors` (course_id, instructor_id)
SELECT id, instructor_id FROM `courses` WHERE instructor_id IS NOT NULL;

-- 3. Ajout de la colonne 'prerequis' (si on veut suivre strictement le nom demandé par l'utilisateur)
-- Note: 'prerequisites' existe déjà, nous allons ajouter 'prerequis' ou s'assurer que l'utilisateur est satisfait du JSON existant.
-- Pour répondre strictement à la demande : "ajouter une colonne 'prerequis'"
ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `prerequis` TEXT AFTER `target_audience`;

SET FOREIGN_KEY_CHECKS = 1;
