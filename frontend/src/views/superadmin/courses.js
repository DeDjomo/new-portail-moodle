import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm, showDangerConfirm, showWarningConfirm } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';

const API_BASE = 'http://localhost:8000';

console.log('SuperAdmin - Courses Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard (SuperAdmin only)
    const admin = requireAuth('SUPER_ADMIN');
    if (!admin) return;

    // State
    let allCourses = [];
    let allCategories = [];
    let allAdmins = [];

    // 4. Load Filter Options
    async function loadFilterOptions() {
        try {
            // Categories
            const catRes = await fetch(`${API_BASE}/categories`);
            allCategories = await catRes.json();
            const catSelect = document.getElementById('filterCategory');
            allCategories.forEach(c => {
                catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });

            // Admins
            const adminRes = await fetch(`${API_BASE}/administrators`);
            allAdmins = await adminRes.json();
            const adminSelect = document.getElementById('filterAdmin');
            allAdmins.forEach(a => {
                adminSelect.innerHTML += `<option value="${a.id}">${a.first_name} ${a.last_name}</option>`;
            });
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }

    // 5. Fetch & Render Courses
    async function loadCourses() {
        try {
            const res = await fetch(`${API_BASE}/courses`);
            allCourses = await res.json();
            applyFiltersAndSort();
        } catch (error) {
            console.error('Error loading courses:', error);
            document.getElementById('coursesTableBody').innerHTML = '<tr><td colspan="7" style="text-align:center; color:#EF4444;">Erreur de chargement.</td></tr>';
        }
    }

    function applyFiltersAndSort() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const categoryId = document.getElementById('filterCategory').value;
        const status = document.getElementById('filterStatus').value;
        const adminId = document.getElementById('filterAdmin').value;
        const sortBy = document.getElementById('sortBy').value;

        let filtered = allCourses.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(search);
            const matchesCategory = !categoryId || c.category_id == categoryId;
            const matchesStatus = !status || c.status === status;
            const matchesAdmin = !adminId || c.administrator_id == adminId;
            return matchesSearch && matchesCategory && matchesStatus && matchesAdmin;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'enrolled_desc':
                    return (b.enrolled_count || 0) - (a.enrolled_count || 0);
                case 'enrolled_asc':
                    return (a.enrolled_count || 0) - (b.enrolled_count || 0);
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'title_desc':
                    return b.title.localeCompare(a.title);
                case 'created_desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return 0;
            }
        });

        renderCourses(filtered);
    }

    function renderCourses(courses) {
        const tbody = document.getElementById('coursesTableBody');
        document.getElementById('courseCount').textContent = `${courses.length} cours`;

        if (courses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#6B7280; padding:2rem;">Aucun cours trouvé.</td></tr>';
            return;
        }

        tbody.innerHTML = courses.map(c => {
            const imageSrc = c.image_url ? resolveAssetPath(c.image_url) : 'https://via.placeholder.com/60x40?text=Cours';

            // Status Badge
            let statusBadge = '';
            switch (c.status) {
                case 'PUBLISHED':
                    statusBadge = '<span class="badge-published">Publié</span>';
                    break;
                case 'DRAFT':
                    statusBadge = '<span class="badge-draft">Brouillon</span>';
                    break;
                case 'ARCHIVED':
                    statusBadge = '<span class="badge-suspended">Archivé</span>';
                    break;
                default:
                    statusBadge = `<span style="color:#6B7280;">${c.status}</span>`;
            }

            // Find admin name
            const adminData = allAdmins.find(a => a.id == c.administrator_id);
            const adminName = adminData ? `${adminData.first_name} ${adminData.last_name.charAt(0)}.` : 'N/A';

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${imageSrc}" alt="${c.title}" style="width:60px; height:40px; border-radius:8px; object-fit:cover;">
                            <div>
                                <span style="font-weight:600; display:block;">${c.title}</span>
                                <span style="color:#6B7280; font-size:0.8rem;">${c.level || ''}</span>
                            </div>
                        </div>
                    </td>
                    <td style="color:#6B7280;">${adminName}</td>
                    <td style="color:#6B7280;">${c.instructor_name || 'N/A'}</td>
                    <td style="color:#6B7280;">${c.category_name || 'N/A'}</td>
                    <td>
                        <span style="background:#E5E7EB; padding:4px 10px; border-radius:20px; font-size:0.85rem; font-weight:600;">
                            ${c.enrolled_count || 0}
                        </span>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <a href="edit-course.html?id=${c.id}" class="action-btn" title="Modifier" style="background:#DBEAFE; color:#2563EB;">
                                <i class="fas fa-pen"></i>
                            </a>${c.status !== 'ARCHIVED' ? `<button class="action-btn" title="Archiver" data-archive="${c.id}" style="background:#FEF3C7; color:#D97706; cursor:pointer;"><i class="fas fa-archive"></i></button>` : ''}
                            <button class="action-btn danger" title="Supprimer" data-delete="${c.id}" style="background:#FEE2E2; color:#DC2626; cursor:pointer;"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        attachRowListeners();
    }

    function attachRowListeners() {
        // Archive
        document.querySelectorAll('[data-archive]').forEach(btn => {
            btn.addEventListener('click', () => archiveCourse(btn.dataset.archive));
        });

        // Delete
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => deleteCourse(btn.dataset.delete));
        });
    }

    // 6. Archive Course
    async function archiveCourse(id) {
        showWarningConfirm(
            'Archiver ce cours ?',
            'Le cours sera masqué du catalogue mais conservé dans la base de données.',
            'Archiver',
            async () => {
                try {
                    const res = await fetch(`${API_BASE}/courses/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'ARCHIVED' })
                    });

                    if (res.ok) {
                        showToast('Cours archivé.', 'success');
                        loadCourses();
                    } else {
                        const data = await res.json();
                        showToast(data.message || 'Échec de l\'archivage.', 'error');
                    }
                } catch (error) {
                    console.error(error);
                    showToast('Erreur réseau.', 'error');
                }
            }
        );
    }

    // 7. Delete Course
    async function deleteCourse(id) {
        showDangerConfirm(
            'Supprimer ce cours ?',
            'Cette action est irréversible. Toutes les inscriptions associées seront également supprimées.',
            'Cours #' + id,
            async () => {
                try {
                    const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE' });

                    if (res.ok) {
                        showToast('Cours supprimé.', 'success');
                        loadCourses();
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

    // 8. Event Listeners for Filters
    document.getElementById('searchInput').addEventListener('input', applyFiltersAndSort);
    document.getElementById('filterCategory').addEventListener('change', applyFiltersAndSort);
    document.getElementById('filterStatus').addEventListener('change', applyFiltersAndSort);
    document.getElementById('filterAdmin').addEventListener('change', applyFiltersAndSort);
    document.getElementById('sortBy').addEventListener('change', applyFiltersAndSort);

    // Initial Load
    await loadFilterOptions();
    await loadCourses();
});
