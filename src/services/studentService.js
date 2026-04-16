import apiRequest from './api.js';

const StudentService = {
    register: (studentData) => apiRequest('students', 'POST', studentData),

    login: (credentials) => apiRequest('students/login', 'POST', credentials),

    getAll: () => apiRequest('students'),

    getById: (id) => apiRequest(`students/${id}`),

    update: (id, studentData) => apiRequest(`students/${id}`, 'PUT', studentData),

    delete: (id) => apiRequest(`students/${id}`, 'DELETE'),

    // SSO Moodle route
    getMoodleSSOUrl: (moodleKeys) => apiRequest('sso/moodle', 'POST', moodleKeys)
};

export default StudentService;
