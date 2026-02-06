-- =============================================================================
-- TEST 99: NETTOYAGE (CLEANUP)
-- =============================================================================
-- Objectif : Vider toutes les tables après les tests pour laisser la BDD propre.
--
-- Usage : mysql -u portal_user -p portal_db < sql/tests/99_cleanup.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE students;
TRUNCATE TABLE categories;
TRUNCATE TABLE instructors;
TRUNCATE TABLE administrators;

SET FOREIGN_KEY_CHECKS = 1;

SELECT "TEST 99 : Succès - La base de données a été vidée." AS Result;
