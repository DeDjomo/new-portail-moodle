/**
 * Student Authentication Utilities
 * Manages student session via localStorage.
 */

const STUDENT_KEY = 'student';
const MOODLE_KEYS = 'moodle_keys';

/**
 * Store student info after login
 * @param {Object} student
 */
export function setStudent(student) {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
}

/**
 * Get the currently logged-in student, or null
 * @returns {Object|null}
 */
export function getStudent() {
    const raw = localStorage.getItem(STUDENT_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Store Moodle Keys
 */
export function setMoodleKeys(keys) {
    if (keys) {
        localStorage.setItem(MOODLE_KEYS, JSON.stringify(keys));
    } else {
        localStorage.removeItem(MOODLE_KEYS);
    }
}

/**
 * Get Moodle Keys
 */
export function getMoodleKeys() {
    const raw = localStorage.getItem(MOODLE_KEYS);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Check if a student is logged in
 * @returns {boolean}
 */
export function isStudentLoggedIn() {
    return getStudent() !== null;
}

/**
 * Logout the student
 */
export function logoutStudent() {
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem(MOODLE_KEYS);
    // Keep student_email for enrollment checks (legacy)
}

/**
 * Require student auth — redirect to student-login.html if not logged in.
 * Returns the student object if authenticated.
 * @param {string} [redirectTo] - page to redirect to after login (relative)
 * @returns {Object|null}
 */
export function requireStudentAuth(redirectTo = '') {
    const student = getStudent();
    if (!student) {
        const dest = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : '';
        window.location.href = `student-login.html${dest}`;
        return null;
    }
    return student;
}

/**
 * Inject student info into the navbar (call on any public page).
 * Looks for elements with id="navStudentArea".
 */
export function injectNavbarStudentArea() {
    const area = document.getElementById('navStudentArea');
    if (!area) return;

    const student = getStudent();
    if (student) {
        area.innerHTML = `
            <div class="nav-student-info">
                <span class="nav-student-name">
                    <i class="fas fa-user-circle"></i>
                    ${student.first_name} ${student.last_name}
                </span>
                <button class="nav-btn-logout" id="btnStudentLogout">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </button>
            </div>
        `;
        document.getElementById('btnStudentLogout')?.addEventListener('click', () => {
            logoutStudent();
            window.location.reload();
        });
    } else {
        area.innerHTML = `
            <a href="student-login.html" class="btn-student-login">
                <i class="fas fa-user"></i> Espace Étudiant
            </a>
        `;
    }
}
