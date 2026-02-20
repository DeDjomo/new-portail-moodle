
import CourseService from '../services/courseService.js';
import EnrollmentService from '../services/enrollmentService.js';
import AuthService from '../services/authService.js';
import { resolveAssetPath } from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        window.location.href = 'catalog.html';
        return;
    }

    await loadCourseDetails(courseId);
});

async function loadCourseDetails(courseId) {
    const loader = document.getElementById('loader');

    try {
        const course = await CourseService.getById(courseId);

        if (!course) {
            alert('Cours introuvable');
            window.location.href = 'catalog.html';
            return;
        }

        renderCourseDetails(course);

        // Check Enrollment Status if email is stored
        const studentEmail = localStorage.getItem('student_email');
        if (studentEmail) {
            try {
                const res = await EnrollmentService.checkStatus(studentEmail, courseId);
                console.log('[DEBUG] Enrollment Status:', res.status);
                updateEnrollmentButton(res.status, course.moodle_url);
            } catch (err) {
                console.error('Status check failed', err);
            }
        }

    } catch (error) {
        console.error('Details Error:', error);
        document.querySelector('.course-main').innerHTML = `
            <div class="alert alert-danger">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les détails du cours. Veuillez réessayer plus tard.</p>
            </div>`;
    } finally {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}

function renderCourseDetails(course) {
    // 1. Hero Section
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
                ${course.video_url ? `<button onclick="document.getElementById('videoSection').scrollIntoView({behavior: 'smooth'})" class="btn-primary btn-preview"><i class="fas fa-play"></i> Voir l'extrait gratuit</button>` : ''}
            </div>
        </div>
    `;

    // 2. Video Preview
    renderVideoSection(course);

    // 3. Main Description
    const descriptionEl = document.getElementById('courseDescription');
    if (descriptionEl) {
        descriptionEl.innerHTML = course.full_description || course.description || 'Aucune description disponible.';
    }

    // 4. Syllabus (Pedagogical Objectives)
    const syllabusList = document.getElementById('courseSyllabus');
    if (syllabusList) {
        if (course.pedagogical_objectives && course.pedagogical_objectives.length > 0) {
            syllabusList.innerHTML = course.pedagogical_objectives.map(obj =>
                `<li><i class="fas fa-check-circle"></i> ${obj}</li>`
            ).join('');
        } else {
            syllabusList.innerHTML = `<li><i class="fas fa-info-circle"></i> Aucun objectif pédagogique défini pour ce cours.</li>`;
        }
    }

    // 5. Instructor Details (Pedagogical Team)
    const instructorCard = document.getElementById('courseInstructor');
    if (instructorCard) {
        if (course.instructors && Array.isArray(course.instructors) && course.instructors.length > 0) {
            instructorCard.className = 'instructors-grid'; // Use a grid layout for multiple
            instructorCard.style.display = 'grid';
            instructorCard.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
            instructorCard.style.gap = '1.5rem';

            instructorCard.innerHTML = course.instructors.map(inst => {
                const photo = inst.photo_url ? resolveAssetPath(inst.photo_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(inst.full_name || 'Prof')}&background=FF6B00&color=fff&size=128`;
                return `
                <div class="instructor-card-item" style="background: white; padding: 1.5rem; border-radius: 16px; display: flex; gap: 1rem; align-items: flex-start; box-shadow: var(--shadow-sm);">
                    <img src="${photo}" class="inst-photo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" alt="${inst.full_name}">
                    <div class="inst-info">
                        <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${inst.full_name}</h3>
                        <p class="inst-role" style="color: var(--primary); font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem;">${inst.professional_title || 'Expert Pédagogique'}</p>
                        <p class="inst-bio" style="font-size: 0.85rem; color: var(--text-dim); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${inst.short_bio || "Professeur à l'ENSPY."}</p>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            // Fallback for single/legacy (though backend now always sends array)
            const instructorPhoto = course.instructor_photo_url ? resolveAssetPath(course.instructor_photo_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor_name || 'Prof')}&background=FF6B00&color=fff&size=128`;
            instructorCard.innerHTML = `
                <img src="${instructorPhoto}" class="inst-photo" alt="${course.instructor_name}">
                <div class="inst-info">
                    <h3>${course.instructor_name || 'Instructeur ENSPY'}</h3>
                    <p class="inst-role">${course.instructor_title || 'Expert Pédagogique'}</p>
                    <p class="inst-bio">${course.instructor_bio || "Biographie non disponible."}</p>
                </div>
            `;
        }
    }

    // 5b. Prerequis Section
    const prerequisSection = document.getElementById('prerequisSection');
    const prerequisEl = document.getElementById('coursePrerequis');
    if (prerequisSection && prerequisEl && course.prerequis) {
        prerequisEl.innerHTML = course.prerequis.replace(/\n/g, '<br>');
        prerequisSection.style.display = 'block';
    }

    // 6. Sidebar Enrollment Card
    renderEnrollmentCard(course);

    // 7. Setup Modal Logic
    setupEnrollmentLogic(course);
}

