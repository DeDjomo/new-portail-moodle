import CourseService from '../../services/courseService.js';
import CategoryService from '../../services/categoryService.js';
import InstructorService from '../../services/instructorService.js';
import AdminService from '../../services/adminService.js';
import { BASE_URL, resolveAssetPath } from '../../services/api.js';
import { requireAuth } from '../../utils/auth-guard.js';
import { showToast, showCustomConfirm, setupLogout, setLoading } from '../../utils/ui.js';
import { setupQuickActions } from './quick-actions.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    setupLogout();

    // 2. Load Select Data
    async function refreshSelects() {
        try {
            const [categories, instructors, admins] = await Promise.all([
                CategoryService.getAll(),
                InstructorService.getAll(),
                AdminService.getAll()
            ]);

            const catSelect = document.getElementById('category_id');
            const currentCat = catSelect.value;
            catSelect.innerHTML = '<option value="">Choisir une catégorie...</option>';
            categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                catSelect.appendChild(opt);
            });
            if (currentCat) catSelect.value = currentCat;

            const insSelect = document.getElementById('instructor_id');
            const currentIns = insSelect.value;
            insSelect.innerHTML = '<option value="">Choisir un instructeur...</option>';

            // 1. Add Existing Instructors
            const instructorGroup = document.createElement('optgroup');
            instructorGroup.label = "Instructeurs";
            instructors.forEach(i => {
                const opt = document.createElement('option');
                opt.value = i.id;
                opt.textContent = i.full_name;
                instructorGroup.appendChild(opt);
            });
            insSelect.appendChild(instructorGroup);

            // 2. Add Admins
            const adminGroup = document.createElement('optgroup');
            adminGroup.label = "Administrateurs";

            // Helper to normalize strings for comparison
            const norm = (str) => str.toLowerCase().replace(/\s+/g, '');
            const instructorNames = instructors.map(i => norm(i.full_name));

            admins.forEach(a => {
                const fullName = `${a.first_name} ${a.last_name}`;
                // Only show if not already an instructor
                if (!instructorNames.includes(norm(fullName))) {
                    const opt = document.createElement('option');
                    opt.value = `ADMIN:${a.id}`; // Marker for Admin
                    opt.textContent = fullName;
                    opt.dataset.admin = JSON.stringify(a); // Store header data
                    adminGroup.appendChild(opt);
                }
            });
            insSelect.appendChild(adminGroup);

            if (currentIns) insSelect.value = currentIns;

        } catch (error) {
            console.error('Error loading form data:', error);
        }
    }

    await refreshSelects();

    // 2.1 Setup Quick Actions
    setupQuickActions(
        (newCategory) => {
            // On Category Custom Created
            const catSelect = document.getElementById('category_id');
            const opt = document.createElement('option');
            opt.value = newCategory.id;
            opt.textContent = newCategory.name;
            opt.selected = true;
            catSelect.appendChild(opt);
        },
        (newInstructor) => {
            // On Instructor Custom Created
            const insSelect = document.getElementById('instructor_id');
            const opt = document.createElement('option');
            opt.value = newInstructor.id;
            opt.textContent = newInstructor.full_name;
            opt.selected = true;
            insSelect.appendChild(opt);
        }
    );


    // --- Helper: Get Embed URL ---
    function getEmbedUrl(url) {
        if (!url) return null;

        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch && ytMatch[1]) {
            return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        // Vimeo
        const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
        if (vimeoMatch && vimeoMatch[1]) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        return null;
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

            // Hide Upload Wrapper
            document.querySelector('.file-upload-wrapper[for="image"]').style.display = 'none';

            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviewImg.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    const imageUrlInput = document.getElementById('image_url_input');
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
                console.warn('[DEBUG] Image URL failed to load:', url);
                imageStatus.textContent = 'Impossible de charger l\'image (CORS ou lien invalide)';
                imageStatus.style.color = 'red';
            };
        } else {
            imagePreview.style.display = 'none';
            imageStatus.textContent = '';
        }
    });

    btnRemoveImage.addEventListener('click', () => {
        imageInput.value = '';
        imageUrlInput.value = '';
        imagePreview.style.display = 'none';

        // Show Upload Wrapper
        document.getElementById('imageName').textContent = 'Cliquer pour choisir une image';
        const wrapper = document.querySelector('.file-upload-wrapper[for="image"]');
        wrapper.style.display = 'flex'; // Restore flex display
        wrapper.classList.remove('has-file');

        // Restore input groups logic (ensure checks which tab is active)
        const source = document.querySelector('.media-toggle[data-for="image"] .toggle-btn.active').dataset.type;
        document.getElementById('imageLocalGroup').style.display = source === 'local' ? 'block' : 'none';
        document.getElementById('imageUrlGroup').style.display = source === 'url' ? 'block' : 'none';
        if (source === 'url') wrapper.style.display = 'none'; // Keep hidden if URL tab is active
    });

    const videoInput = document.getElementById('video');
    const videoPreview = document.getElementById('videoPreview');
    const videoPreviewVid = videoPreview.querySelector('video');
    const btnRemoveVideo = document.getElementById('btnRemoveVideo');

    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('videoName').textContent = file.name;

            // Hide Upload Wrapper
            document.querySelector('.file-upload-wrapper[for="video"]').style.display = 'none';

            const url = URL.createObjectURL(file);
            videoPreviewVid.src = url;
            videoPreview.style.display = 'block';
        }
    });

    const videoUrlInput = document.getElementById('video_url_input');
    const videoStatus = document.getElementById('videoUrlStatus') || (() => {
        const el = document.createElement('small');
        videoUrlInput.parentNode.appendChild(el);
        return el;
    })();

    videoUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();

        // 1. Check for Embeddable Links (YouTube/Vimeo)
        const embedUrl = getEmbedUrl(url);
        if (embedUrl) {
            // Hide standard video, show iframe
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

        // 2. Standard Direct File Logic
        if (url && (url.startsWith('http'))) {
            videoPreviewVid.src = url;
            videoPreviewVid.controls = true; // Enable controls for playback
            videoPreviewVid.load(); // Force load for video
            videoPreview.style.display = 'block';

            videoStatus.textContent = 'Chargement de la vidéo...';
            videoStatus.style.color = 'blue';

            // When video metadata is loaded
            videoPreviewVid.onloadedmetadata = () => {
                videoStatus.textContent = 'Vidéo prête à être jouée (Durée: ' + Math.round(videoPreviewVid.duration) + 's)';
                videoStatus.style.color = 'green';
            };

            videoPreviewVid.onerror = () => {
                console.warn('[DEBUG] Video URL failed to load:', url);
                // Distinguish generic error vs likely CORS
                videoStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Échec de l\'aperçu (Format ou CORS). <br>Si le lien est direct (.mp4), l\'enregistrement fonctionnera quand même.';
                videoStatus.style.color = '#d97706'; // Amber color
            };
        } else {
            videoPreview.style.display = 'none';
            videoPreviewVid.src = '';
            videoStatus.textContent = '';
            const iframe = videoPreview.querySelector('iframe');
            if (iframe) iframe.style.display = 'none';
        }
    });

    btnRemoveVideo.addEventListener('click', () => {
        videoInput.value = '';
        videoUrlInput.value = '';
        videoPreview.style.display = 'none';
        videoPreviewVid.src = '';
        videoStatus.textContent = '';

        // Show Upload Wrapper
        document.getElementById('videoName').textContent = 'Cliquer pour choisir une vidéo';
        const wrapper = document.querySelector('.file-upload-wrapper[for="video"]');
        wrapper.style.display = 'flex';
        wrapper.classList.remove('has-file');

        const iframe = videoPreview.querySelector('iframe');
        if (iframe) iframe.src = '';

        // Restore input groups logic
        const source = document.querySelector('.media-toggle[data-for="video"] .toggle-btn.active').dataset.type;
        document.getElementById('videoLocalGroup').style.display = source === 'local' ? 'block' : 'none';
        document.getElementById('videoUrlGroup').style.display = source === 'url' ? 'block' : 'none';
        if (source === 'url') wrapper.style.display = 'none';
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
        // Mandatory fields
        formData.append('administrator_id', admin.id);

        // Check if selected instructor is an Admin that needs conversion
        let instructorId = document.getElementById('instructor_id').value;
        if (instructorId && instructorId.startsWith('ADMIN:')) {
            // It's an admin! We must create an Instructor profile first.
            const adminId = instructorId.split(':')[1];
            // Find the option to get the stored dataset or just fetch? 
            // We can retrieve the name from text content or just rely on what we have.
            // Better: We stored data in dataset, but reading dataset from select value is tricky.
            // Just find the selected option.
            const selectedOpt = document.getElementById('instructor_id').options[document.getElementById('instructor_id').selectedIndex];
            const adminData = JSON.parse(selectedOpt.dataset.admin);

            const fullName = `${adminData.first_name} ${adminData.last_name}`;

            // Create Instructor Profile
            try {
                // We need to pass FormData or Object. Service handles both.
                // Required: full_name, professional_title, organization
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
                console.log('Auto-created instructor for admin:', newIns);
                instructorId = newIns.id;

            } catch (err) {
                console.error("Failed to auto-create instructor from admin:", err);
                alertError.style.display = 'block';
                alertError.textContent = 'Erreur : Impossible de créer le profil instructeur pour cet admin.';
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-save"></i> Enregistrer le cours';
                return; // Stop submission
            }
        }

        formData.append('instructor_id', instructorId);
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
        // formData.append('status', document.getElementById('status').value);

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
                // Check if we are in superadmin or standard admin context
                const isSuperAdmin = window.location.pathname.includes('/superadmin/');
                if (isSuperAdmin) {
                    window.location.href = 'my-courses.html';
                } else {
                    window.location.href = 'courses.html';
                }
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
