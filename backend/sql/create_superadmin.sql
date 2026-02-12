-- =============================================================================
-- SCRIPT DE CRÉATION D'UN COMPTE SUPERADMIN
-- =============================================================================
-- Email: superadmin@portailmoodle.cm
-- Password: password123
-- =============================================================================

INSERT INTO `administrators` (
    `last_name`, 
    `first_name`, 
    `email`, 
    `password_hash`, 
    `type`, 
    `status`
) VALUES (
    'Admin', 
    'Super', 
    'superadmin@portailmoodle.cm', 
    '$2y$10$urJqSyZxTzFPle8xxAlg9uvmK.2CIqcYukn6215sqSuc.jNdzBeHu', 
    'SUPER_ADMIN', 
    'ACTIVE'
);

SELECT "Compte SuperAdmin créé avec succès (superadmin@portailmoodle.cm / password123)" AS Result;
