-- =============================================================================
-- TEST 02: VÉRIFICATION DES CONTRAINTES (NEGATIVE TESTS)
-- =============================================================================
-- Objectif : Tenter de violer les contraintes pour vérifier qu'elles bloquent bien les insertions invalides.
-- Note : Ce script s'attend à échouer s'il est exécuté en bloc sans gestion d'erreur.
--        Ici, nous simulons via des procédures stockées ou simplement des commandes.
--        Pour un script simple, nous allons faire des blocs séparés.
-- =============================================================================

-- TEST 2.1 : Doublon d'email Administrateur (Doit échouer)
-- VALUES ('Doublon', 'Test', 'atangana.roger@portal.com', 'pass'); 
-- ERROR 1062 (23000): Duplicate entry 'atangana.roger@portal.com' for key 'administrators.email'

-- TEST 2.2 : Insertion d'un cours avec Admin inexistant (FK Violation)
-- INSERT INTO courses (administrator_id, instructor_id, title, slug) VALUES (9999, 1, 'Fake Course', 'fake-course');
-- ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails

-- TEST 2.3 : Valeur ENUM invalide
-- INSERT INTO courses (administrator_id, instructor_id, title, slug, level) VALUES (1, 1, 'Enum Test', 'enum-test', 'EXPERT_MASTER_GOD');
-- ERROR 1265 (01000): Data truncated for column 'level' at row 1

-- TEST 2.4 : Inscription en doublon (PK Violation)
-- SET @s_id = (SELECT id FROM students LIMIT 1);
-- SET @c_id = (SELECT id FROM courses LIMIT 1);
-- INSERT INTO enrollments (student_id, course_id) VALUES (@s_id, @c_id); -- Déjà inséré au Test 01
-- ERROR 1062 (23000): Duplicate entry '...' for key 'enrollments.PRIMARY'

-- Pour ce fichier, nous allons créer des PROCEDURES pour attraper les erreurs et afficher un message de succès
-- si l'erreur attendue se produit. C'est plus propre pour l'automatisation.

DELIMITER $$

DROP PROCEDURE IF EXISTS TestDuplicateEmail $$
CREATE PROCEDURE TestDuplicateEmail()
BEGIN
    DECLARE EXIT HANDLER FOR 1062 SELECT 'TEST 2.1 [OK] : Contrainte Email Unique respectée (Doublon bloqué)' AS Result;
    
    INSERT INTO administrators (last_name, first_name, email, password_hash)
    VALUES ('Fail', 'Guy', 'atangana.roger@portal.com', 'pass');
    
    SELECT 'TEST 2.1 [FAIL] : Le doublon a été accepté !' AS Result;
END $$

DROP PROCEDURE IF EXISTS TestInvalidFK $$
CREATE PROCEDURE TestInvalidFK()
BEGIN
    DECLARE EXIT HANDLER FOR 1452 SELECT 'TEST 2.2 [OK] : Contrainte FK Admin respectée (Admin inexistant bloqué)' AS Result;
    
    INSERT INTO courses (administrator_id, instructor_id, title, slug) 
    VALUES (999999, 1, 'Test FK Fail', 'fail-fk');
    
    SELECT 'TEST 2.2 [FAIL] : La FK invalide a été acceptée !' AS Result;
END $$

DELIMITER ;

CALL TestDuplicateEmail();
CALL TestInvalidFK();

SELECT "TEST 02 : Fin des vérifications de contraintes." AS Summary;
