import apiRequest from './api.js';

const AdminService = {
    /**
     * Authenticate an administrator
     * @param {string} email 
     * @param {string} password 
     */
    login: async (email, password) => {
        return await apiRequest('administrators/login', 'POST', { email, password });
    }
};

export default AdminService;
