-- Insertion de quelques actualités de test
INSERT INTO `actualites` (`id`, `title`, `description`, `video_url`, `image_url`) VALUES
(1, 'Bienvenue sur ENSPY Training', 'Découvrez notre nouvelle plateforme de formation continue en ligne.', 'https://www.w3schools.com/html/mov_bbb.mp4', 'public/images/banniere1.png'),
(2, 'Le Génie Logiciel à l''Honneur', 'Découvrez les nouveaux cours de développement web et mobile.', 'https://www.w3schools.com/html/movie.mp4', 'public/images/banniere2.png'),
(3, 'Interview : L''impact de l''IA', 'Nos experts discutent de l''intelligence artificielle dans l''ingénierie.', 'https://www.w3schools.com/html/mov_bbb.mp4', 'public/images/banniere3.png');

-- Liaison des actualités aux cours existants (IDs supposés 1 à 5)
INSERT INTO `actualite_courses` (`actualite_id`, `course_id`) VALUES
(1, 1), (1, 2), -- Actualité 1 présente les cours 1 et 2
(2, 2), (2, 3), (2, 4), -- Actualité 2 présente les cours 2, 3 et 4
(3, 4), (3, 5); -- Actualité 3 présente les cours 4 et 5
