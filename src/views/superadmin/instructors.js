import apiRequest, { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm, showDangerConfirm, setLoading, setupLogout } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';

console.log('SuperAdmin - Instructors Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard (SuperAdmin only)
    const admin = requireAuth('SUPER_ADMIN');
    if (!admin) return;

    setupLogout();

    // State
    let allInstructors = [];
    const modal = document.getElementById('instructorModal');
    const form = document.getElementById('instructorForm');

    // 4. Fetch & Render Instructors
    async function loadInstructors() {
        try {
            allInstructors = await apiRequest('instructors');
            renderInstructors(allInstructors);
        } catch (error) {
            console.error('Error loading instructors:', error);
            document.getElementById('instructorsGrid').innerHTML = '<div style="text-align:center; color:#EF4444; grid-column:1/-1;">Erreur de chargement.</div>';
        }
    }

    function renderInstructors(instructors) {
        const grid = document.getElementById('instructorsGrid');

        if (instructors.length === 0) {
            grid.innerHTML = '<div style="text-align:center; color:#6B7280; padding:3rem; grid-column:1/-1;">Aucun instructeur trouvé.</div>';
            return;
        }

        grid.innerHTML = instructors.map(i => {
            // Photo or Icon Logic
            let photoElement;
            if (i.photo_url) {
                const photoSrc = resolveAssetPath(i.photo_url);
                photoElement = `<img src="${photoSrc}" alt="${i.full_name}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:16px; border: 3px solid #E5E7EB;">`;
            } else {
                photoElement = `<div style="width:80px; height:80px; border-radius:50%; margin:0 auto 16px; border: 3px solid #E5E7EB; background:#F3F4F6; display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:2.5rem;">
                                    <i class="fas fa-user"></i>
                                </div>`;
            }

            return `
                <div class="section-block" style="padding: 24px; text-align: center; position: relative;">
                    <div style="position:absolute; top:16px; right:16px; display:flex; gap:8px;">
                        <button class="action-btn" title="Modifier" data-edit="${i.id}" style="background:#DBEAFE; color:#2563EB; cursor:pointer;"><i class="fas fa-pen"></i></button>
                        <button class="action-btn" title="Supprimer" data-delete="${i.id}" style="background:#FEE2E2; color:#DC2626; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                    
                    ${photoElement}
                    
                    <h3 style="font-size:1.1rem; margin-bottom:4px; color:var(--text-primary);">${i.full_name}</h3>
                    <p style="color:var(--superadmin-accent); font-size:0.9rem; font-weight:500; margin-bottom:8px;">${i.professional_title || ''}</p>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:12px;">${i.organization || ''}</p>
                    
                    ${i.short_bio ? `<p style="color:var(--text-secondary); font-size:0.85rem; line-height:1.4; margin-bottom:16px;">${i.short_bio.substring(0, 100)}${i.short_bio.length > 100 ? '...' : ''}</p>` : ''}
                    
                    <div style="display:flex; gap:12px; justify-content:center;">
                        ${i.website ? `<a href="${i.website}" target="_blank" class="action-btn" title="Site web"><i class="fas fa-globe"></i></a>` : ''}
                        ${i.linkedin_url ? `<a href="${i.linkedin_url}" target="_blank" class="action-btn" title="LinkedIn"><i class="fab fa-linkedin"></i></a>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        attachRowListeners();
    }

    function attachRowListeners() {
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
        });

        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteInstructor(btn.dataset.delete));
        });
    }

    // 5. Modal Logic
    document.getElementById('btnCreateInstructor').addEventListener('click', () => openCreateModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => closeModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Photo Preview Logic
    document.getElementById('photoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('photoPreview').src = ev.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    function openCreateModal() {
        form.reset();
        document.getElementById('instructorId').value = '';
        document.getElementById('photoPreview').src = 'https://ui-avatars.com/api/?name=New&background=E5E7EB&color=fff';
        document.getElementById('modalTitle').textContent = 'Nouvel Instructeur';
        modal.style.display = 'block';
    }

    function openEditModal(id) {
        const data = allInstructors.find(i => i.id == id);
        if (!data) return;

        document.getElementById('instructorId').value = data.id;
        document.getElementById('fullName').value = data.full_name;
        document.getElementById('professionalTitle').value = data.professional_title || '';
        document.getElementById('organization').value = data.organization || '';
        document.getElementById('shortBio').value = data.short_bio || '';
        document.getElementById('website').value = data.website || '';
        document.getElementById('linkedinUrl').value = data.linkedin_url || '';

        if (data.photo_url) {
            document.getElementById('photoPreview').src = resolveAssetPath(data.photo_url);
        } else {
            // Use placeholder for form preview or maybe an icon placeholder image?
            // Since it's an img tag, we can't put fa-user inside easily without changing structure.
            // We'll stick to ui-avatars for the form preview as it's cleaner for "upload new" context, 
            // or use a generic placeholder image.
            document.getElementById('photoPreview').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=E5E7EB&color=9CA3AF`;
        }

        document.getElementById('modalTitle').textContent = 'Modifier Instructeur';

        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // 6. Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('instructorId').value;
        const formData = new FormData();

        formData.append('full_name', document.getElementById('fullName').value);
        formData.append('professional_title', document.getElementById('professionalTitle').value || '');
        formData.append('organization', document.getElementById('organization').value || '');
        formData.append('short_bio', document.getElementById('shortBio').value || '');
        formData.append('website', document.getElementById('website').value || '');
        formData.append('linkedin_url', document.getElementById('linkedinUrl').value || '');

        const photoFile = document.getElementById('photoInput').files[0];
        if (photoFile) {
            formData.append('photo', photoFile);
        }

        const btnSubmit = form.querySelector('button[type="submit"]');
        setLoading(btnSubmit, true, id ? 'Modification...' : 'Création...');

        try {
            // Note: Do NOT set Content-Type header when sending FormData
            // We use POST for both create and update. 
            // For update, we append _method=PUT to let the backend know (if it supports it), or just rely on the ID in URL.
            // Standard PHP handling for files often requires POST.

            if (id) {
                formData.append('_method', 'PUT');
            }

            const data = await apiRequest(id ? `instructors/${id}` : 'instructors', 'POST', formData, true);

            showToast(id ? 'Instructeur mis à jour.' : 'Instructeur créé.', 'success');
            closeModal();
            loadInstructors();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Une erreur est survenue.', 'error');
        } finally {
            setLoading(btnSubmit, false);
        }
    });

    // 7. Delete
    async function deleteInstructor(id) {
        // Find name
        const inst = allInstructors.find(i => i.id == id);
        const name = inst ? inst.full_name : 'Instructeur #' + id;

        showDangerConfirm(
            'Supprimer l\'instructeur ?',
            'Cette action est irréversible.',
            name,
            async () => {
                try {
                    await apiRequest(`instructors/${id}`, 'DELETE');
                    showToast('Instructeur supprimé.', 'success');
                    loadInstructors();
                } catch (error) {
                    console.error(error);
                    showToast(error.message || 'Échec de la suppression.', 'error');
                }
            }
        );
    }

    // 8. Search Filter
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase();
        const filtered = allInstructors.filter(i =>
            i.full_name.toLowerCase().includes(term) ||
            (i.organization && i.organization.toLowerCase().includes(term))
        );
        renderInstructors(filtered);
    });

    // Initial Load
    await loadInstructors();

    // Check for ?action=create
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
        openCreateModal();
    }
});
