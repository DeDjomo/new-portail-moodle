import CourseService from './src/services/courseService.js';
import CategoryService from './src/services/categoryService.js';
import { BASE_URL, resolveAssetPath } from './src/services/api.js';

/**
 * ENSPY TRAINING - Main Controller
 * Handles Carousel, Filters, and Data Rendering
 */

let allCourses = [];
let currentSlide = 0;

document.addEventListener('DOMContentLoaded', async () => {
    initCarousel();

    const trendingGrid = document.getElementById('trendingGrid');
    const coursesGrid = document.getElementById('coursesGrid');
    const courseHero = document.getElementById('courseHero');

    if (trendingGrid) {
        // Landing Page Logic
        await loadTrendingCourses();
    } else if (coursesGrid) {
        // Catalog Page Logic
        await loadInitialData();
        setupFilters();
    } else if (courseHero) {
        // Course Details Page Logic
        await loadCourseDetails();
    }
});

/* --- 1. Carousel Logic --- */
function initCarousel() {
    const inner = document.getElementById('carouselInner');
    const dots = document.querySelectorAll('.dot');
    const totalRealSlides = 3;
    let isTransitioning = false;

    const showSlide = (n, bypassTransition = false) => {
        if (!inner) return;

        currentSlide = n;
        inner.style.transition = bypassTransition ? 'none' : 'transform 0.8s ease-in-out';
        inner.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === (currentSlide % totalRealSlides));
        });

        if (!bypassTransition) {
            inner.addEventListener('transitionend', function handler() {
                if (currentSlide === totalRealSlides) {
                    showSlide(0, true);
                }
                inner.removeEventListener('transitionend', handler);
            });
        }
    };

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => showSlide(idx));
    });

    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 6000);
}

/* --- Data Loading for Landing Page --- */
async function loadTrendingCourses() {
    try {
        const response = await CourseService.getAll();
        const courses = (response.data || response); // Show all (usually implies non-deleted from backend)

        // Take top 3 for now (mocking trending logic)
        const topCourses = courses.slice(0, 3);
        console.log('[DEBUG] loadTrendingCourses:', topCourses.map(c => ({ id: c.id, img: c.image_url })));

        // Render into trendingGrid
        renderCourses(topCourses, 'trendingGrid');

    } catch (error) {
        console.error('Trending Error:', error);
    } finally {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}

/* --- 2. Data Loading --- */
async function loadInitialData() {
    const loader = document.getElementById('loader');
    const coursesGrid = document.getElementById('coursesGrid');
    const tabsContainer = document.getElementById('categoryFilters');

    try {
        // Fetch Categories and Courses in parallel
        const [catRes, courseRes] = await Promise.all([
            CategoryService.getAll(),
            CourseService.getAll()
        ]);

        const categories = catRes.data || catRes;
        const courses = (courseRes.data || courseRes); // Show all

        allCourses = courses;

        // Render Categories as Checkboxes
        if (Array.isArray(categories)) {
            categories.forEach(cat => {
                const label = document.createElement('label');
                label.className = 'checkbox-item fade-up';
                label.innerHTML = `
                    <input type="checkbox" class="filter-checkbox" name="category" value="${cat.id}">
                    <span class="custom-check"></span>
                    <span class="label-text">${cat.name}</span>
                `;
                tabsContainer.appendChild(label);
            });
        }

        renderCourses(allCourses, 'coursesGrid');

    } catch (error) {
        console.error('Initialization Error:', error);
        if (coursesGrid) {
            coursesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--error);">Désolé, une erreur est survenue lors de la connexion au serveur.</div>`;
        }
    } finally {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}

/* --- 3. Filtering & Rendering --- */
function setupFilters() {
    const searchInput = document.getElementById('searchInput'); // Kept specifically for search

    // Elements
    const categoryFilters = document.getElementById('categoryFilters');

    const handleFilter = () => {
        const searchTerm = searchInput.value.toLowerCase();

        // Get checked values from all groups
        const checkedCats = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
        const checkedLangs = Array.from(document.querySelectorAll('input[name="language"]:checked')).map(cb => cb.value);
        const checkedLevels = Array.from(document.querySelectorAll('input[name="level"]:checked')).map(cb => cb.value);

        const filtered = allCourses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchTerm) ||
                course.short_synopsis?.toLowerCase().includes(searchTerm);

            // Checkbox logic: OR within group, AND between groups
            // Comparing string values from checkboxes with potentially number/string from course object
            const matchesCat = checkedCats.length === 0 || checkedCats.includes(String(course.category_id));
            const matchesLang = checkedLangs.length === 0 || checkedLangs.includes(course.language);
            const matchesLevel = checkedLevels.length === 0 || checkedLevels.includes(course.level);

            return matchesSearch && matchesCat && matchesLang && matchesLevel;
        });

        renderCourses(filtered);
    };

    searchInput.addEventListener('input', handleFilter);

    // Delegate change event for all filter checkboxes (both static and dynamic)
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('filter-checkbox')) {
            handleFilter();
        }
    });
}

