import EnrollmentService from '../../services/enrollmentService.js';
import { resolveAssetPath } from '../../services/api.js';

console.log('Statistics Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
        window.location.href = '../../login.html';
        return;
    }

    const admin = JSON.parse(adminStr);

    // 2. Populate User Info
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

    // 4. Fetch Stats
    try {
        const stats = await EnrollmentService.getAdminStats(admin.id);

        // Update Counters
        document.getElementById('statTotalStudents').textContent = stats.total_students || 0;
        document.getElementById('statPending').textContent = (stats.status_distribution?.PENDING || 0);
        document.getElementById('statTotal').textContent = stats.total_enrollments || 0;

        // Render Charts
        renderStatusChart(stats.status_distribution);
        renderCoursesChart(stats.top_courses);

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
});

// Helper: Render Pie Chart (Status)
function renderStatusChart(distribution) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const data = {
        labels: ['En Attente', 'Traités'],
        datasets: [{
            data: [distribution.PENDING || 0, distribution.DONE || 0],
            backgroundColor: [
                '#F59E0B', // Orange for Pending
                '#10B981'  // Green for Done
            ],
            hoverOffset: 4
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Helper: Render Bar Chart (Top Courses)
function renderCoursesChart(courses) {
    const ctx = document.getElementById('coursesChart');
    if (!ctx) return;

    if (!courses || courses.length === 0) {
        // Handle empty state if needed
        return;
    }

    const labels = courses.map(c => c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title);
    const dataValues = courses.map(c => c.enrollment_count);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre d\'inscrits',
                data: dataValues,
                backgroundColor: '#3B82F6', // Blue
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal Bar Chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}
