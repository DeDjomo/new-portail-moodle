-- =============================================================================
-- SEED DATABASE : PORTAL APPLICATION
-- =============================================================================
-- Ce script peuple la base de données avec des données de tests réalistes.
-- Noms : Camerounais
-- Diversité : États variés (Active, Suspended, Published, Draft, etc.)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE students;
TRUNCATE TABLE categories;
TRUNCATE TABLE instructors;
TRUNCATE TABLE administrators;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. ADMINISTRATORS
INSERT INTO administrators (last_name, first_name, email, password_hash, type, status) VALUES
('Atangana', 'Roger', 'atangana.roger@portal.com', '$2y$10$p.1Q9fqtJH9p2KKKWl7p..pCguyJcbG.Wzplc8IbxLFhaNquUZEA.', 'SUPER_ADMIN', 'ACTIVE'),
('Kamdem', 'Sylvain', 'kamdem.sylvain@portal.com', '$2y$12$DrWktUsc5WJVedEK6gl7tu9KVwigQg546RstyD3TA7nnEXWJ0xg5a', 'STANDARD_ADMIN', 'ACTIVE'),
('Ewane', 'Thérèse', 'ewane.therese@portal.com', '$2y$10$p.1Q9fqtJH9p2KKKWl7p..pCguyJcbG.Wzplc8IbxLFhaNquUZEA.', 'STANDARD_ADMIN', 'SUSPENDED'),
('Ndjomo', 'Patrick', 'ndjomo.patrick@portal.com', '$2y$10$p.1Q9fqtJH9p2KKKWl7p..pCguyJcbG.Wzplc8IbxLFhaNquUZEA.', 'STANDARD_ADMIN', 'ACTIVE');

-- 2. INSTRUCTORS
INSERT INTO instructors (full_name, professional_title, organization, short_bio, full_bio) VALUES
('Dr. Nguema Paul', 'Expert IA & Data Science', 'Université de Yaoundé I', 'Expert certifié Google Cloud IA.', 'Plus de 15 ans d\'expérience dans l\'enseignement supérieur.'),
('Mme Mballa Sarah', 'Lead Architechte Java', 'CamTel', 'Ancienne ingénieure chez Orange.', 'Spécialiste Spring Boot et microservices.'),
('M. Tchakounté Guy', 'Senior Web Developer', 'Freelance / Open Source', 'Contributeur PHP core.', 'Passionné par l\'optimisation des performances web.'),
('Mme Fomena Lucie', 'Data Analyst', 'SCB Cameroun', 'Experte Excel et SQL.', 'Forme les cadres sur l\'analyse de données.');

-- 3. CATEGORIES
INSERT INTO categories (name, slug, description, parent_id) VALUES
('Programmation', 'programmation', 'Développement logiciel et algorithmes', NULL);
SET @cat_prog = LAST_INSERT_ID();

INSERT INTO categories (name, slug, description, parent_id) VALUES
('Analyse de Données', 'analyse-donnees', 'Excel, SQL, PowerBI', NULL);
SET @cat_data = LAST_INSERT_ID();

INSERT INTO categories (name, slug, description, parent_id) VALUES
('PHP & Backend', 'php-backend', 'PHP, Laravel, Symfony', @cat_prog),
('Java Ecosystem', 'java-eco', 'Java Core, Spring, Maven', @cat_prog),
('Bases de données SQL', 'sql-db', 'MySQL, PostgreSQL', @cat_data);

-- 4. STUDENTS
INSERT INTO students (last_name, first_name, email, major, level, phone, password) VALUES
('Abessolo', 'Jean', 'abessolo.jean@test.com', 'Informatique de Gestion', 'Master 1', '677000001', '$2y$10$passhash'),
('Kenfack', 'Junior', 'kenfack.junior@test.com', 'Réseaux & Télécoms', 'Licence 3', '699000002', '$2y$10$passhash'),
('Ngounou', 'Alice', 'ngounou.alice@test.com', 'Comptabilité', 'Master 2', '655000003', '$2y$10$passhash'),
('Teyim', 'Bertrand', 'teyim.bertrand@test.com', 'Génie Logiciel', 'Licence 2', '671000004', '$2y$10$passhash'),
('Essomba', 'Michel', 'essomba.michel@test.com', 'Marketing Digital', 'Master 1', '650000005', '$2y$10$passhash');

