import apiRequest from './api.js';

const CourseService = {
    create: (courseData) => {
        const isMultipart = courseData instanceof FormData;
        return apiRequest('courses', 'POST', courseData, isMultipart);
    },

    getAll: () => apiRequest('courses'),

    getByAdmin: (adminId) => apiRequest(`courses?action=getAdminCourses&admin_id=${adminId}`),

    getById: (id) => apiRequest(`courses/${id}`),

    update: (id, courseData) => {
        const isMultipart = courseData instanceof FormData;
        return apiRequest(`courses/${id}`, 'PUT', courseData, isMultipart);
    },

    delete: (id) => apiRequest(`courses/${id}`, 'DELETE')
};

export default CourseService;
