import apiRequest from './api.js';

const EnrollmentService = {
    /**
     * Enroll a student in a course by email
     * @param {string} email 
     * @param {number} courseId 
     */
    enroll: async (email, courseId) => {
        return await apiRequest('enrollments', 'POST', { email, course_id: courseId });
    }
};

export default EnrollmentService;
