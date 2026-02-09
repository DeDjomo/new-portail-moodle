import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm, setupLogout } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';

console.log('SuperAdmin Dashboard loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard (SuperAdmin only)
    const admin = requireAuth('SUPER_ADMIN');
    if (!admin) return;

    // 2. Populate User Info (Welcome Name only, sidebar handled by auth guard)
    document.getElementById('welcomeName').textContent = admin.first_name;

    // 3. Logout Logic
    setupLogout();

    // 4. Fetch Global Stats
    try {
        // Fetch all counts in parallel
        const [adminsRes, instructorsRes, coursesRes, studentsRes] = await Promise.all([
            fetch('http://localhost:8000/administrators').then(r => r.json()),
            fetch('http://localhost:8000/instructors').then(r => r.json()),
            fetch('http://localhost:8000/courses').then(r => r.json()),
            fetch('http://localhost:8000/students').then(r => r.json())
        ]);

        // Update Stats Cards
        // Filter out SuperAdmins from the count
        const standardAdmins = Array.isArray(adminsRes) ? adminsRes.filter(a => a.type === 'STANDARD_ADMIN') : [];
        document.getElementById('totalAdmins').textContent = standardAdmins.length;
        document.getElementById('totalInstructors').textContent = Array.isArray(instructorsRes) ? instructorsRes.length : 0;
        document.getElementById('totalCourses').textContent = Array.isArray(coursesRes) ? coursesRes.length : 0;
        document.getElementById('totalStudents').textContent = Array.isArray(studentsRes) ? studentsRes.length : 0;

    } catch (error) {
        console.error('Error fetching stats:', error);
    }

    // 5. Fetch Recent Enrollments
    try {
        const enrollmentsRes = await fetch('http://localhost:8000/enrollments?action=getRecent&limit=5').then(r => r.json());
        const tbody = document.getElementById('recentEnrollments');

        if (Array.isArray(enrollmentsRes) && enrollmentsRes.length > 0) {
            tbody.innerHTML = enrollmentsRes.map(e => {
                const date = new Date(e.enrolled_at);
                const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                return `
                    <tr>
                        <td>${e.first_name} ${e.last_name}</td>
                        <td>${e.course_title || 'N/A'}</td>
                        <td>${e.admin_name || 'N/A'}</td>
                        <td>${dateStr}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#6B7280;">Aucune inscription récente.</td></tr>';
        }

    } catch (error) {
        console.error('Error fetching recent enrollments:', error);
        document.getElementById('recentEnrollments').innerHTML = '<tr><td colspan="4" style="text-align:center; color:#EF4444;">Erreur de chargement.</td></tr>';
    }
});
