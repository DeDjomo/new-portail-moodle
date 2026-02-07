import CourseService from '../../services/courseService.js';
import CategoryService from '../../services/categoryService.js';
import InstructorService from '../../services/instructorService.js';
import { BASE_URL, resolveAssetPath } from '../../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
        window.location.href = '../../login.html';
        return;
    }
    const admin = JSON.parse(adminStr);

    // Sidebar Info
    document.getElementById('sidebarName').textContent = `${admin.first_name} ${admin.last_name}`;
    if (admin.avatar_url) {
        document.getElementById('sidebarAvatar').src = resolveAssetPath(admin.avatar_url);
    }

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('admin');
        window.location.href = '../../login.html';
    });

    // 2. Load Select Data
    try {
        const [categories, instructors] = await Promise.all([
            CategoryService.getAll(),
            InstructorService.getAll()
        ]);

        const catSelect = document.getElementById('category_id');
        catSelect.innerHTML = '<option value="">Choisir une catégorie...</option>';
        categories.forEach(c => {
            catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });

        const insSelect = document.getElementById('instructor_id');
        insSelect.innerHTML = '<option value="">Choisir un instructeur...</option>';
        instructors.forEach(i => {
            insSelect.innerHTML += `<option value="${i.id}">${i.full_name}</option>`;
        });

    } catch (error) {
        console.error('Error loading form data:', error);
    }

    // --- Helper: Fetch URL to File Object ---
    // DISABLED: Moving download logic to backend to bypass CORS
    /*
    async function fetchUrlToFile(url, fileName) {
        ...
    }
    */

    // 3. Toggle & Media Logic
    document.querySelectorAll('.media-toggle').forEach(toggle => {
        const forMedia = toggle.dataset.for; // 'image' or 'video'
        const btns = toggle.querySelectorAll('.toggle-btn');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type; // 'local' or 'url'

                // Update UI active state
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show correct input group
                document.getElementById(`${forMedia}LocalGroup`).classList.toggle('active', type === 'local');
                document.getElementById(`${forMedia}UrlGroup`).classList.toggle('active', type === 'url');

                // Reset Previews when switching to avoid old data being shown
                if (forMedia === 'image') {
                    imagePreview.style.display = 'none';
                    imageInput.value = '';
                    imageUrlInput.value = '';
                } else {
                    videoPreview.style.display = 'none';
                    videoInput.value = '';
                    videoUrlInput.value = '';
                }

                // Show correct input group
                document.getElementById(`${forMedia}LocalGroup`).classList.toggle('active', type === 'local');
                document.getElementById(`${forMedia}UrlGroup`).classList.toggle('active', type === 'url');
            });
        });
    });

    // Asset Previews (Enhanced)
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewImg = imagePreview.querySelector('img');
    const btnRemoveImage = document.getElementById('btnRemoveImage');

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

    const imageUrlInput = document.getElementById('image_url_input');
    imageUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && (url.startsWith('http'))) {
            imagePreviewImg.src = url;
            imagePreview.style.display = 'block';
            imagePreviewImg.onerror = () => {
                console.warn('[DEBUG] Image URL failed to load:', url);
            };
        } else {
            imagePreview.style.display = 'none';
        }
    });

    btnRemoveImage.addEventListener('click', () => {
        imageInput.value = '';
        imageUrlInput.value = '';
        imagePreview.style.display = 'none';
        document.getElementById('imageName').textContent = 'Cliquer pour choisir une image';

        // Restore input groups
        const source = document.querySelector('.media-toggle[data-for="image"] .toggle-btn.active').dataset.type;
        document.getElementById('imageLocalGroup').style.display = source === 'local' ? 'block' : 'none';
        document.getElementById('imageUrlGroup').style.display = source === 'url' ? 'block' : 'none';
    });

    const videoInput = document.getElementById('video');
    const videoPreview = document.getElementById('videoPreview');
    const videoPreviewVid = videoPreview.querySelector('video');
    const btnRemoveVideo = document.getElementById('btnRemoveVideo');

    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('videoName').textContent = file.name;
            const url = URL.createObjectURL(file);
            videoPreviewVid.src = url;
            videoPreview.style.display = 'block';
        }
    });

    const videoUrlInput = document.getElementById('video_url_input');
    videoUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && (url.startsWith('http'))) {
            videoPreviewVid.src = url;
            videoPreviewVid.load(); // Force load for video
            videoPreview.style.display = 'block';
            videoPreviewVid.onerror = () => {
                console.warn('[DEBUG] Video URL failed to load:', url);
            };
        } else {
            videoPreview.style.display = 'none';
        }
    });

    btnRemoveVideo.addEventListener('click', () => {
        videoInput.value = '';
        videoUrlInput.value = '';
        videoPreview.style.display = 'none';
        videoPreviewVid.src = '';
        document.getElementById('videoName').textContent = 'Cliquer pour choisir une vidéo';

        // Restore input groups
        const source = document.querySelector('.media-toggle[data-for="video"] .toggle-btn.active').dataset.type;
        document.getElementById('videoLocalGroup').style.display = source === 'local' ? 'block' : 'none';
        document.getElementById('videoUrlGroup').style.display = source === 'url' ? 'block' : 'none';
    });

    // 4. Form Submission
    const form = document.getElementById('createCourseForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const alertSuccess = document.getElementById('alertSuccess');
    const alertError = document.getElementById('alertError');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
        alertSuccess.style.display = 'none';
        alertError.style.display = 'none';

        const formData = new FormData();

        // Mandatory fields
        formData.append('administrator_id', admin.id);
        formData.append('instructor_id', document.getElementById('instructor_id').value);
        formData.append('category_id', document.getElementById('category_id').value);
        formData.append('title', document.getElementById('title').value);
        formData.append('moodle_url', document.getElementById('moodle_url').value);

        // Optional / Details
        formData.append('short_synopsis', document.getElementById('short_synopsis').value);
        formData.append('full_description', document.getElementById('full_description').value);
        formData.append('level', document.getElementById('level').value);
        formData.append('language', document.getElementById('language').value);
        formData.append('format', document.getElementById('format').value);
        formData.append('total_duration_minutes', document.getElementById('total_duration_minutes').value);
        formData.append('is_certifying', document.getElementById('is_certifying').checked ? 1 : 0);

        // Special handling for pedagogical objectives (convert lines to array)
        const objectivesText = document.getElementById('pedagogical_objectives').value;
        const objectivesArray = objectivesText.split('\n').filter(line => line.trim() !== '');
        formData.append('pedagogical_objectives', JSON.stringify(objectivesArray));

        // Files Handling (Local vs URL)
        const activeImageBtn = document.querySelector('.media-toggle[data-for="image"] .toggle-btn.active');
        const imageSource = activeImageBtn.dataset.type;

        if (imageSource === 'local') {
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) formData.append('image', imageFile);
        } else {
            const imageUrl = document.getElementById('image_url_input').value.trim();
            if (imageUrl) formData.append('image_url', imageUrl);
        }

        const activeVideoBtn = document.querySelector('.media-toggle[data-for="video"] .toggle-btn.active');
        const videoSource = activeVideoBtn.dataset.type;

        if (videoSource === 'local') {
            const videoFile = document.getElementById('video').files[0];
            if (videoFile) formData.append('video', videoFile);
        } else {
            const videoUrl = document.getElementById('video_url_input').value.trim();
            if (videoUrl) formData.append('video_url', videoUrl);
        }

        try {
            const result = await CourseService.create(formData);

            alertSuccess.style.display = 'block';
            alertSuccess.textContent = `Cours créé ! Statut : ${result.status}`;

            // Redirect after success
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Create Error:', error);
            alertError.style.display = 'block';
            alertError.textContent = 'Erreur : ' + error.message;
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-save"></i> Enregistrer le cours';
        }
    });

});
