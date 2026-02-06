-- =============================================================================
-- TEST 01: INSERTION DE DONNÉES VALIDES (HAPPY PATH) - REVISITED
-- =============================================================================
-- Usage : mysql -u portal_user -p portal_db < sql/tests/01_insert_valid_data.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE students;
TRUNCATE TABLE categories;
TRUNCATE TABLE instructors;
TRUNCATE TABLE administrators;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insérer des Administrateurs (Noms Camerounais)
INSERT INTO administrators (last_name, first_name, email, password_hash, type, status)
VALUES 
('Atangana', 'Roger', 'atangana.roger@portal.com', 'hashed_pass_1', 'SUPER_ADMIN', 'ACTIVE'),
('Kamdem', 'Sylvain', 'kamdem.sylvain@portal.com', 'hashed_pass_2', 'STANDARD_ADMIN', 'ACTIVE');

-- 2. Insérer des Instructeurs
INSERT INTO instructors (full_name, professional_title, organization, short_bio)
VALUES
('Dr. Nguema Paul', 'Expert IA & Big Data', 'Université de Yaoundé I', 'Chercheur renommé en intelligence artificielle.'),
('Mme Mballa Sarah', 'Architecte Logiciel', 'CamTel', 'Spécialiste des systèmes distribués.');

-- 3. Insérer des Catégories
INSERT INTO categories (name, slug, description, parent_id)
VALUES
('Développement', 'developpement', 'Tout sur le code', NULL);

SET @dev_id = LAST_INSERT_ID();

INSERT INTO categories (name, slug, description, parent_id)
VALUES
('Web Backend', 'web-backend', 'PHP, Java, etc.', @dev_id),
('Data Science', 'data-science', 'IA, Python', @dev_id);

-- 4. Insérer des Étudiants
INSERT INTO students (last_name, first_name, email, password)
VALUES
('Abessolo', 'Jean', 'abessolo.jean@test.com', 'pass1'),
('Kenfack', 'Junior', 'kenfack.junior@test.com', 'pass2');

-- 5. Insérer des Cours
SET @admin_id = (SELECT id FROM administrators WHERE email = 'atangana.roger@portal.com');
SET @instructor_id = (SELECT id FROM instructors WHERE full_name = 'Dr. Nguema Paul');
SET @category_id = (SELECT id FROM categories WHERE slug = 'web-backend' LIMIT 1);

INSERT INTO courses (
    administrator_id, instructor_id, category_id,
    title, slug, short_synopsis, full_description,
    pedagogical_objectives, target_audience, prerequisites,
    total_duration_minutes, level, language, format, status, published_at
) VALUES (
    @admin_id, @instructor_id, @category_id,
    'Maîtriser PHP Moderne', 'maitriser-php-moderne', 'Cours complet sur PHP 8', 'Description détaillée sur le PHP moderne...',
    '["Comprendre la POO", "Utiliser PDO", "Créer une API"]', 
    '["Débutants", "Intermédiaires"]', 
    '["HTML/CSS bases"]', 
    600, 'INTERMEDIATE', 'FR', 'VIDEO', 'PUBLISHED', NOW()
);

-- 6. Insérer des Inscriptions
SET @course_id = (SELECT id FROM courses WHERE slug = 'maitriser-php-moderne' LIMIT 1);
SET @student1_id = (SELECT id FROM students WHERE email = 'abessolo.jean@test.com');
SET @student2_id = (SELECT id FROM students WHERE email = 'kenfack.junior@test.com');

INSERT INTO enrollments (student_id, course_id, status) VALUES 
(@student1_id, @course_id, 'PENDING'),
(@student2_id, @course_id, 'DONE');

SELECT "TEST 01 : Succès - Données (Noms Camerounais) insérées." AS Result;
