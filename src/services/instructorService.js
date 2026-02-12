import apiRequest from './api.js';

const InstructorService = {
    create: (instructorData) => {
        const isMultipart = instructorData instanceof FormData;
        return apiRequest('instructors', 'POST', instructorData, isMultipart);
    },

    getAll: () => apiRequest('instructors'),

    getById: (id) => apiRequest(`instructors/${id}`),

    update: (id, instructorData) => {
        const isMultipart = instructorData instanceof FormData;
        return apiRequest(`instructors/${id}`, 'PUT', instructorData, isMultipart);
    },

    delete: (id) => apiRequest(`instructors/${id}`, 'DELETE')
};

export default InstructorService;
