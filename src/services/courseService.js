import apiRequest from './api.js';

const CourseService = {
    create: (courseData) => {
        const isMultipart = courseData instanceof FormData;
        return apiRequest('courses', 'POST', courseData, isMultipart);
    },

    getAll: (status = null) => {
        const url = status ? `courses?status=${status}` : 'courses';
        return apiRequest(url);
    },

    getByAdmin: (adminId) => {
        if (!adminId) return CourseService.getAll();
        return apiRequest(`courses?action=getAdminCourses&admin_id=${adminId}`);
    },

    getById: (id) => apiRequest(`courses/${id}`),

    create: async (courseData, onProgress = null) => {
        return await apiRequest('courses', 'POST', courseData, true, onProgress);
    },

    update: async (id, courseData, onProgress = null) => {
        return await apiRequest(`courses/${id}`, 'POST', courseData, true, onProgress); // Using POST with _method emulation or just POST if backend handles it
    },

    delete: (id) => apiRequest(`courses/${id}`, 'DELETE')
};

export default CourseService;
