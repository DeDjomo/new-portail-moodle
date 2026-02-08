import CourseService from '../../services/courseService.js';
import StudentService from '../../services/studentService.js';
import { BASE_URL, resolveAssetPath } from '../../services/api.js';
import { requireAuth } from '../../utils/auth-guard.js';

console.log('Dashboard loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    // 2. Populate User Info
    document.getElementById('welcomeName').textContent = admin.first_name;
    document.getElementById('sidebarName').textContent = `${admin.first_name} ${admin.last_name}`;
    if (admin.avatar_url) {
        document.getElementById('sidebarAvatar').src = resolveAssetPath(admin.avatar_url);
    }

    // 3. Logout Logic
    const btnLogout = document.getElementById('btnLogout');
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogout = document.getElementById('confirmLogout');

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('active');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            localStorage.removeItem('admin');
            window.location.href = '../../login.html';
        });
    }

    // Close modal on outside click
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) logoutModal.classList.remove('active');
        });
    }

    // 4. Fetch Dashboard Stats

    // 4. Fetch & Render Data
    try {
        const [courses, students] = await Promise.all([
            CourseService.getByAdmin(admin.id),
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

        // Sort by Enrollments descending
        const recentCourses = courses.sort((a, b) => (parseInt(b.enrolled_count) || 0) - (parseInt(a.enrolled_count) || 0)).slice(0, 5);

        if (recentCourses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucun cours trouvé.</td></tr>';
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
