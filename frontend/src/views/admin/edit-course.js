import CourseService from '../../services/courseService.js';
import CategoryService from '../../services/categoryService.js';
import InstructorService from '../../services/instructorService.js';
import AdminService from '../../services/adminService.js';
import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm, showDangerConfirm, showWarningConfirm, setupLogout } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';
import { setupQuickActions } from './quick-actions.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    setupLogout();

    // 2. Get Course ID
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        showToast('Erreur : ID du cours manquant', 'error');
        setTimeout(() => window.location.href = 'courses.html', 1500);
        return;
    }

    // 3. Load Data
    try {
        const [categories, instructors, admins, course] = await Promise.all([
            CategoryService.getAll(),
            InstructorService.getAll(),
            AdminService.getAll(),
            CourseService.getById(courseId)
        ]);

        // Populate Selects
        const catSelect = document.getElementById('category_id');
        catSelect.innerHTML = '<option value="">Choisir une catégorie...</option>';
        categories.forEach(c => {
            catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });

        const insSelect = document.getElementById('instructor_id');
        insSelect.innerHTML = '<option value="">Choisir un instructeur...</option>';

        // 1. Existing Instructors
        const instructorGroup = document.createElement('optgroup');
        instructorGroup.label = "Instructeurs";
        instructors.forEach(i => {
            const opt = document.createElement('option');
            opt.value = i.id;
            opt.textContent = i.full_name;
            instructorGroup.appendChild(opt);
        });
        insSelect.appendChild(instructorGroup);

        // 2. Admins
        const adminGroup = document.createElement('optgroup');
        adminGroup.label = "Administrateurs";

        const norm = (str) => str.toLowerCase().replace(/\s+/g, '');
        const instructorNames = instructors.map(i => norm(i.full_name));

        admins.forEach(a => {
            const fullName = `${a.first_name} ${a.last_name}`;
            if (!instructorNames.includes(norm(fullName))) {
                const opt = document.createElement('option');
                opt.value = `ADMIN:${a.id}`;
                opt.textContent = fullName;
                opt.dataset.admin = JSON.stringify(a);
                adminGroup.appendChild(opt);
            }
        });
        insSelect.appendChild(adminGroup);

        // 3.1 Setup Quick Actions
        setupQuickActions(
            (newCategory) => {
                const opt = document.createElement('option');
                opt.value = newCategory.id;
                opt.textContent = newCategory.name;
                opt.selected = true;
                catSelect.appendChild(opt);
            },
            (newInstructor) => {
                const opt = document.createElement('option');
                opt.value = newInstructor.id;
                opt.textContent = newInstructor.full_name;
                opt.selected = true;
                insSelect.appendChild(opt);
            }
        );

        // Populate Form
        if (course) {
            document.getElementById('title').value = course.title || '';
            document.getElementById('category_id').value = course.category_id || '';
            document.getElementById('instructor_id').value = course.instructor_id || '';
            document.getElementById('moodle_url').value = course.moodle_url || '';
            document.getElementById('short_synopsis').value = course.short_synopsis || '';
            document.getElementById('full_description').value = course.full_description || '';
            document.getElementById('level').value = course.level || 'BEGINNER';
            document.getElementById('language').value = course.language || 'FR';
            document.getElementById('format').value = course.format || 'VIDEO';
            document.getElementById('total_duration_minutes').value = course.total_duration_minutes || '';
            document.getElementById('is_certifying').checked = course.is_certifying == 1;
            // document.getElementById('status').value = course.status || 'DRAFT';

            // Objectives
            if (course.pedagogical_objectives) {
                let objs = course.pedagogical_objectives;
                if (typeof objs === 'string') {
                    try { objs = JSON.parse(objs); } catch (e) { objs = [objs]; }
                }
                if (Array.isArray(objs)) {
                    document.getElementById('pedagogical_objectives').value = objs.join('\n');
                }
            }

            // Media Previews
            if (course.image_url) {
                const imgUrl = resolveAssetPath(course.image_url);
                document.getElementById('imagePreview').style.display = 'block';
                document.getElementById('imagePreview').querySelector('img').src = imgUrl;
                document.querySelector('.file-upload-wrapper[for="image"]').style.display = 'none';
            }

            if (course.video_url) {
                // Check if it's external URL or local file path
                // Course model stores relative path for uploads OR absolute for external
                // We need to determine if we should switch to URL tab or Local tab
                // But for simplicity, we just show preview.

                const vidUrl = resolveAssetPath(course.video_url); // Resolves relative to absolute
                document.getElementById('videoPreview').style.display = 'block';
                const videoEl = document.getElementById('videoPreview').querySelector('video');

                // If standard video extension
                if (vidUrl.match(/\.(mp4|webm|ogg)$/i)) {
                    videoEl.src = vidUrl;
                    videoEl.style.display = 'block';
                } else {
                    // Might be embed link or other
                    // Re-use logic from create-course if complex, but here simply showing handled video
                    // If it's a youtube link stored directly
                    if (course.video_url.includes('youtube') || course.video_url.includes('vimeo')) {
                        // Switch to URL tab?
                        // For now just try to populate URL input if it looks like external URL
                        document.getElementById('video_url_input').value = course.video_url;
                        document.querySelector('.media-toggle[data-for="video"] .toggle-btn[data-type="url"]').click();
                    } else {
                        videoEl.src = vidUrl;
                    }
                }
                document.querySelector('.file-upload-wrapper[for="video"]').style.display = 'none';
            }
        }

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Erreur lors du chargement des données', 'error');
    }

    // --- Helper: Get Embed URL --- (Same as create-course.js)
    function getEmbedUrl(url) {
        if (!url) return null;
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
        if (vimeoMatch && vimeoMatch[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        return null;
    }

    // 4. Media Logic
    document.querySelectorAll('.media-toggle').forEach(toggle => {
        const forMedia = toggle.dataset.for;
        const btns = toggle.querySelectorAll('.toggle-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${forMedia}LocalGroup`).classList.toggle('active', type === 'local');
                document.getElementById(`${forMedia}UrlGroup`).classList.toggle('active', type === 'url');
            });
        });
    });

    const setupPreview = (inputId, previewId, type) => {
        document.getElementById(inputId).addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Update Name (Custom UI)
                const wrapper = document.querySelector(`.file-upload-wrapper[for="${inputId}"]`);
                if (wrapper) {
                    wrapper.style.display = 'none';
                }

                const reader = new FileReader();
                reader.onload = (ev) => {
                    const preview = document.getElementById(previewId);
                    preview.style.display = 'block';
                    if (type === 'image') preview.querySelector('img').src = ev.target.result;
                    else preview.querySelector('video').src = ev.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    };

    setupPreview('image', 'imagePreview', 'image');
    setupPreview('video', 'videoPreview', 'video');

    // --- ENHANCED URL PREVIEWS (Ported from create-course.js) ---

    // 1. Image URL Preview
    const imageUrlInput = document.getElementById('image_url_input');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewImg = imagePreview.querySelector('img');
    const imageStatus = document.createElement('small');
    imageUrlInput.parentNode.appendChild(imageStatus);

    imageUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && (url.startsWith('http'))) {
            imagePreviewImg.src = url;
            imagePreview.style.display = 'block';
            imageStatus.textContent = 'Chargement de l\'aperçu...';
            imageStatus.style.color = 'blue';

            imagePreviewImg.onload = () => {
                imageStatus.textContent = 'Image chargée avec succès';
                imageStatus.style.color = 'green';
            };

            imagePreviewImg.onerror = () => {
                imageStatus.textContent = 'Impossible de charger l\'image (CORS ou lien invalide)';
                imageStatus.style.color = 'red';
            };
        } else {
            // Only hide if input is cleared, otherwise keep current if valid
            if (!url) {
                imagePreview.style.display = 'none';
                imageStatus.textContent = '';
            }
        }
    });

    // 2. Video URL Preview
    const videoUrlInput = document.getElementById('video_url_input');
    const videoPreview = document.getElementById('videoPreview');
    const videoPreviewVid = videoPreview.querySelector('video');
    const videoStatus = document.createElement('small');
    videoUrlInput.parentNode.appendChild(videoStatus);

    videoUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();

        // Check for Embeddable Links (YouTube/Vimeo)
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
            videoStatus.textContent = 'Vidéo prête (Lien Streaming détecté)';
            videoStatus.style.color = 'green';
            return;
        }

        // Reset iframe if exists
        const iframe = videoPreview.querySelector('iframe');
        if (iframe) iframe.style.display = 'none';
        videoPreviewVid.style.display = 'block';

        // Standard Direct File
        if (url && (url.startsWith('http'))) {
            videoPreviewVid.src = url;
            videoPreviewVid.controls = true;
            videoPreviewVid.load();
            videoPreview.style.display = 'block';
            videoStatus.textContent = 'Chargement de la vidéo...';
            videoStatus.style.color = 'blue';

            videoPreviewVid.onloadedmetadata = () => {
                videoStatus.textContent = 'Vidéo prête (Durée: ' + Math.round(videoPreviewVid.duration) + 's)';
                videoStatus.style.color = 'green';
            };

            videoPreviewVid.onerror = () => {
                videoStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Échec de l\'aperçu (Format ou CORS).';
                videoStatus.style.color = '#d97706';
            };
        } else {
            if (!url) {
                videoPreview.style.display = 'none';
                videoPreviewVid.src = '';
                videoStatus.textContent = '';
            }
        }
    });

    // Remove Btns
    document.getElementById('btnRemoveImage').addEventListener('click', () => {
        document.getElementById('image').value = '';
        document.getElementById('image_url_input').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        if (imageStatus) imageStatus.textContent = '';
        document.querySelector('.file-upload-wrapper[for="image"]').style.display = 'flex';
    });

    document.getElementById('btnRemoveVideo').addEventListener('click', () => {
        document.getElementById('video').value = '';
        document.getElementById('video_url_input').value = '';
        document.getElementById('videoPreview').style.display = 'none';
        if (videoStatus) videoStatus.textContent = '';
        const iframe = videoPreview.querySelector('iframe');
        if (iframe) iframe.src = '';

        document.querySelector('.file-upload-wrapper[for="video"]').style.display = 'flex';
    });

    // 5. Form Submission
    const form = document.getElementById('editCourseForm');
    const btnSubmit = document.getElementById('btnSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

        const formData = new FormData();

        // Mandatory fields
        formData.append('administrator_id', admin.id);
        // formData.append('instructor_id', document.getElementById('instructor_id').value);

        let instructorId = document.getElementById('instructor_id').value;
        if (instructorId && instructorId.startsWith('ADMIN:')) {
            const selectedOpt = document.getElementById('instructor_id').options[document.getElementById('instructor_id').selectedIndex];
            const adminData = JSON.parse(selectedOpt.dataset.admin);
            const fullName = `${adminData.first_name} ${adminData.last_name}`;

            try {
                const newInstructorData = new FormData();
                newInstructorData.append('full_name', fullName);
                newInstructorData.append('professional_title', adminData.type === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Administrateur');
                newInstructorData.append('organization', 'Administration');
                newInstructorData.append('short_bio', `Membre de l'équipe administrative. Contact: ${adminData.email}`);
                newInstructorData.append('status', 'ACTIVE');

                // Copy Avatar if exists
                if (adminData.avatar_url) {
                    newInstructorData.append('photo_url', adminData.avatar_url);
                }

                const newIns = await InstructorService.create(newInstructorData);
                instructorId = newIns.id;
            } catch (err) {
                console.error("Auto-create instructor error:", err);
                showToast('Erreur lors de la création du profil instructeur', 'error');
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-save"></i> Enregistrer les modifications';
                return;
            }
        }
        formData.append('instructor_id', instructorId);

        formData.append('title', document.getElementById('title').value);
        formData.append('category_id', document.getElementById('category_id').value);
        formData.append('moodle_url', document.getElementById('moodle_url').value);

        // Optional / Details
        formData.append('short_synopsis', document.getElementById('short_synopsis').value);
        formData.append('full_description', document.getElementById('full_description').value);
        formData.append('level', document.getElementById('level').value);
        formData.append('language', document.getElementById('language').value);
        formData.append('format', document.getElementById('format').value);
        formData.append('total_duration_minutes', document.getElementById('total_duration_minutes').value);
        formData.append('is_certifying', document.getElementById('is_certifying').checked ? 1 : 0);
        // formData.append('status', document.getElementById('status').value);

        // Objectives
        const objectivesText = document.getElementById('pedagogical_objectives').value;
        const objectivesArray = objectivesText.split('\n').filter(line => line.trim() !== '');
        formData.append('pedagogical_objectives', JSON.stringify(objectivesArray));

        // Media
        // Logic: If new file selected, send it. If URL input has value, send it. 
        // Backend handles "keep existing if null" usually, but for multipart PUT/POST we might need to be careful.
        // If imageSource is local and file is selected -> append file
        // If imageSource is url and value exists -> append url

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
            await CourseService.update(courseId, formData);
            showToast('Cours mis à jour avec succès !');
            setTimeout(() => {
                window.location.href = 'courses.html';
            }, 1000);

        } catch (error) {
            console.error('Update Error:', error);
            showToast('Erreur : ' + error.message, 'error');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-save"></i> Enregistrer les modifications';
        }
    });

});
