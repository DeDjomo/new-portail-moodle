import CourseService from '../../services/courseService.js';
import CategoryService from '../../services/categoryService.js';
import InstructorService from '../../services/instructorService.js';
import AdminService from '../../services/adminService.js';
import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm, showDangerConfirm, showWarningConfirm, setupLogout } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';
import { setupQuickActions } from './quick-actions.js';
import { initMultiSelect } from '../../utils/multi-select-component.js';

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
        insSelect.innerHTML = '';

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

            // Multiple instructors
            const insSelect = document.getElementById('instructor_id');
            if (course.instructors && Array.isArray(course.instructors)) {
                const instructorIds = course.instructors.map(i => i.id.toString());
                Array.from(insSelect.options).forEach(opt => {
                    if (instructorIds.includes(opt.value)) {
                        opt.selected = true;
                    }
                });
            }

            initMultiSelect('instructor_id', 'Choisir des instructeurs...');

            document.getElementById('moodle_url').value = course.moodle_url || '';
            document.getElementById('prerequis').value = course.prerequis || '';
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
    const imageStatus = document.getElementById('imageUrlStatus') || (() => {
        const el = document.createElement('small');
        imageUrlInput.parentNode.appendChild(el);
        return el;
    })();

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
    const videoStatus = document.getElementById('videoUrlStatus') || (() => {
        const el = document.createElement('small');
        videoUrlInput.parentNode.appendChild(el);
        return el;
    })();

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

    // --- Helper: Check Completeness (Similar to create-course) ---
    function checkCompleteness() {
        const required = [
            'short_synopsis', 'full_description', 'pedagogical_objectives',
            'level', 'language', 'format', 'total_duration_minutes'
        ];
        const missing = [];

        required.forEach(id => {
            const el = document.getElementById(id);
            if (!el || !el.value || el.value.trim() === '' || el.value === '[]') {
                missing.push(document.querySelector(`label[for="${id}"]`)?.textContent.replace(' *', '') || id);
            }
        });

        const activeImageBtn = document.querySelector('.media-toggle[data-for="image"] .toggle-btn.active');
        const imageSource = activeImageBtn.dataset.type;
        const imageFile = document.getElementById('image').files[0];
        const imageUrl = document.getElementById('image_url_input').value.trim();
        const hasExistingImage = document.getElementById('imagePreview').style.display === 'block';

        if (!hasExistingImage && ((imageSource === 'local' && !imageFile) || (imageSource === 'url' && !imageUrl))) {
            missing.push("Image de couverture");
        }

        return missing;
    }

    // 5. Form Submission
    const form = document.getElementById('editCourseForm');
    const btnSubmit = document.getElementById('btnSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Initial Integrity Check
        const instructorSelect = document.getElementById('instructor_id');
        const selectedInstructors = Array.from(instructorSelect.selectedOptions).map(opt => opt.value).filter(v => v !== "");
        const categoryId = document.getElementById('category_id').value;

        if (selectedInstructors.length === 0 || !categoryId) {
            showToast('Veuillez choisir au moins un instructeur et une catégorie (*)', 'error');
            return;
        }

        // 2. Check Completeness
        const missingFields = checkCompleteness();
        const isComplete = missingFields.length === 0;

        if (isComplete) {
            import('../../utils/ui.js').then(ui => {
                ui.showCourseStatusModal({
                    title: 'Mettre à jour et Publier ?',
                    message: 'Toutes les informations sont complètes. Le cours sera mis à jour et restera (ou passera) en mode publié.',
                    confirmText: 'Mettre à jour & Publier',
                    confirmClass: 'publish',
                    onConfirm: () => submitForm('PUBLISHED')
                });
            });
        } else {
            const fieldsList = missingFields.map(f => `• ${f}`).join('<br>');
            import('../../utils/ui.js').then(ui => {
                ui.showCourseStatusModal({
                    title: 'Mettre à jour en Brouillon ?',
                    message: `Certains champs sont manquants :<br><br><div style="text-align:left; background:#F9FAFB; padding:1rem; border-radius:12px; font-size:0.9rem; color:#4B5563;">${fieldsList}</div><br>Le cours sera enregistré en tant que brouillon.`,
                    confirmText: 'Mettre à jour (Brouillon)',
                    confirmClass: 'draft',
                    onConfirm: () => submitForm('DRAFT')
                });
            });
        }
    });

    async function submitForm(status) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

        const formData = new FormData();
        formData.append('status', status);

        // Mandatory fields
        formData.append('administrator_id', admin.id);

        const instructorSelect = document.getElementById('instructor_id');
        const selectedOptions = Array.from(instructorSelect.selectedOptions).filter(opt => opt.value !== "");
        const finalInstructorIds = [];

        for (const opt of selectedOptions) {
            let val = opt.value;
            if (val.startsWith('ADMIN:')) {
                const adminData = JSON.parse(opt.dataset.admin);
                const fullName = `${adminData.first_name} ${adminData.last_name}`;

                try {
                    const newInstructorData = new FormData();
                    newInstructorData.append('full_name', fullName);
                    newInstructorData.append('professional_title', adminData.type === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Administrateur');
                    newInstructorData.append('organization', 'Administration');
                    newInstructorData.append('short_bio', `Membre de l'équipe administrative. Contact: ${adminData.email}`);
                    newInstructorData.append('status', 'ACTIVE');
                    if (adminData.avatar_url) newInstructorData.append('photo_url', adminData.avatar_url);

                    const newIns = await InstructorService.create(newInstructorData);
                    finalInstructorIds.push(newIns.id);
                } catch (err) {
                    console.error("Auto-create instructor error:", err);
                    showToast(`Erreur lors de la création du profil pour ${fullName}`, 'error');
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-save"></i> Enregistrer les modifications';
                    return;
                }
            } else {
                finalInstructorIds.push(val);
            }
        }

        // Append instructor IDs as array
        finalInstructorIds.forEach(id => {
            formData.append('instructor_ids[]', id);
        });

        formData.append('title', document.getElementById('title').value);
        formData.append('category_id', document.getElementById('category_id').value);
        formData.append('moodle_url', document.getElementById('moodle_url').value);
        formData.append('prerequis', document.getElementById('prerequis').value);

        // Optional / Details
        formData.append('short_synopsis', document.getElementById('short_synopsis').value);
        formData.append('full_description', document.getElementById('full_description').value);
        formData.append('level', document.getElementById('level').value);
        formData.append('language', document.getElementById('language').value);
        formData.append('format', document.getElementById('format').value);
        formData.append('total_duration_minutes', document.getElementById('total_duration_minutes').value);
        formData.append('is_certifying', document.getElementById('is_certifying').checked ? 1 : 0);

        // Objectives
        const objectivesText = document.getElementById('pedagogical_objectives').value;
        const objectivesArray = objectivesText.split('\n').filter(line => line.trim() !== '');
        formData.append('pedagogical_objectives', JSON.stringify(objectivesArray));

        // Media
        const activeImageBtn = document.querySelector('.media-toggle[data-for="image"] .toggle-btn.active');
        if (activeImageBtn.dataset.type === 'local') {
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) formData.append('image', imageFile);
        } else {
            const imageUrl = document.getElementById('image_url_input').value.trim();
            if (imageUrl) formData.append('image_url', imageUrl);
        }

        const activeVideoBtn = document.querySelector('.media-toggle[data-for="video"] .toggle-btn.active');
        if (activeVideoBtn.dataset.type === 'local') {
            const videoFile = document.getElementById('video').files[0];
            if (videoFile) formData.append('video', videoFile);
        } else {
            const videoUrl = document.getElementById('video_url_input').value.trim();
            if (videoUrl) formData.append('video_url', videoUrl);
        }

        try {
            await CourseService.update(courseId, formData);
            showToast(`Cours mis à jour en tant que ${status === 'PUBLISHED' ? 'publié' : 'brouillon'}.`);
            setTimeout(() => {
                const isSuperAdmin = window.location.pathname.includes('/superadmin/');
                window.location.href = isSuperAdmin ? 'my-courses.html' : 'courses.html';
            }, 1000);

        } catch (error) {
            console.error('Update Error:', error);
            showToast('Erreur : ' + error.message, 'error');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-save"></i> Enregistrer les modifications';
        }
    }

});