function renderVideoSection(course) {
    const videoSection = document.getElementById('videoSection');
    const videoContainer = document.querySelector('.video-container');
    const videoPlayer = document.getElementById('courseVideo');

    if (!course.video_url || !videoSection) {
        return;
    }

    let videoUrl = course.video_url;
    // Check for full URL vs relative path
    if (!videoUrl.startsWith('http')) {
        videoUrl = resolveAssetPath(videoUrl);
    }

    // Check for Embed (YouTube/Vimeo)
    const embedUrl = getEmbedUrl(videoUrl);

    if (embedUrl) {
        // Render Iframe
        videoContainer.innerHTML = `
            <iframe 
                src="${embedUrl}" 
                width="100%" 
                height="450" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>`;
        videoSection.style.display = 'block';
    } else {
        // Standard Video File
        if (videoPlayer) {
            videoPlayer.src = videoUrl;
            videoPlayer.poster = resolveAssetPath(course.image_url); // Use banner as poster
            videoSection.style.display = 'block';
        }
    }
}

function renderEnrollmentCard(course) {
    const enrollmentCard = document.getElementById('enrollmentCard');
    if (!enrollmentCard) return;

    // Duration formatting
    const duration = formatDuration(course.total_duration_minutes);

    enrollmentCard.innerHTML = `
        <div class="price-tag">Gratuit</div>
        <p class="enroll-meta">Accès illimité au contenu</p>
        
        <a href="#" class="btn-enroll" id="btnEnroll">S'inscrire maintenant</a>
        
        <div class="course-meta-list">
            <div class="meta-item">
                <i class="fas fa-signal"></i>
                <span>Niveau : <strong>${translateLevel(course.level)}</strong></span>
            </div>
            <div class="meta-item">
                <i class="fas fa-globe"></i>
                <span>Langue : <strong>${translateLanguage(course.language)}</strong></span>
            </div>
            <div class="meta-item">
                <i class="fas fa-clock"></i>
                <span>Durée : <strong>${duration}</strong></span>
            </div>
             <div class="meta-item">
                <i class="fas fa-video"></i>
                <span>Format : <strong>${translateFormat(course.format)}</strong></span>
            </div>
        </div>
    `;
}

