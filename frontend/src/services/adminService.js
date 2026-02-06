import apiRequest from './api.js';

const AdminService = {
    login: (credentials) => apiRequest('admins/login', 'POST', credentials),

    create: (adminData) => {
        // Use multipart if avatar is present
        const isMultipart = adminData instanceof FormData;
        return apiRequest('admins', 'POST', adminData, isMultipart);
    },

    getAll: () => apiRequest('admins'),

    getById: (id) => apiRequest(`admins/${id}`),

    update: (id, adminData) => {
        const isMultipart = adminData instanceof FormData;
        return apiRequest(`admins/${id}`, 'PUT', adminData, isMultipart);
    },

    delete: (id) => apiRequest(`admins/${id}`, 'DELETE')
};

export default AdminService;
