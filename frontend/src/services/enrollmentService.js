import apiRequest from './api.js';

const EnrollmentService = {
    /**
     * Enroll a student in a course by email
     * @param {string} email 
     * @param {number} courseId 
     */
    enroll: async (email, courseId) => {
        return await apiRequest('enrollments', 'POST', { email, course_id: courseId });
    },

    /**
     * Get all students for an admin
     * @param {number} adminId 
     */
    getByAdmin: async (adminId) => {
        return await apiRequest(`enrollments?action=getAdminEnrollments&admin_id=${adminId}`, 'GET');
    },

    /**
     * Mark all pending enrollments as DONE for a course
     * @param {number} courseId 
     */
    markAsDone: async (courseId) => {
        return await apiRequest(`enrollments/mark-done/${courseId}`, 'PUT');
    }
};

export default EnrollmentService;