function renderCourses(courses, containerId = 'coursesGrid') {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = '';

    if (courses.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-dim);">Aucun cours ne correspond à votre recherche.</div>`;
        return;
    }

    const translations = {
        'BEGINNER': 'Débutant',
        'INTERMEDIATE': 'Intermédiaire',
        'ADVANCED': 'Avancé',
        'FR': '🇫🇷 Français',
        'EN': '🇬🇧 Anglais',
        'VIDEO': 'Vidéo',
        'PDF': 'PDF',
        'AUDIO': 'Audio',
        'MIXED': 'Hybride'
    };

    courses.forEach(course => {
        const card = document.createElement('article');
        card.className = 'course-card fade-up';

        let banner = `https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&q=80&w=800`;
        if (course.image_url) {
            banner = resolveAssetPath(course.image_url);
            console.log(`[DEBUG] Course ${course.id} banner resolved to:`, banner);
        } else {
            console.log(`[DEBUG] Course ${course.id} has NO image_url`);
        }

        // Translate attributes
        const levelDisplay = translations[course.level] || course.level;
        const langDisplay = translations[course.language] || course.language;
        const formatDisplay = translations[course.format] || course.format;

        card.innerHTML = `
            <div class="card-banner" style="background-image: url('${banner}')">
                <span class="card-badge">${levelDisplay}</span>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span>${langDisplay}</span>
                    <span>•</span>
                    <span>${formatDisplay}</span>
                </div>
                <h3 class="card-title">${course.title}</h3>
                <div class="card-footer">
                    <div class="card-instructor">
                        <img src="${course.instructor_photo_url ? resolveAssetPath(course.instructor_photo_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor_name || 'Prof')}&background=FF6B00&color=fff`}" class="inst-avatar">
                        <span class="inst-name">${course.instructor_name || 'Instructeur ENSPY'}</span>
                    </div>
                    <a href="course-details.html?id=${course.id}" class="btn-detail">Aperçu →</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* --- Data Loading for Course Details --- */
async function loadCourseDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        window.location.href = 'catalog.html';
        return;
    }

    try {
        // simulating getById by fetching all (for now)
        // In prod: await CourseService.getById(courseId);
        const response = await CourseService.getAll();
        const courses = response.data || response;
        const course = courses.find(c => c.id == courseId);

        if (!course) {
            alert('Cours introuvable');
            window.location.href = 'catalog.html';
            return;
        }

        renderCourseDetails(course);

    } catch (error) {
        console.error('Details Error:', error);
    } finally {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}

