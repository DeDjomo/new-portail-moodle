-- =============================================================================
-- TEST 03: OPÉRATIONS CRUD & CASCADES - UPDATED
-- =============================================================================

-- 1. READ
SELECT * FROM courses WHERE slug = 'maitriser-php-moderne';

-- 2. UPDATE
UPDATE courses 
SET title = 'Maîtriser PHP 8.3 & MySQL', enrolled_count = enrolled_count + 1
WHERE slug = 'maitriser-php-moderne';

SELECT title, enrolled_count FROM courses WHERE slug = 'maitriser-php-moderne';

-- 3. SOFT DELETE Admin (Test logique applicative)
-- Admin cible : Kamdem Sylvain
UPDATE administrators SET status = 'DELETED' WHERE email = 'kamdem.sylvain@portal.com';
SELECT email, status FROM administrators WHERE email = 'kamdem.sylvain@portal.com';

-- 4. DELETE & CASCADE
-- Étudiant cible : Abessolo Jean
SET @student_del_id = (SELECT id FROM students WHERE email = 'abessolo.jean@test.com');
SET @count_before = (SELECT COUNT(*) FROM enrollments WHERE student_id = @student_del_id);

SELECT CONCAT('Inscriptions avant suppression (Abessolo): ', @count_before) AS Info;

DELETE FROM students WHERE id = @student_del_id;

SET @count_after = (SELECT COUNT(*) FROM enrollments WHERE student_id = @student_del_id);

SELECT 
    CASE WHEN @count_after = 0 THEN 'TEST 4.1 [OK] : Suppression en cascade réussie pour Abessolo'
    ELSE 'TEST 4.1 [FAIL] : Inscriptions non supprimées'
    END AS Result;

SELECT "TEST 03 : Fin des tests CRUD." AS Summary;
