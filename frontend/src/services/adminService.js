import apiRequest from './api.js';

const AdminService = {
    /**
     * Authenticate an administrator
     * @param {string} email 
     * @param {string} password 
     */
    login: async (email, password) => {
        return await apiRequest('administrators/login', 'POST', { email, password });
    },

    /**
     * Update administrator profile
     * @param {number} id 
     * @param {FormData|Object} data 
     */
    update: async (id, data) => {
        // Use POST for all updates to support file uploads (PHP limitation with PUT/$_FILES)
        // Since apiRequest detects FormData and removes Content-Type header (allowing browser to set boundary),
        // we just need to ensure method is POST.
        return await apiRequest(`administrators/${id}`, 'POST', data, data instanceof FormData);
    }
};

export default AdminService;