function updateEnrollmentButton(status, moodleUrl) {
    const btnEnroll = document.getElementById('btnEnroll');
    if (!btnEnroll) return;

    // If not enrolled, do not replace the button (keep default listeners)
    if (status === 'NOT_ENROLLED') return;

    // Clone to remove listeners
    const newBtn = btnEnroll.cloneNode(true);
    btnEnroll.parentNode.replaceChild(newBtn, btnEnroll);

    // Status Logic
    if (status === 'PENDING') {
        newBtn.textContent = 'En attente de validation';
        newBtn.style.background = '#F59E0B'; // Orange/Yellow
        newBtn.style.cursor = 'default';
        newBtn.href = '#';
        newBtn.onclick = (e) => e.preventDefault();

        // Add info icon
        newBtn.innerHTML = '<i class="fas fa-clock"></i> En attente de validation';

    } else if (status === 'DONE') {
        newBtn.textContent = 'Accéder au cours ↗';
        newBtn.style.background = '#10B981'; // Green
        newBtn.href = moodleUrl || '#';
        newBtn.target = '_blank';
        newBtn.onclick = null;
    }
}

function setupEnrollmentLogic(course) {
    const courseId = course.id;
    const moodleUrl = course.moodle_url || '#';

    // 1. Modal Helpers
    const openModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
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

    // Close on click outside
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
            if (btnEnroll.textContent.includes('Accéder')) {
                window.open(moodleUrl, '_blank');
                return;
            }
            openModal('enrollModal');
            const mailInput = document.getElementById('enrollEmail');
            if (mailInput) mailInput.focus();
        });
    }

    // Password Toggle Logic
    const toggleRegPassword = document.getElementById('toggleRegPassword');
    const regPassword = document.getElementById('regPassword');
    if (toggleRegPassword && regPassword) {
        toggleRegPassword.addEventListener('click', () => {
            const type = regPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            regPassword.setAttribute('type', type);
            toggleRegPassword.classList.toggle('fa-eye');
            toggleRegPassword.classList.toggle('fa-eye-slash');
        });
    }

    // 4. Enrollment Submit Logic
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
                localStorage.setItem('student_email', email);
                closeModal('enrollModal');
                showMessage('success', 'Inscription Réussie !', 'Un email de confirmation vous a été envoyé.');

                updateEnrollmentButton('PENDING', null); // Update UI immediately

            } catch (error) {
                const msg = error.message || '';

                if (msg.includes('Student account not found') || msg.includes('404')) {
                    closeModal('enrollModal');
                    // Switch to Register Modal
                    document.getElementById('regEmail').value = email;
                    openModal('registerModal');

                } else if (msg.includes('already enrolled') || msg.includes('409')) {
                    localStorage.setItem('student_email', email);
                    closeModal('enrollModal');
                    showMessage('success', 'Déjà inscrit', 'Vous êtes déjà inscrit. Accédez au cours maintenant.');

                    // IF already enrolled (409), fetch status to be sure
                    try {
                        const statusRes = await EnrollmentService.checkStatus(email, courseId);
                        updateEnrollmentButton(statusRes.status, moodleUrl);
                    } catch (e) { console.error(e); }
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

    // 5. Registration Submit Logic
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

                localStorage.setItem('student_email', data.email);

                closeModal('registerModal');
                showMessage('success', 'Compte Créé & Inscrit !', 'Bienvenue sur ENSPY Training. Vérifiez vos emails.');

                updateEnrollmentButton('PENDING', null);

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

// --- Helpers ---

function getEmbedUrl(url) {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
}

function formatDuration(hours) {
    if (!hours && hours !== 0) return 'Non défini';
    const totalMinutes = Math.round(parseFloat(hours) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h}h${m}min`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}min`;
    return 'Non défini';
}

function translateLevel(level) {
    const map = {
        'BEGINNER': 'Débutant',
        'INTERMEDIATE': 'Intermédiaire',
        'ADVANCED': 'Avancé'
    };
    return map[level] || level;
}

function translateLanguage(lang) {
    const map = {
        'FR': 'Français',
        'EN': 'Anglais'
    };
    return map[lang] || lang;
}

function translateFormat(format) {
    const map = {
        'VIDEO': 'Vidéo',
        'PDF': 'PDF',
        'AUDIO': 'Audio',
        'MIXED': 'Hybride'
    };
    return map[format] || format;
}
