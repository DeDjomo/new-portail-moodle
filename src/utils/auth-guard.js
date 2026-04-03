/**
 * Authentication Guard
 * Protects routes by checking for valid admin token and role permissions.
 * Redirects to login if unauthorized.
 * 
 * Usage:
 * import { requireAuth } from '../../utils/auth-guard.js';
 * 
 * // For Standard Admin pages
 * const admin = requireAuth('STANDARD_ADMIN');
 * 
 * // For Super Admin pages
 * const admin = requireAuth('SUPER_ADMIN');
 */

import { resolveAssetPath } from '../services/api.js';

export function requireAuth(requiredRole = null) {
    const adminStr = localStorage.getItem('admin');

    // 1. Check if logged in
    if (!adminStr) {
        // Determine depth to find login.html
        // Assuming structure: 
        // /admin/*.html -> ../../login.html
        // /superadmin/*.html -> ../../login.html
        // Actually, based on current file structure:
        // /frontend/admin/*.html -> ../login.html
        // /frontend/superadmin/*.html -> ../login.html

        // We'll use absolute path from root or relative based on location
        // Safest is to check current path depth or just use absolute if served from root

        // If we are in /admin/ or /superadmin/, login is at ../login.html
        window.location.href = '../login.html';
        return null; // Stop execution
    }

    const admin = JSON.parse(adminStr);

    // 2. Check Role permissions
    if (requiredRole) {
        if (requiredRole === 'SUPER_ADMIN' && admin.type !== 'SUPER_ADMIN') {
            // Standard admin trying to access superadmin page -> redirect to their dashboard
            window.location.href = '../admin/dashboard.html';
            return null;
        }

        // Note: SUPER_ADMIN can generally access STANDARD_ADMIN pages, 
        // but the UI might be tailored for standard admins.
        // If we want to strictly segregate:
        if (requiredRole === 'STANDARD_ADMIN' && admin.type === 'SUPER_ADMIN') {
            // ALLOW ACCESS: SuperAdmin oversees everything.
            // Do NOT return here, proceed to update Sidebar
        }
    }

    // 3. Update Sidebar User Info (Common task across all pages)
    // This assumes the page has these elements
    updateSidebar(admin);

    // 4. Handle Logout (Common task)
    // REMOVED: Managed by ui.js setupLogout() explicitly in views to avoid duplicate listeners

    return admin;
}

function updateSidebar(admin) {
    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) sidebarName.textContent = `${admin.first_name} ${admin.last_name}`;

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar && admin.avatar_url) {
        sidebarAvatar.src = resolveAssetPath(admin.avatar_url);
    }

    // Adapt Sidebar for SuperAdmin if on an admin page
    if (admin.type === 'SUPER_ADMIN') {
        const sidebarBrand = document.querySelector('.sidebar-brand span');
        if (sidebarBrand && sidebarBrand.textContent === 'ADMINISTRATION') {
            sidebarBrand.textContent = 'SUPER ADMIN';
        }

        const navLinks = document.querySelector('.nav-links');
        const isActualitePage = window.location.pathname.includes('actualite');

        if (navLinks && (window.location.pathname.includes('/admin/'))) {
            navLinks.innerHTML = `
                <a href="../superadmin/dashboard.html" class="nav-item">
                    <i class="fas fa-th-large"></i> <span>Tableau de bord</span>
                </a>
                <div style="padding: 12px 20px 6px; font-size: 0.7rem; text-transform: uppercase; color: #6B7280; letter-spacing: 1px;">Gestion Globale</div>
                <a href="../superadmin/administrators.html" class="nav-item">
                    <i class="fas fa-user-shield"></i> <span>Administrateurs</span>
                </a>
                <a href="../superadmin/instructors.html" class="nav-item">
                    <i class="fas fa-chalkboard-teacher"></i> <span>Instructeurs</span>
                </a>
                <a href="../superadmin/categories.html" class="nav-item">
                    <i class="fas fa-folder-open"></i> <span>Catégories</span>
                </a>
                <a href="../superadmin/courses.html" class="nav-item">
                    <i class="fas fa-book-open"></i> <span>Tous les Cours</span>
                </a>
                <a href="actualites.html" class="nav-item ${isActualitePage ? 'active' : ''}">
                    <i class="fas fa-newspaper"></i> <span>Actualités</span>
                </a>
                <div style="padding: 16px 20px 6px; font-size: 0.7rem; text-transform: uppercase; color: #6B7280; letter-spacing: 1px;">Mon Espace</div>
                <a href="../superadmin/my-courses.html" class="nav-item">
                    <i class="fas fa-graduation-cap"></i> <span>Mes Cours</span>
                </a>
                <a href="../superadmin/students.html" class="nav-item">
                    <i class="fas fa-users"></i> <span>Étudiants</span>
                </a>
                <a href="../superadmin/statistics.html" class="nav-item">
                    <i class="fas fa-chart-pie"></i> <span>Statistiques</span>
                </a>
                <a href="../superadmin/settings.html" class="nav-item">
                    <i class="fas fa-cog"></i> <span>Paramètres</span>
                </a>
            `;
        }
    }

    // Welcome message often found in dashboards
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) welcomeName.textContent = admin.first_name;
}
