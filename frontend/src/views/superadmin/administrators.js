import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm } from '../../utils/ui.js';

const API_BASE = 'http://localhost:8000';

console.log('SuperAdmin - Administrators Page loaded');

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
    let allAdmins = [];
    const modal = document.getElementById('adminModal');
    const form = document.getElementById('adminForm');

    // 4. Fetch & Render Admins
    async function loadAdmins() {
        try {
            const res = await fetch(`${API_BASE}/administrators`);
            allAdmins = await res.json();
            renderAdmins(allAdmins);
        } catch (error) {
            console.error('Error loading admins:', error);
            document.getElementById('adminsTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; color:#EF4444;">Erreur de chargement.</td></tr>';
        }
    }

    function renderAdmins(admins) {
        const tbody = document.getElementById('adminsTableBody');

        if (admins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#6B7280; padding:2rem;">Aucun administrateur trouvé.</td></tr>';
            return;
        }

        tbody.innerHTML = admins.map(a => {
            const avatarSrc = a.avatar_url ? resolveAssetPath(a.avatar_url) : `https://ui-avatars.com/api/?name=${a.first_name}+${a.last_name}&background=7C3AED&color=fff`;
            const typeLabel = a.type === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Standard';
            const typeBadge = a.type === 'SUPER_ADMIN'
                ? '<span style="background:#EDE9FE; color:#7C3AED; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600;">Super Admin</span>'
                : '<span style="background:#F3F4F6; color:#4B5563; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600;">Standard</span>';
            const statusBadge = a.status === 'ACTIVE'
                ? '<span class="badge-active">Actif</span>'
                : '<span class="badge-suspended">Suspendu</span>';
            const lastLogin = a.last_login ? new Date(a.last_login).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jamais';

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${avatarSrc}" alt="${a.first_name}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;">
                            <span style="font-weight:600;">${a.first_name} ${a.last_name}</span>
                        </div>
                    </td>
                    <td><a href="mailto:${a.email}" style="color:#7C3AED; text-decoration:none;">${a.email}</a></td>
                    <td>${typeBadge}</td>
                    <td>${statusBadge}</td>
                    <td style="color:#6B7280;">${lastLogin}</td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <button class="action-btn" title="Modifier" data-edit="${a.id}"><i class="fas fa-pen"></i></button>
                            <button class="action-btn" title="${a.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}" data-toggle="${a.id}" data-status="${a.status}">
                                <i class="fas ${a.status === 'ACTIVE' ? 'fa-ban' : 'fa-check'}"></i>
                            </button>
                            <button class="action-btn danger" title="Supprimer" data-delete="${a.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        attachRowListeners();
    }

    function attachRowListeners() {
        // Edit
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
        });

        // Toggle Status
        document.querySelectorAll('[data-toggle]').forEach(btn => {
            btn.addEventListener('click', () => toggleStatus(btn.dataset.toggle, btn.dataset.status));
        });

        // Delete
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteAdmin(btn.dataset.delete));
        });
    }

    // 5. Modal Logic
    document.getElementById('btnCreateAdmin').addEventListener('click', () => openCreateModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => closeModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    function openCreateModal() {
        form.reset();
        document.getElementById('adminId').value = '';
        document.getElementById('modalTitle').textContent = 'Nouvel Administrateur';
        document.getElementById('password').required = true;
        document.getElementById('passwordHint').textContent = '(requis)';
        modal.style.display = 'block';
    }

    function openEditModal(id) {
        const adminData = allAdmins.find(a => a.id == id);
        if (!adminData) return;

        document.getElementById('adminId').value = adminData.id;
        document.getElementById('lastName').value = adminData.last_name;
        document.getElementById('firstName').value = adminData.first_name;
        document.getElementById('email').value = adminData.email;
        document.getElementById('type').value = adminData.type;
        document.getElementById('phone').value = adminData.phone || '';
        document.getElementById('password').value = '';
        document.getElementById('password').required = false;
        document.getElementById('passwordHint').textContent = '(laisser vide pour ne pas changer)';
        document.getElementById('modalTitle').textContent = 'Modifier Administrateur';

        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // 6. Form Submit (Create or Update)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('adminId').value;
        const payload = {
            last_name: document.getElementById('lastName').value,
            first_name: document.getElementById('firstName').value,
            email: document.getElementById('email').value,
            type: document.getElementById('type').value,
            phone: document.getElementById('phone').value || null
        };

        const password = document.getElementById('password').value;
        if (password) {
            payload.password = password;
        }

        try {
            let res;
            if (id) {
                // Update
                res = await fetch(`${API_BASE}/administrators/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create (password required)
                if (!password) {
                    showToast('Le mot de passe est requis pour un nouvel admin.', 'error');
                    return;
                }
                res = await fetch(`${API_BASE}/administrators`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();

            if (res.ok) {
                showToast(id ? 'Administrateur mis à jour.' : 'Administrateur créé.', 'success');
                closeModal();
                loadAdmins();
            } else {
                showToast(data.message || 'Une erreur est survenue.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erreur réseau.', 'error');
        }
    });

    // 7. Toggle Status (Suspend/Activate)
    async function toggleStatus(id, currentStatus) {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const actionLabel = newStatus === 'SUSPENDED' ? 'suspendre' : 'activer';

        showCustomConfirm(
            `${newStatus === 'SUSPENDED' ? 'Suspendre' : 'Activer'} l'administrateur ?`,
            `Voulez-vous vraiment ${actionLabel} cet administrateur ?`,
            async () => {
                try {
                    const res = await fetch(`${API_BASE}/administrators/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (res.ok) {
                        showToast(`Administrateur ${newStatus === 'SUSPENDED' ? 'suspendu' : 'activé'}.`, 'success');
                        loadAdmins();
                    } else {
                        const data = await res.json();
                        showToast(data.message || 'Échec de la mise à jour.', 'error');
                    }
                } catch (error) {
                    console.error(error);
                    showToast('Erreur réseau.', 'error');
                }
            }
        );
    }

    // 8. Delete Admin
    async function deleteAdmin(id) {
        showCustomConfirm(
            'Supprimer l\'administrateur ?',
            'Cette action est irréversible. L\'administrateur sera définitivement supprimé.',
            async () => {
                try {
                    const res = await fetch(`${API_BASE}/administrators/${id}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        showToast('Administrateur supprimé.', 'success');
                        loadAdmins();
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

    // 9. Filters
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');

    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const type = filterType.value;
        const status = filterStatus.value;

        const filtered = allAdmins.filter(a => {
            const matchesSearch = a.first_name.toLowerCase().includes(search) ||
                a.last_name.toLowerCase().includes(search) ||
                a.email.toLowerCase().includes(search);
            const matchesType = !type || a.type === type;
            const matchesStatus = !status || a.status === status;
            return matchesSearch && matchesType && matchesStatus;
        });

        renderAdmins(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    filterType.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);

    // Initial Load
    await loadAdmins();

    // Check for ?action=create
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
        openCreateModal();
    }
});
