import CourseService from './src/services/courseService.js';
import CategoryService from './src/services/categoryService.js';

/**
 * Frontend Logic for ENSPY Portal
 * Exact replica of Dashboard data handling
 */
document.addEventListener('DOMContentLoaded', async () => {
    initUI();
    await loadDashboardData();
});

function initUI() {
    const profileBtn = document.querySelector('.profile-button');
    const dropdown = document.getElementById('dropdownMenu');

    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
    }
}

async function loadDashboardData() {
    const loader = document.getElementById('loader');

    try {
        // Fetch Courses and Categories in parallel
        const [coursesRes, categoriesRes] = await Promise.all([
            CourseService.getAll(),
            CategoryService.getAll()
        ]);

        const courses = coursesRes.data || coursesRes;
        const categories = categoriesRes.data || categoriesRes;

        // 1. Update Stats
        const published = courses.filter(c => c.status === 'PUBLISHED').length;
        const drafts = courses.filter(c => c.status === 'DRAFT').length;
        const totalEnrollments = courses.reduce((sum, c) => sum + parseInt(c.enrolled_count || 0), 0);

        document.getElementById('totalCourses').textContent = courses.length;
        document.getElementById('publishedCourses').textContent = published;
        document.getElementById('draftCourses').textContent = drafts;
        document.getElementById('totalEnrollments').textContent = totalEnrollments;

        // 2. Render Chart (Category Distribution)
        renderCategoryChart(courses, categories);

        // 3. Render Popular Courses
        renderPopularCourses(courses);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    } finally {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 400);
        }
    }
}

function renderCategoryChart(courses, categories) {
    const container = document.getElementById('categoryDistribution');
    container.innerHTML = '';

    // Calculate count per category
    const stats = categories.map(cat => {
        const count = courses.filter(c => c.category_id == cat.id).length;
        return { name: cat.name, count };
    }).filter(s => s.count > 0);

    if (stats.length === 0) {
        container.innerHTML = '<div class="loading-text">Aucune donnée disponible.</div>';
        return;
    }

    const maxCount = Math.max(...stats.map(s => s.count));

    stats.forEach(s => {
        const bar = document.createElement('div');
        bar.className = 'bar-item';
        const percent = (s.count / maxCount) * 100;

        bar.innerHTML = `
            <div class="bar-info">
                <span>${s.name}</span>
                <span class="font-bold">${s.count}</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="width: 0%; background-color: var(--primary-500);"></div>
            </div>
        `;
        container.appendChild(bar);

        // Trigger animation
        setTimeout(() => {
            bar.querySelector('.bar-fill').style.width = `${percent}%`;
        }, 100);
    });
}

function renderPopularCourses(courses) {
    const container = document.getElementById('popularCourses');
    container.innerHTML = '';

    // Sort by enrollment count
    const popular = [...courses]
        .sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0))
        .slice(0, 5);

    popular.forEach((course, index) => {
        const item = document.createElement('a');
        item.href = `#`;
        item.className = 'list-item';

        const thumb = course.thumbnail_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=random`;

        item.innerHTML = `
            <span class="item-rank">${index + 1}</span>
            <img src="${thumb}" alt="" class="item-thumb">
            <div style="flex: 1; overflow: hidden;">
                <div class="item-name">${course.title}</div>
                <div class="item-meta">${course.enrolled_count || 0} inscrits</div>
            </div>
        `;
        container.appendChild(item);
    });
}
