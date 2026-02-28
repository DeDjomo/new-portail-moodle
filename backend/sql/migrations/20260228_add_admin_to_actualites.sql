-- Migration: Add administrator_id to actualites
-- Step 1: Add column (nullable initially for safety)
ALTER TABLE `actualites` 
ADD COLUMN `administrator_id` BIGINT NOT NULL AFTER `id`;

-- Step 2: Backfill existing rows with the first admin
UPDATE `actualites` SET `administrator_id` = (SELECT id FROM administrators ORDER BY id ASC LIMIT 1) WHERE administrator_id = 0;

-- Step 3: Add foreign key constraint
ALTER TABLE `actualites`
ADD CONSTRAINT `fk_actualite_admin` 
FOREIGN KEY (`administrator_id`) REFERENCES `administrators`(`id`) ON DELETE RESTRICT;
