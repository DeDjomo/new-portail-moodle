import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm } from '../../utils/ui.js';

const API_BASE = 'http://localhost:8000';

console.log('SuperAdmin - Categories Page loaded');

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
    let allCategories = [];
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');

    // 4. Fetch & Render Categories
    async function loadCategories() {
        try {
            const res = await fetch(`${API_BASE}/categories`);
            allCategories = await res.json();
            renderCategories(allCategories);
        } catch (error) {
            console.error('Error loading categories:', error);
            document.getElementById('categoriesTableBody').innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444;">Erreur de chargement.</td></tr>';
        }
    }

    function renderCategories(categories) {
        const tbody = document.getElementById('categoriesTableBody');

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#6B7280; padding:2rem;">Aucune catégorie trouvée.</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(c => {
            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:40px; height:40px; background:#EDE9FE; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#7C3AED;">
                                <i class="fas fa-folder"></i>
                            </div>
                            <span style="font-weight:600;">${c.name}</span>
                        </div>
                    </td>
                    <td style="color:#6B7280;"><code style="background:#F3F4F6; padding:2px 8px; border-radius:4px;">${c.slug}</code></td>
                    <td style="color:#6B7280; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.description || '-'}</td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <button class="action-btn" title="Modifier" data-edit="${c.id}"><i class="fas fa-pen"></i></button>
                            <button class="action-btn danger" title="Supprimer" data-delete="${c.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        attachRowListeners();
    }

    function attachRowListeners() {
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
        });

        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteCategory(btn.dataset.delete));
        });
    }

    // 5. Modal Logic
    document.getElementById('btnCreateCategory').addEventListener('click', () => openCreateModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => closeModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    function openCreateModal() {
        form.reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('modalTitle').textContent = 'Nouvelle Catégorie';
        modal.style.display = 'block';
    }

    function openEditModal(id) {
        const data = allCategories.find(c => c.id == id);
        if (!data) return;

        document.getElementById('categoryId').value = data.id;
        document.getElementById('categoryName').value = data.name;
        document.getElementById('categoryDescription').value = data.description || '';
        document.getElementById('modalTitle').textContent = 'Modifier Catégorie';

        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // 6. Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('categoryId').value;
        const payload = {
            name: document.getElementById('categoryName').value,
            description: document.getElementById('categoryDescription').value || null
        };

        try {
            const res = await fetch(`${API_BASE}/categories${id ? `/${id}` : ''}`, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                showToast(id ? 'Catégorie mise à jour.' : 'Catégorie créée.', 'success');
                closeModal();
                loadCategories();
            } else {
                showToast(data.message || 'Une erreur est survenue.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erreur réseau.', 'error');
        }
    });

    // 7. Delete
    async function deleteCategory(id) {
        showCustomConfirm(
            'Supprimer la catégorie ?',
            'Cette action est irréversible. Les cours associés pourraient être affectés.',
            async () => {
                try {
                    const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });

                    if (res.ok) {
                        showToast('Catégorie supprimée.', 'success');
                        loadCategories();
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

    // Initial Load
    await loadCategories();

    // Check for ?action=create
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
        openCreateModal();
    }
});
