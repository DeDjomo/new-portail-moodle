import apiRequest from './api.js';

const EnrollmentService = {
    /**
     * Enroll a student in a course
     */
    enroll: (studentId, courseId) => apiRequest('enrollments', 'POST', { student_id: studentId, course_id: courseId }),

    /**
     * Get enrollments for a specific course
     * @param {string|number} courseId 
     * @param {string} [status] Optional filter: PENDING, DONE
     */
    getByCourse: (courseId, status = null) => {
        let endpoint = `enrollments/course/${courseId}`;
        if (status) endpoint += `?status=${status}`;
        return apiRequest(endpoint);
    },

    /**
     * Mark all pending enrollments of a course as DONE
     */
    markDone: (courseId) => apiRequest(`enrollments/mark-done/${courseId}`, 'PUT')
};

export default EnrollmentService;
