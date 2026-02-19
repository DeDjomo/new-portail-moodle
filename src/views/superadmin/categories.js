import apiRequest, { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm, showDangerConfirm, setLoading, setupLogout } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';

console.log('SuperAdmin - Categories Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard (SuperAdmin only)
    const admin = requireAuth('SUPER_ADMIN');
    if (!admin) return;

    setupLogout();

    // State
    let allCategories = [];
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');

    // 4. Fetch & Render Categories with Hierarchy
    async function loadCategories() {
        try {
            const rawCategories = await apiRequest('categories');
            allCategories = rawCategories; // Store raw for lookup

            // Build Hierarchy
            const hierarchy = buildHierarchy(rawCategories);
            renderCategories(hierarchy);
            updateParentSelect(rawCategories);
        } catch (error) {
            console.error('Error loading categories:', error);
            document.getElementById('categoriesTableBody').innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444;">Erreur de chargement.</td></tr>';
        }
    }

    function buildHierarchy(categories) {
        const map = {};
        const roots = [];

        // Init map
        categories.forEach(c => {
            map[c.id] = { ...c, children: [] };
        });

        // Link children
        categories.forEach(c => {
            if (c.parent_id && map[c.parent_id]) {
                map[c.parent_id].children.push(map[c.id]);
            } else {
                roots.push(map[c.id]);
            }
        });

        return roots;
    }

    function renderCategories(hierarchy, level = 0) {
        const tbody = document.getElementById('categoriesTableBody');

        if (level === 0) tbody.innerHTML = '';
        if (hierarchy.length === 0 && level === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#6B7280; padding:2rem;">Aucune catégorie trouvée.</td></tr>';
            return;
        }

        hierarchy.forEach(c => {
            // Indentation visual
            const indent = level * 30;
            const isSub = level > 0;
            const iconColor = isSub ? '#9CA3AF' : '#7C3AED';
            const bgColor = isSub ? 'transparent' : '#EDE9FE';
            const icon = isSub ? 'fa-level-up-alt fa-rotate-90' : 'fa-folder';

            const row = `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px; padding-left:${indent}px;">
                            <div style="width:40px; height:40px; background:${bgColor}; border-radius:10px; display:flex; align-items:center; justify-content:center; color:${iconColor};">
                                <i class="fas ${icon}"></i>
                            </div>
                            <span style="font-weight:${isSub ? '400' : '600'}; color:${isSub ? '#4B5563' : 'inherit'}">${c.name}</span>
                        </div>
                    </td>
                    <td style="color:#6B7280;"><code style="background:#F3F4F6; padding:2px 8px; border-radius:4px;">${c.slug}</code></td>
                    <td style="color:#6B7280; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.description || '-'}</td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <button class="action-btn" title="Créer sous-catégorie" data-add-sub="${c.id}" style="background:#D1FAE5; color:#059669; cursor:pointer;"><i class="fas fa-plus"></i></button>
                            <button class="action-btn" title="Modifier" data-edit="${c.id}" style="background:#DBEAFE; color:#2563EB; cursor:pointer;"><i class="fas fa-pen"></i></button>
                            <button class="action-btn" title="Supprimer" data-delete="${c.id}" style="background:#FEE2E2; color:#DC2626; cursor:pointer;"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);

            if (c.children && c.children.length > 0) {
                renderCategories(c.children, level + 1);
            }
        });

        if (level === 0) attachRowListeners();
    }

    function updateParentSelect(categories, excludeId = null) {
        const select = document.getElementById('parentCategory');
        select.innerHTML = '<option value="">Aucune (Catégorie racine)</option>';

        // Helper to flatten specifically for select (simple list)
        // But better to verify cycles? For now, just list all except self.
        // For UI clarity, maybe show hierarchy in select too?

        function addOptions(cats, level = 0) {
            cats.forEach(c => {
                if (c.id == excludeId) return; // Don't show self

                // Simple cycle prevention: if we were updating, we also shouldn't show our own children
                // checking excludeId children is harder here without full tree.
                // For now just basic self-exclusion.

                const prefix = '&nbsp;&nbsp;&nbsp;'.repeat(level);
                const option = document.createElement('option');
                option.value = c.id;
                option.innerHTML = `${prefix}${level > 0 ? '↳ ' : ''}${c.name}`;
                select.appendChild(option);

                // We need to find children of this cat from raw list to do deep options
                const children = categories.filter(child => child.parent_id == c.id);
                if (children.length > 0) addOptions(children, level + 1);
            });
        }

        // Build a fresh tree for the select options to ensure order
        const hierarchy = buildHierarchy(categories);
        addOptions(hierarchy);
    }

    function attachRowListeners() {
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
        });

        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteCategory(btn.dataset.delete));
        });

        document.querySelectorAll('[data-add-sub]').forEach(btn => {
            btn.addEventListener('click', () => openCreateSubModal(btn.dataset.addSub));
        });
    }

    // 5. Modal Logic
    document.getElementById('btnCreateCategory').addEventListener('click', () => openCreateModal());
    document.getElementById('btnCancelModal').addEventListener('click', () => closeModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    function openCreateModal() {
        form.reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('parentCategory').value = '';

        // Refresh options to show all
        updateParentSelect(allCategories);

        document.getElementById('modalTitle').textContent = 'Nouvelle Catégorie';
        modal.style.display = 'block';
    }

    function openCreateSubModal(parentId) {
        openCreateModal();
        document.getElementById('parentCategory').value = parentId;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-folder-plus"></i> Nouvelle Sous-Catégorie';
    }

    function openEditModal(id) {
        const data = allCategories.find(c => c.id == id);
        if (!data) return;

        document.getElementById('categoryId').value = data.id;
        document.getElementById('categoryName').value = data.name;
        document.getElementById('categoryDescription').value = data.description || '';

        // Refresh options excluding self
        updateParentSelect(allCategories, id);
        document.getElementById('parentCategory').value = data.parent_id || '';

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
            description: document.getElementById('categoryDescription').value || null,
            parent_id: document.getElementById('parentCategory').value || null
        };

        const btnSubmit = form.querySelector('button[type="submit"]');
        setLoading(btnSubmit, true, id ? 'Modification...' : 'Création...');

        try {
            await apiRequest(id ? `categories/${id}` : 'categories', id ? 'PUT' : 'POST', payload);
            showToast(id ? 'Catégorie mise à jour.' : 'Catégorie créée.', 'success');
            closeModal();
            loadCategories();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Une erreur est survenue.', 'error');
        } finally {
            setLoading(btnSubmit, false);
        }
    });

    // 7. Delete
    async function deleteCategory(id) {
        // Find name for better confirmation
        const cat = allCategories.find(c => c.id == id);
        const name = cat ? cat.name : 'Catégorie #' + id;

        showDangerConfirm(
            'Supprimer la catégorie ?',
            'Les sous-catégories seront détachées (deviendront racines).',
            name,
            async () => {
                try {
                    await apiRequest(`categories/${id}`, 'DELETE');
                    showToast('Catégorie supprimée.', 'success');
                    loadCategories();
                } catch (error) {
                    console.error(error);
                    showToast(error.message || 'Échec de la suppression.', 'error');
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
