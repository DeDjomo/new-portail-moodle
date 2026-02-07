import CourseService from '../../services/courseService.js';
import StudentService from '../../services/studentService.js';
import { BASE_URL, resolveAssetPath } from '../../services/api.js';

console.log('Dashboard loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
        window.location.href = '../../login.html';
        return;
    }

    const admin = JSON.parse(adminStr);

    // 2. Populate User Info
    document.getElementById('welcomeName').textContent = admin.first_name;
    document.getElementById('sidebarName').textContent = `${admin.first_name} ${admin.last_name}`;
    if (admin.avatar_url) {
        document.getElementById('sidebarAvatar').src = resolveAssetPath(admin.avatar_url);
    }

    // 3. Logout Logic
    document.getElementById('btnLogout').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            localStorage.removeItem('admin');
            window.location.href = '../../login.html';
        }
    });

    // 4. Fetch & Render Data
    try {
        const [courses, students] = await Promise.all([
            CourseService.getAll(),
            StudentService.getAll()
        ]);

        // Stats
        document.getElementById('statCourses').textContent = courses.length;
        document.getElementById('statStudents').textContent = students.length;

        // Calculate Total Enrollments (Real Data)
        const totalEnroll = courses.reduce((acc, c) => acc + (parseInt(c.enrolled_count) || 0), 0);
        document.getElementById('statTotalEnrollments').textContent = totalEnroll;

        // Render Course List (Latest 5)
        const tbody = document.getElementById('coursesList');
        tbody.innerHTML = '';

        // Sort by id descending (assuming higher ID = newer)
        const recentCourses = courses.sort((a, b) => b.id - a.id).slice(0, 5);

        if (recentCourses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucun cours trouvé.</td></tr>';
            return;
        }

        recentCourses.forEach(course => {
            const tr = document.createElement('tr');

            // Map backend status to new badge classes
            const statusClass = course.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft';
            const statusLabel = course.status === 'PUBLISHED' ? 'Publié' : 'Brouillon';

            // Thumb resolution
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
                    <a href="edit-course.html?id=${course.id}" class="action-btn" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="#" class="action-btn" title="Voir">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
    }

    // 5. Search Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#coursesList tr');

            rows.forEach(row => {
                const title = row.querySelector('td:first-child')?.textContent?.toLowerCase() || '';
                if (title.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
