
import CategoryService from '../../services/categoryService.js';
import InstructorService from '../../services/instructorService.js';
import { showToast, setupLogout } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';

document.addEventListener('DOMContentLoaded', async () => {
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    setupLogout();
});

/**
 * Handles Quick Create Modals for Categories and Instructors
 * @param {Function} onCategoryCreated - Callback when category is created (returns new category)
 * @param {Function} onInstructorCreated - Callback when instructor is created (returns new instructor)
 */
export function setupQuickActions(onCategoryCreated, onInstructorCreated) {

    // --- Elements ---
    const categoryModal = document.getElementById('modalQuickCategory');
    const instructorModal = document.getElementById('modalQuickInstructor');

    const btnOpenCategory = document.getElementById('btnQuickAddCategory');
    const btnOpenInstructor = document.getElementById('btnQuickAddInstructor');

    const formCategory = document.getElementById('formQuickCategory');
    const formInstructor = document.getElementById('formQuickInstructor');

    // --- Open/Close Logic ---
    function openModal(modal) {
        if (modal) modal.style.display = 'block';
    }

    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
        // Reset forms
        if (modal === categoryModal) formCategory.reset();
        if (modal === instructorModal) formInstructor.reset();
    }

    // Connect Buttons
    if (btnOpenCategory) {
        btnOpenCategory.addEventListener('click', () => openModal(categoryModal));
    }

    if (btnOpenInstructor) {
        btnOpenInstructor.addEventListener('click', () => openModal(instructorModal));
    }

    // Connect Close Buttons (x) and overlay click
    document.querySelectorAll('.close-modal, .btn-cancel-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal'));
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === categoryModal) closeModal(categoryModal);
        if (e.target === instructorModal) closeModal(instructorModal);
    });

    // --- Submit Handlers ---

    // 1. Category Submit
    if (formCategory) {
        formCategory.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formCategory.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const payload = {
                name: document.getElementById('quickCatName').value,
                description: document.getElementById('quickCatDesc').value
            };

            try {
                // Determine if CategoryService.create returns response object or data directly
                // Based on previous files, it seems to return object with status/id
                const res = await CategoryService.create(payload);

                // Fetch the full object effectively or construct it
                // Ideally backend returns the created object. Constructor returned {id, slug, message}
                // We need the name to display it.
                const newCategory = {
                    id: res.id,
                    name: payload.name,
                    slug: res.slug
                };

                showToast('Catégorie ajoutée !', 'success');
                closeModal(categoryModal);

                if (onCategoryCreated) onCategoryCreated(newCategory);

            } catch (error) {
                console.error(error);
                showToast('Erreur lors de la création', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // 2. Instructor Submit
    if (formInstructor) {
        formInstructor.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formInstructor.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const formData = new FormData(formInstructor);

            // Instructor service expects FormData for create
            // Backend validation: full_name, professional_title, organization required.

            try {
                const res = await InstructorService.create(formData);
                console.log('Instructor Created:', res);

                // Backend returns {message, id}
                // Construct basic object for UI
                const newInstructor = {
                    id: res.id,
                    full_name: formData.get('full_name') // Use getter to retrieve value
                };

                showToast('Instructeur ajouté !', 'success');
                closeModal(instructorModal);

                if (onInstructorCreated) onInstructorCreated(newInstructor);

            } catch (error) {
                console.error(error);
                showToast(error.message || 'Erreur lors de la création', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
}
