import ActualiteService from '../services/actualiteService.js';
import EnrollmentService from '../services/enrollmentService.js';
import { resolveAssetPath } from '../services/api.js';
import { showToast } from '../utils/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    if (!newsId) {
        window.location.href = 'actualites.html';
        return;
    }

    const loader = document.getElementById('loader');

    try {
        const item = await ActualiteService.getById(newsId);
        if (loader) loader.style.display = 'none';

        renderNewsDetail(item);
        if (item.courses && item.courses.length > 0) {
            renderLinkedCourses(item.courses);
        }

    } catch (error) {
        console.error('Error loading news detail:', error);
        if (loader) loader.style.display = 'none';
        showToast('Erreur lors du chargement des détails.', 'error');
    }
});

function renderNewsDetail(item) {
    document.getElementById('newsTitle').textContent = item.title;
    document.getElementById('newsDescription').textContent = item.description || 'Pas de description supplémentaire.';

    const dateStr = new Date(item.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('newsDate').textContent = `Publié le ${dateStr}`;

    const videoContainer = document.querySelector('.video-container');
    const videoPlayer = document.getElementById('videoPlayer');

    if (item.video_url) {
        const embedUrl = getEmbedUrl(item.video_url);
        if (embedUrl) {
            // YouTube/Vimeo → use iframe
            videoPlayer.style.display = 'none';
            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.className = 'video-player';
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            videoContainer.appendChild(iframe);
        } else {
            // Local file → use <video>
            videoPlayer.src = resolveAssetPath(item.video_url);
            videoPlayer.autoplay = true;
            if (item.image_url) {
                videoPlayer.poster = resolveAssetPath(item.image_url);
            }
            videoPlayer.play().catch(e => console.warn("Detail autoplay prevented:", e));
        }
    }
}

/**
 * Extracts an embeddable URL from YouTube or Vimeo links.
 * Returns null if the URL is not a recognized platform.
 */
function getEmbedUrl(url) {
    if (!url) return null;
    // YouTube
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    // Vimeo
    match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
    return null;
}

function renderLinkedCourses(courses) {
    const section = document.getElementById('linkedCoursesSection');
    const grid = document.getElementById('coursesGrid');

    section.style.display = 'block';
    grid.innerHTML = courses.map(course => renderCourseCard(course)).join('');

    // Attach enrollment listeners (mimics catalog.js logic)
    grid.querySelectorAll('.btn-enroll').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const courseId = btn.dataset.id;
            const courseTitle = btn.dataset.title;
            openEnrollmentModal(courseId, courseTitle);
        };
    });
}

function renderCourseCard(course) {
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

    const banner = course.image_url ? resolveAssetPath(course.image_url) : 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&q=80&w=800';

    const levelDisplay = translations[course.level] || course.level;
    const langDisplay = translations[course.language] || course.language;
    const formatDisplay = translations[course.format] || course.format;

    const instructorPhoto = course.instructor_photos ? resolveAssetPath(course.instructor_photos.split(',')[0]) : `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor_names?.split(',')[0] || 'Prof')}&background=FF6B00&color=fff`;

    return `
        <article class="course-card">
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
                <p class="card-desc">${course.short_synopsis || ''}</p>
                <div class="card-footer">
                    <div class="card-instructor">
                        <img src="${instructorPhoto}" class="inst-avatar">
                        <span class="inst-name" title="${course.instructor_names || ''}">${course.instructor_names || 'Instructeur ENSPY'}</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="btn-enroll" 
                                style="background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 50px; font-weight: 700; cursor: pointer; font-size: 0.85rem;"
                                data-id="${course.id}" data-title="${course.title}">
                            S'inscrire
                        </button>
                        <a href="course-details.html?id=${course.id}" class="btn-detail">Détails →</a>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// Simple Enrollment Modal for the news page (reusing logic from catalog.js)
function openEnrollmentModal(courseId, courseTitle) {
    // Check if modal already exists to avoid duplicates
    const existing = document.getElementById('enrollModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'enrollModal';
    modal.className = 'modal-enroll'; // Should be styled in style.css, but I'll add inline as fallback

    // Inline styles if not in style.css
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';
    modal.style.backdropFilter = 'blur(5px)';

    modal.innerHTML = `
        <div style="background:white; padding:2rem; border-radius:20px; width:90%; max-width:500px; position:relative; box-shadow:0 20px 50px rgba(0,0,0,0.2);">
            <button id="closeEnroll" style="position:absolute; top:1.5rem; right:1.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#6B7280;"><i class="fas fa-times"></i></button>
            <h2 style="font-size:1.5rem; font-weight:700; color:#111827; margin-bottom:0.5rem;">S'inscrire au cours</h2>
            <p style="color:#6B7280; margin-bottom:2rem;">${courseTitle}</p>
            
            <form id="enrollForm">
                <div style="margin-bottom:1rem;">
                    <label style="display:block; font-size:0.9rem; font-weight:600; color:#374151; margin-bottom:0.5rem;">Prénom</label>
                    <input type="text" name="first_name" required style="width:100%; padding:0.75rem; border:1px solid #D1D5DB; border-radius:8px;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; font-size:0.9rem; font-weight:600; color:#374151; margin-bottom:0.5rem;">Nom</label>
                    <input type="text" name="last_name" required style="width:100%; padding:0.75rem; border:1px solid #D1D5DB; border-radius:8px;">
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block; font-size:0.9rem; font-weight:600; color:#374151; margin-bottom:0.5rem;">Email Institutionnel / Personnel</label>
                    <input type="email" name="email" required style="width:100%; padding:0.75rem; border:1px solid #D1D5DB; border-radius:8px;">
                </div>
                <button type="submit" id="submitEnroll" style="width:100%; padding:1rem; background:var(--primary); color:white; border:none; border-radius:12px; font-weight:700; cursor:pointer; font-size:1.1rem; transition:background 0.3s;">
                    Confirmer l'inscription
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeEnroll').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    document.getElementById('enrollForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitEnroll');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification...';

        const formData = new FormData(e.target);
        const data = {
            course_id: courseId,
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email')
        };

        try {
            await EnrollmentService.enroll(data);
            showToast('Inscription réussie ! Vous allez recevoir un email.', 'success');
            modal.remove();
        } catch (err) {
            console.error('Enroll Error:', err);
            showToast(err.message || 'Erreur lors de l\'inscription.', 'error');
            btn.disabled = false;
            btn.textContent = originalText;
        }
    };
}
