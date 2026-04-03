import ActualiteService from '../../services/actualiteService.js';
import CourseService from '../../services/courseService.js';
import { requireAuth } from '../../utils/auth-guard.js';
import { setupLogout, showToast, setLoading, showProgressModal } from '../../utils/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check - Get Admin User
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    // 2. Logout Logic
    setupLogout();

    // 3. Load Courses (Admin's only, or all if superadmin)
    const coursesList = document.getElementById('coursesList');
    try {
        // Filter courses by the current admin, or get all if SUPER_ADMIN
        const loadId = admin.type === 'SUPER_ADMIN' ? null : admin.id;
        const response = await CourseService.getByAdmin(loadId);
        const courses = response.data || response || [];

        if (courses.length === 0) {
            coursesList.innerHTML = '<div style="padding: 10px; color: #9CA3AF;">Vous n\'avez aucun cours à associer.</div>';
        } else {
            coursesList.innerHTML = courses.map(course => {
                const isDraft = course.status === 'DRAFT';
                return `
                    <div class="course-option" style="justify-content: space-between; display: flex; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" name="course_links" value="${course.id}" id="course_${course.id}">
                            <label for="course_${course.id}">${course.title}</label>
                        </div>
                        <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; background: ${isDraft ? '#FEF3C7' : '#D1FAE5'}; color: ${isDraft ? '#D97706' : '#059669'}; font-weight: 600;">
                            ${isDraft ? 'Brouillon' : 'Publié'}
                        </span>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error(error);
        coursesList.innerHTML = '<div style="padding: 10px; color: #DC2626;">Erreur de chargement des cours</div>';
    }

    // --- Media Toggle & Preview Logic ---
    const mediaToggles = document.querySelectorAll('.media-toggle');
    mediaToggles.forEach(toggle => {
        const forMedia = toggle.dataset.for;
        const btns = toggle.querySelectorAll('.toggle-btn');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.getElementById(`${forMedia}LocalGroup`).classList.toggle('active', type === 'local');
                document.getElementById(`${forMedia}UrlGroup`).classList.toggle('active', type === 'url');

                // Reset previews if needed? Or just let them be. 
                // Matching create-course.js logic:
                const preview = document.getElementById(`${forMedia}Preview`);
                preview.style.display = 'none';
                document.getElementById(`${forMedia}`).value = '';
                document.getElementById(`${forMedia}_url_input`).value = '';
            });
        });
    });

    // Image Preview
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewImg = imagePreview.querySelector('img');
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('imageName').textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviewImg.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('image_url_input').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url.startsWith('http')) {
            imagePreviewImg.src = url;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
        }
    });

    document.getElementById('btnRemoveImage').addEventListener('click', () => {
        imageInput.value = '';
        document.getElementById('image_url_input').value = '';
        imagePreview.style.display = 'none';
        document.getElementById('imageName').textContent = 'Cliquer pour choisir une image';
    });

    // Video Preview
    const videoInput = document.getElementById('video');
    const videoPreview = document.getElementById('videoPreview');
    const videoPreviewVid = videoPreview.querySelector('video');
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('videoName').textContent = file.name;
            const url = URL.createObjectURL(file);
            videoPreviewVid.src = url;
            videoPreview.style.display = 'block';
        }
    });

    document.getElementById('video_url_input').addEventListener('input', (e) => {
        const url = e.target.value.trim();

        const embedUrl = getEmbedUrl(url);
        if (embedUrl) {
            videoPreviewVid.style.display = 'none';
            let iframe = videoPreview.querySelector('iframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.width = '100%';
                iframe.height = '300';
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                videoPreview.appendChild(iframe);
            }
            iframe.style.display = 'block';
            iframe.src = embedUrl;
            videoPreview.style.display = 'block';
            return;
        }

        const iframe = videoPreview.querySelector('iframe');
        if (iframe) iframe.style.display = 'none';
        videoPreviewVid.style.display = 'block';

        if (url.startsWith('http')) {
            videoPreviewVid.src = url;
            videoPreview.style.display = 'block';
        } else {
            videoPreview.style.display = 'none';
        }
    });

    document.getElementById('btnRemoveVideo').addEventListener('click', () => {
        videoInput.value = '';
        document.getElementById('video_url_input').value = '';
        videoPreview.style.display = 'none';
        videoPreviewVid.src = '';
        const iframe = videoPreview.querySelector('iframe');
        if (iframe) {
            iframe.src = '';
            iframe.style.display = 'none';
        }
        document.getElementById('videoName').textContent = 'Cliquer pour choisir une vidéo';
    });

    // Form Submission
    const form = document.getElementById('newsForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const selectedCourses = Array.from(document.querySelectorAll('input[name="course_links"]:checked'))
            .map(cb => parseInt(cb.value));

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('administrator_id', admin.id);
        formData.append('course_ids', JSON.stringify(selectedCourses));

        // Image
        const imageSource = document.querySelector('.media-toggle[data-for="image"] .toggle-btn.active').dataset.type;
        if (imageSource === 'local') {
            const file = imageInput.files[0];
            if (file) formData.append('image', file);
        } else {
            formData.append('image_url', document.getElementById('image_url_input').value.trim());
        }

        // Video
        const videoSource = document.querySelector('.media-toggle[data-for="video"] .toggle-btn.active').dataset.type;
        if (videoSource === 'local') {
            const file = videoInput.files[0];
            if (file) formData.append('video', file);
        } else {
            formData.append('video_url', document.getElementById('video_url_input').value.trim());
        }

        const btnSubmit = form.querySelector('button[type="submit"]');
        setLoading(btnSubmit, true, 'Publication...');
        const updateProgress = showProgressModal('Publication de l\'actualité', 'Préparation de l\'envoi...');

        try {
            await ActualiteService.create(formData, (progress) => {
                updateProgress(progress.percent, `Envoi des fichiers : ${progress.loadedMB} / ${progress.totalMB} MB`);
            });
            showToast('Actualité publiée avec succès !');
            setTimeout(() => {
                window.location.href = 'actualites.html';
            }, 1500);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Erreur lors de la publication', 'error');
            setLoading(btnSubmit, false);
            const progressModal = document.getElementById('progressModal');
            if (progressModal) progressModal.remove();
        }
    });
});

function getEmbedUrl(url) {
    if (!url) return null;
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
    return null;
}