-- 5. COURSES
-- IDs refs
SET @adm_roger = (SELECT id FROM administrators WHERE email = 'atangana.roger@portal.com');
SET @adm_kamdem = (SELECT id FROM administrators WHERE email = 'kamdem.sylvain@portal.com');
SET @ins_nguema = (SELECT id FROM instructors WHERE full_name = 'Dr. Nguema Paul');
SET @ins_mballa = (SELECT id FROM instructors WHERE full_name = 'Mme Mballa Sarah');
SET @ins_tchak = (SELECT id FROM instructors WHERE full_name = 'M. Tchakounté Guy');
SET @cat_php = (SELECT id FROM categories WHERE slug = 'php-backend');
SET @cat_java = (SELECT id FROM categories WHERE slug = 'java-eco');
SET @cat_sql = (SELECT id FROM categories WHERE slug = 'sql-db');

INSERT INTO courses (administrator_id, instructor_id, category_id, title, slug, short_synopsis, level, language, format, status, enrolled_count) VALUES
(@adm_roger, @ins_tchak, @cat_php, 'PHP 8 de Zéro à Expert', 'php-8-zero-expert', 'Apprenez PHP sans aucun prérequis.', 'BEGINNER', 'FR', 'VIDEO', 'PUBLISHED', 45),
(@adm_roger, @ins_mballa, @cat_java, 'Masterclass Spring Boot', 'masterclass-spring-boot', 'Tout sur les microservices Java.', 'ADVANCED', 'FR', 'MIXED', 'PUBLISHED', 12),
(@adm_kamdem, @ins_tchak, @cat_php, 'Laravel 11 CRUD Rapide', 'laravel-11-crud', 'Créez votre premier projet en 1h.', 'INTERMEDIATE', 'FR', 'TEXT', 'DRAFT', 0),
(@adm_kamdem, @ins_nguema, @cat_sql, 'MySQL pour Développeurs', 'mysql-dev', 'Apprenez à optimiser vos requêtes.', 'INTERMEDIATE', 'FR', 'VIDEO', 'PUBLISHED', 30),
(@adm_roger, @ins_nguema, @cat_sql, 'SQL Avancé & Procédures', 'sql-avance', 'Maîtrisez les triggers et procédures.', 'ADVANCED', 'EN', 'TEXT', 'ARCHIVED', 5);

-- 6. ENROLLMENTS
SET @crs_php = (SELECT id FROM courses WHERE slug = 'php-8-zero-expert');
SET @crs_spring = (SELECT id FROM courses WHERE slug = 'masterclass-spring-boot');
SET @crs_mysql = (SELECT id FROM courses WHERE slug = 'mysql-dev');

SET @std_abessolo = (SELECT id FROM students WHERE email = 'abessolo.jean@test.com');
SET @std_kenfack = (SELECT id FROM students WHERE email = 'kenfack.junior@test.com');
SET @std_ngounou = (SELECT id FROM students WHERE email = 'ngounou.alice@test.com');
SET @std_teyim = (SELECT id FROM students WHERE email = 'teyim.bertrand@test.com');

INSERT INTO enrollments (student_id, course_id, status) VALUES
(@std_abessolo, @crs_php, 'DONE'),
(@std_abessolo, @crs_mysql, 'PENDING'),
(@std_kenfack, @crs_php, 'PENDING'),
(@std_ngounou, @crs_php, 'DONE'),
(@std_teyim, @crs_spring, 'PENDING'),
(@std_ngounou, @crs_mysql, 'DONE');

SELECT "SEEDING RÉUSSI : Base de données peuplée avec succès." AS Result;
