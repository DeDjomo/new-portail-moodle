import CourseService from '../../services/courseService.js';
import { resolveAssetPath } from '../../services/api.js';
import { requireAuth } from '../../utils/auth-guard.js';

console.log('Courses Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    // View State
    const btnListView = document.getElementById('btnListView');
    const btnGridView = document.getElementById('btnGridView');
    // No change needed for admin/courses.js as it has no delete/archive buttons currently.
    const tableContainer = document.getElementById('coursesTableContainer');
    const gridContainer = document.getElementById('coursesGrid');

    // Store data for search
    let allCoursesData = [];

    // 4. Fetch & Render Data
    try {
        const response = await CourseService.getByAdmin(admin.id);
        // Handle if response is array or object with data
        allCoursesData = Array.isArray(response) ? response : (response.data || []);

        // Sort by id descending
        allCoursesData.sort((a, b) => b.id - a.id);

        renderTable(allCoursesData);
        renderGrid(allCoursesData);

    } catch (error) {
        console.error('Courses Page Error:', error);
        document.getElementById('coursesList').innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Erreur lors du chargement des cours.</td></tr>';
    }

    // Toggle Logic
    if (btnListView && btnGridView) {
        btnListView.addEventListener('click', () => switchView('list'));
        btnGridView.addEventListener('click', () => switchView('grid'));
    }

    function switchView(view) {
        if (view === 'list') {
            tableContainer.style.display = 'block';
            gridContainer.style.display = 'none';
            btnListView.classList.add('active');
            btnGridView.classList.remove('active');
        } else {
            tableContainer.style.display = 'none';
            gridContainer.style.display = 'grid';
            btnListView.classList.remove('active');
            btnGridView.classList.add('active');
        }
    }

    function renderTable(courses) {
        const tbody = document.getElementById('coursesList');
        tbody.innerHTML = '';

        if (courses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucun cours trouvé.</td></tr>';
            return;
        }

        courses.forEach(course => {
            const tr = document.createElement('tr');
            tr.dataset.title = course.title.toLowerCase(); // For search

            const statusClass = course.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft';
            const statusLabel = course.status === 'PUBLISHED' ? 'Publié' : 'Brouillon';

            let thumbUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=random&color=fff&size=64`;
            if (course.image_url) {
                thumbUrl = resolveAssetPath(course.image_url) + (course.image_url.includes('?') ? '&' : '?') + 't=' + Date.now();
            }

            tr.innerHTML = `
                <td>
                    <div class="course-info-cell">
                        <img src="${thumbUrl}" class="img-course-thumb" alt="thumb">
                        <span style="font-weight: 600;">${course.title}</span>
                    </div>
                </td>
                <td><span style="color: #6B7280; font-size: 0.9rem;">${course.category_name || 'Général'}</span></td>
                <td style="font-weight: 600;">${course.enrolled_count || 0}</td>
                <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <a href="edit-course.html?id=${course.id}" class="action-btn" title="Modifier" style="background:#DBEAFE; color:#2563EB;">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="../../course-details.html?id=${course.id}" target="_blank" class="action-btn" title="Voir" style="background:#EDE9FE; color:#7C3AED;">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderGrid(courses) {
        gridContainer.innerHTML = '';

        if (courses.length === 0) {
            gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #6B7280;">Aucun cours trouvé.</div>`;
            return;
        }

        courses.forEach(course => {
            const card = document.createElement('article');
            card.className = 'course-card fade-up';
            card.dataset.title = course.title.toLowerCase(); // For search

            let banner = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=random&color=fff&size=400`;
            if (course.image_url) {
                banner = resolveAssetPath(course.image_url) + (course.image_url.includes('?') ? '&' : '?') + 't=' + Date.now();
            }

            const statusLabel = course.status === 'PUBLISHED' ? 'Publié' : 'Brouillon';
            const statusColor = course.status === 'PUBLISHED' ? '#10B981' : '#F59E0B'; // Green vs Amber

            card.innerHTML = `
                <div class="card-banner" style="background-image: url('${banner}')">
                    <span class="card-badge" style="background:${statusColor}">${statusLabel}</span>
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span>${course.category_name || 'Général'}</span>
                        <span>•</span>
                        <span>${course.level || 'Tous niveaux'}</span>
                    </div>
                    <h3 class="card-title">${course.title}</h3>
                    
                    <div class="card-footer">
                        <div class="card-stats">
                            <span><i class="fas fa-user-graduate"></i> ${course.enrolled_count || 0}</span>
                        </div>
                        <div class="card-actions">
                            <a href="edit-course.html?id=${course.id}" class="action-btn" title="Modifier" style="background:#DBEAFE; color:#2563EB;">
                                <i class="fas fa-edit"></i>
                            </a>
                            <a href="../../course-details.html?id=${course.id}" target="_blank" class="action-btn" title="Voir" style="background:#EDE9FE; color:#7C3AED;">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            gridContainer.appendChild(card);
        });
    }

    // 5. Search Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            // Filter Table
            const rows = document.querySelectorAll('#coursesList tr');
            rows.forEach(row => {
                const title = row.dataset.title || '';
                row.style.display = title.includes(searchTerm) ? '' : 'none';
            });

            // Filter Grid
            const cards = document.querySelectorAll('.course-card');
            cards.forEach(card => {
                const title = card.dataset.title || '';
                card.style.display = title.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    }
});
