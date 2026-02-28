import ActualiteService from '../../services/actualiteService.js';
import CourseService from '../../services/courseService.js';
import { requireAuth } from '../../utils/auth-guard.js';
import { setupLogout, showToast, setLoading, showProgressModal } from '../../utils/ui.js';
import { resolveAssetPath } from '../../services/api.js';

const urlParams = new URLSearchParams(window.location.search);
const newsId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    if (!newsId) {
        window.location.href = 'actualites.html';
        return;
    }

    // 2. Logout Logic
    setupLogout();

    // 3. Elements
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewImg = imagePreview.querySelector('img');
    const imageInput = document.getElementById('image');
    const imageUrlInput = document.getElementById('image_url_input');

    const videoPreview = document.getElementById('videoPreview');
    const videoPreviewVid = videoPreview.querySelector('video');
    const videoInput = document.getElementById('video');
    const videoUrlInput = document.getElementById('video_url_input');

    // 4. Load Data
    try {
        const [coursesResponse, newsResponse] = await Promise.all([
            CourseService.getByAdmin(admin.id),
            ActualiteService.getById(newsId)
        ]);

        const courses = coursesResponse.data || coursesResponse || [];
        const news = newsResponse.data || newsResponse;

        // Populate Form
        document.getElementById('title').value = news.title;
        document.getElementById('description').value = news.description || '';

        // Media Handling
        if (news.image_url) {
            const isUrl = news.image_url.startsWith('http');
            if (isUrl) {
                imageUrlInput.value = news.image_url;
                // Switch toggle to URL
                document.querySelector('.media-toggle[data-for="image"] [data-type="url"]').click();
            } else {
                imagePreviewImg.src = resolveAssetPath(news.image_url);
                imagePreview.style.display = 'block';
            }
        }

        if (news.video_url) {
            const isUrl = news.video_url.startsWith('http');
            if (isUrl) {
                videoUrlInput.value = news.video_url;
                document.querySelector('.media-toggle[data-for="video"] [data-type="url"]').click();

                const embedUrl = getEmbedUrl(news.video_url);
                if (embedUrl) {
                    videoPreviewVid.style.display = 'none';
                    let iframe = document.createElement('iframe');
                    iframe.width = '100%';
                    iframe.height = '300';
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    iframe.src = embedUrl;
                    videoPreview.appendChild(iframe);
                    videoPreview.style.display = 'block';
                } else {
                    videoPreviewVid.src = news.video_url;
                    videoPreview.style.display = 'block';
                }
            } else {
                videoPreviewVid.src = resolveAssetPath(news.video_url);
                videoPreview.style.display = 'block';
            }
        }

        // Render Courses
        const coursesContainer = document.getElementById('coursesList');
        const linkedCourseIds = news.courses ? news.courses.map(c => c.id) : [];

        if (courses.length === 0) {
            coursesContainer.innerHTML = '<div style="padding: 10px; color: #9CA3AF;">Aucun cours disponible</div>';
        } else {
            coursesContainer.innerHTML = courses.map(course => `
                <div class="course-option">
                    <input type="checkbox" name="course_links" value="${course.id}" id="course_${course.id}" ${linkedCourseIds.includes(course.id) ? 'checked' : ''}>
                    <label for="course_${course.id}">${course.title}</label>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur lors du chargement des données', 'error');
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

                // Note: We don't reset previews here in edit mode to avoid clearing existing data accidentally
                // unless we want to match create-course exactly. For edit, it's better to keep existing if possible.
            });
        });
    });

    // Image Events
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

    imageUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url.startsWith('http')) {
            imagePreviewImg.src = url;
            imagePreview.style.display = 'block';
        }
    });

    document.getElementById('btnRemoveImage').addEventListener('click', () => {
        imageInput.value = '';
        imageUrlInput.value = '';
        imagePreview.style.display = 'none';
        document.getElementById('imageName').textContent = 'Cliquer pour choisir une image';
    });

    // Video Events
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('videoName').textContent = file.name;
            const url = URL.createObjectURL(file);
            videoPreviewVid.src = url;
            videoPreview.style.display = 'block';
        }
    });

    videoUrlInput.addEventListener('input', (e) => {
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
        videoUrlInput.value = '';
        videoPreview.style.display = 'none';
        videoPreviewVid.src = '';
        const iframe = videoPreview.querySelector('iframe');
        if (iframe) {
            iframe.src = '';
            iframe.style.display = 'none';
        }
        document.getElementById('videoName').textContent = 'Cliquer pour choisir une vidéo';
    });

    // Form Submit
    document.getElementById('newsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedCourses = Array.from(document.querySelectorAll('input[name="course_links"]:checked'))
            .map(cb => parseInt(cb.value));

        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('course_ids', JSON.stringify(selectedCourses));

        // Image
        const imageSource = document.querySelector('.media-toggle[data-for="image"] .toggle-btn.active').dataset.type;
        if (imageSource === 'local') {
            if (imageInput.files[0]) formData.append('image', imageInput.files[0]);
        } else {
            formData.append('image_url', imageUrlInput.value.trim());
        }

        // Video
        const videoSource = document.querySelector('.media-toggle[data-for="video"] .toggle-btn.active').dataset.type;
        if (videoSource === 'local') {
            if (videoInput.files[0]) formData.append('video', videoInput.files[0]);
        } else {
            formData.append('video_url', videoUrlInput.value.trim());
        }

        const btnSubmit = document.querySelector('button[type="submit"]');
        setLoading(btnSubmit, true, 'Enregistrement...');
        const updateProgress = showProgressModal('Modification de l\'actualité', 'Enregistrement en cours...');

        try {
            await ActualiteService.update(newsId, formData, (progress) => {
                updateProgress(progress.percent, `Envoi des fichiers : ${progress.loadedMB} / ${progress.totalMB} MB`);
            });
            showToast('Actualité mise à jour avec succès !');
            setTimeout(() => {
                window.location.href = 'actualites.html';
            }, 1000);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Erreur lors de la modification', 'error');
            setLoading(btnSubmit, false);
            if (document.getElementById('progressModal')) document.getElementById('progressModal').remove();
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
