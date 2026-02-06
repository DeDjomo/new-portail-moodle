import CourseService from './src/services/courseService.js';

/**
 * Frontend Logic for ENSPY Portal
 * Fetches data from PHP Backend and renders UI
 */
document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loader');
    const coursesGrid = document.getElementById('coursesGrid');

    try {
        console.log('Fetching courses...');
        const response = await CourseService.getAll();
        console.log('Courses received:', response);

        const courses = response.data || response; // Handle different API response formats

        if (Array.isArray(courses) && courses.length > 0) {
            renderCourses(courses);
        } else {
            coursesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-tertiary);">Aucun cours disponible pour le moment.</p>';
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        coursesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--error);">Erreur lors du chargement des cours. Vérifiez la connexion au backend.</p>';
    } finally {
        // Hide loader with transition
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }
});

/**
 * Renders course cards into the grid
 * @param {Array} courses 
 */
function renderCourses(courses) {
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = ''; // Clear placeholders

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card fade-in';

        // Use a placeholder image if thumbnail is missing
        const bannerUrl = course.thumbnail_url || `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800`;

        card.innerHTML = `
            <div class="course-banner" style="background-image: url('${bannerUrl}')"></div>
            <div class="course-body">
                <div class="course-meta">${course.category_name || 'Général'}</div>
                <h3 class="course-title">${course.title}</h3>
                <div class="course-footer">
                    <span class="course-stats">${course.enrolled_count || 0} inscrits</span>
                    <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Détails</button>
                </div>
            </div>
        `;

        coursesGrid.appendChild(card);
    });
}