function renderCourseDetails(course) {
    // 1. Hero
    const hero = document.getElementById('courseHero');
    let banner = 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&q=80&w=1600';
    if (course.image_url) {
        banner = resolveAssetPath(course.image_url);
    }

    hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${banner}')`;
    hero.innerHTML = `
        <div class="container">
            <div class="hero-content fade-up">
                <span class="hero-tag">${course.category_name || 'Formation'}</span>
                <h1 class="hero-title">${course.title}</h1>
                <p class="hero-subtitle">${course.short_synopsis || ''}</p>
            </div>
        </div>
    `;

    // 1.5 Video Preview Logic
    const videoSection = document.getElementById('videoSection');
    const videoPlayer = document.getElementById('courseVideo');
    if (course.video_url && videoSection && videoPlayer) {
        const videoUrl = resolveAssetPath(course.video_url);
        videoPlayer.src = videoUrl;
        videoPlayer.poster = banner; // Use course image as poster
        videoSection.style.display = 'block';
        console.log('[DEBUG] Video found for course:', videoUrl);
    }

    // 2. Main Content
    document.getElementById('courseDescription').innerHTML = course.description || 'Aucune description disponible.';

    // Simulate Syllabus (since we don't have it in DB yet)
    const syllabusHTML = `
        <li><i class="fas fa-check-circle"></i> Comprendre les fondamentaux</li>
        <li><i class="fas fa-check-circle"></i> Maîtriser les outils avancés</li>
        <li><i class="fas fa-check-circle"></i> Réaliser un projet pratique</li>
        <li><i class="fas fa-check-circle"></i> Obtenir la certification ENSPY</li>
    `;
    document.getElementById('courseSyllabus').innerHTML = syllabusHTML;

    document.getElementById('courseInstructor').innerHTML = `
        <img src="${course.instructor_photo_url ? resolveAssetPath(course.instructor_photo_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor_name || 'Prof')}&background=FF6B00&color=fff&size=128`}" class="inst-photo">
        <div class="inst-info">
            <h3>${course.instructor_name || 'Instructeur ENSPY'}</h3>
            <p class="inst-role">Expert Pédagogique</p>
            <p class="inst-bio">Professeur expérimenté à l'École Nationale Supérieure Polytechnique de Yaoundé.</p>
        </div>
    `;

    // 3. Sidebar (Enrollment)
    document.getElementById('enrollmentCard').innerHTML = `
        <div class="price-tag">Gratuit</div>
        <p class="enroll-meta">Accès illimité au contenu</p>
        
        <a href="#" class="btn-enroll" id="btnEnroll">S'inscrire maintenant</a>
        
        <div class="course-meta-list">
            <div class="meta-item">
                <i class="fas fa-signal"></i>
                <span>Niveau : <strong>${course.level}</strong></span>
            </div>
            <div class="meta-item">
                <i class="fas fa-globe"></i>
                <span>Langue : <strong>${course.language}</strong></span>
            </div>
            <div class="meta-item">
                <i class="fas fa-clock"></i>
                <span>Durée : <strong>4 semaines</strong></span>
            </div>
             <div class="meta-item">
                <i class="fas fa-video"></i>
                <span>Format : <strong>${course.format}</strong></span>
            </div>
        </div>
    `;

    // 4. Initialize Enrollment Modal Logic
    setupEnrollment(course);
}

import EnrollmentService from './src/services/enrollmentService.js';
import AuthService from './src/services/authService.js';

/* --- Enrollment Logic --- */
/* --- Modal System & Enrollment Flow --- */
/* --- Modal System & Enrollment Flow --- */
function setupEnrollment(course) {
    const courseId = course.id;
    const moodleUrl = course.moodle_url || '#';

    // 1. Modal Helpers
    const openModal = (id) => {
        const modal = document.getElementById(id) || document.getElementById('enrollModal');
        if (modal && id === 'enrollModal') modal.classList.add('active');
        else if (document.getElementById(id)) document.getElementById(id).classList.add('active');
    };

    const closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    };

    const showMessage = (type, title, text) => {
        const modal = document.getElementById('msgModal');
        const icon = document.getElementById('msgIcon');
        const titleEl = document.getElementById('msgTitle');
        const textEl = document.getElementById('msgText');

        // Reset classes
        icon.className = 'fas msg-icon';
        icon.classList.add(type === 'success' ? 'fa-check-circle' : 'fa-times-circle');
        icon.classList.add(type);

        titleEl.textContent = title;
        textEl.textContent = text;

        modal.classList.add('active');
    };

    // Helper: Show Moodle Button
    const showMoodleButton = () => {
        const btnEnroll = document.getElementById('btnEnroll');
        if (btnEnroll) {
            btnEnroll.textContent = 'Accéder au cours ↗';
            btnEnroll.style.background = '#007bff';
            btnEnroll.href = moodleUrl;
            btnEnroll.target = '_blank';

            // Remove click listeners by cloning
            const newBtn = btnEnroll.cloneNode(true);
            btnEnroll.parentNode.replaceChild(newBtn, btnEnroll);
        }
    };

    // 2. Global Close Handlers
    document.querySelectorAll('.close-modal, #btnMsgClose').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close') || btn.closest('.modal')?.id;
            if (modalId) closeModal(modalId);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // 3. Elements and Listeners
    const btnEnroll = document.getElementById('btnEnroll');
    const enrollForm = document.getElementById('enrollForm');
    const registerForm = document.getElementById('registerForm');

    if (btnEnroll) {
        btnEnroll.addEventListener('click', (e) => {
            e.preventDefault();
            // Check if already Moodle button (just in case)
            if (btnEnroll.textContent.includes('Moodle')) {
                window.open(moodleUrl, '_blank');
                return;
            }
            openModal('enrollModal');
            const mailInput = document.getElementById('enrollEmail');
            if (mailInput) mailInput.focus();
        });
    }

    // 4. Enrollment Logic
    if (enrollForm) {
        enrollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('enrollEmail').value;
            const btn = enrollForm.querySelector('button');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = 'Vérification...';

            try {
                await EnrollmentService.enroll(email, courseId);
                closeModal('enrollModal');
                showMessage('success', 'Inscription Réussie !', 'Un email de confirmation vous a été envoyé.');

                // Update UI state to Moodle Button
                showMoodleButton();

            } catch (error) {
                const msg = error.message || '';

                if (msg.includes('Student account not found') || msg.includes('404')) {
                    closeModal('enrollModal');
                    // Switch to Register Modal
                    document.getElementById('regEmail').value = email;
                    openModal('registerModal');

                } else if (msg.includes('already enrolled') || msg.includes('409')) {
                    closeModal('enrollModal');
                    showMessage('success', 'Déjà inscrit', 'Vous êtes déjà inscrit. Accédez au cours maintenant.');
                    showMoodleButton();
                } else {
                    closeModal('enrollModal');
                    showMessage('error', 'Erreur', msg);
                }
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    // 5. Registration Logic
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = 'Création du compte...';

            // Collect Data
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            try {
                // Step A: Register
                await AuthService.register(data);

                // Step B: Auto-Enroll
                btn.textContent = 'Inscription au cours...';
                await EnrollmentService.enroll(data.email, courseId);

                closeModal('registerModal');
                showMessage('success', 'Compte Créé & Inscrit !', 'Bienvenue sur ENSPY Training. Vérifiez vos emails.');

                showMoodleButton();

            } catch (error) {
                console.error(error);
                // Don't close modal on error so user can fix inputs
                alert(error.message || "Erreur lors de l'enregistrement");
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }
}
