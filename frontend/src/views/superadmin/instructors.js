import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm } from '../../utils/ui.js';

const API_BASE = 'http://localhost:8000';

console.log('SuperAdmin - Instructors Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard (SuperAdmin only)
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
        window.location.href = '../login.html';
        return;
    }

    const admin = JSON.parse(adminStr);

    if (admin.type !== 'SUPER_ADMIN') {
        window.location.href = '../admin/dashboard.html';
        return;
    }

    // 2. Populate User Info
    document.getElementById('sidebarName').textContent = `${admin.first_name} ${admin.last_name}`;
    if (admin.avatar_url) {
        document.getElementById('sidebarAvatar').src = resolveAssetPath(admin.avatar_url);
    }

    // 3. Logout Logic
    document.getElementById('btnLogout').addEventListener('click', (e) => {
        e.preventDefault();
        showCustomConfirm('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', () => {
            localStorage.removeItem('admin');
            window.location.href = '../login.html';
        });
    });

    // State
    let allInstructors = [];
    const modal = document.getElementById('instructorModal');
    const form = document.getElementById('instructorForm');

    // 4. Fetch & Render Instructors
    async function loadInstructors() {
        try {
            const res = await fetch(`${API_BASE}/instructors`);
            allInstructors = await res.json();
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
            const photoSrc = i.photo_url ? resolveAssetPath(i.photo_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(i.full_name)}&background=7C3AED&color=fff&size=120`;

            return `
                <div class="section-block" style="padding: 24px; text-align: center; position: relative;">
                    <div style="position:absolute; top:16px; right:16px; display:flex; gap:8px;">
                        <button class="action-btn" title="Modifier" data-edit="${i.id}"><i class="fas fa-pen"></i></button>
                        <button class="action-btn danger" title="Supprimer" data-delete="${i.id}"><i class="fas fa-trash"></i></button>
                    </div>
                    
                    <img src="${photoSrc}" alt="${i.full_name}" 
                        style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:16px; border: 3px solid #E5E7EB;">
                    
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

    function openCreateModal() {
        form.reset();
        document.getElementById('instructorId').value = '';
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
        const payload = {
            full_name: document.getElementById('fullName').value,
            professional_title: document.getElementById('professionalTitle').value || null,
            organization: document.getElementById('organization').value || null,
            short_bio: document.getElementById('shortBio').value || null,
            website: document.getElementById('website').value || null,
            linkedin_url: document.getElementById('linkedinUrl').value || null
        };

        try {
            const res = await fetch(`${API_BASE}/instructors${id ? `/${id}` : ''}`, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                showToast(id ? 'Instructeur mis à jour.' : 'Instructeur créé.', 'success');
                closeModal();
                loadInstructors();
            } else {
                showToast(data.message || 'Une erreur est survenue.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erreur réseau.', 'error');
        }
    });

    // 7. Delete
    async function deleteInstructor(id) {
        showCustomConfirm(
            'Supprimer l\'instructeur ?',
            'Cette action est irréversible.',
            async () => {
                try {
                    const res = await fetch(`${API_BASE}/instructors/${id}`, { method: 'DELETE' });

                    if (res.ok) {
                        showToast('Instructeur supprimé.', 'success');
                        loadInstructors();
                    } else {
                        const data = await res.json();
                        showToast(data.message || 'Échec de la suppression.', 'error');
                    }
                } catch (error) {
                    console.error(error);
                    showToast('Erreur réseau.', 'error');
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
