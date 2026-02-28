import apiRequest from './api.js';

const ActualiteService = {
    /**
     * Get all news items
     */
    getAll: async () => {
        return await apiRequest('actualites');
    },

    /**
     * Get news items by admin
     */
    getByAdmin: async (adminId) => {
        return await apiRequest(`actualites?admin_id=${adminId}`);
    },

    /**
     * Get news details by ID (includes linked courses)
     */
    getById: async (id) => {
        return await apiRequest(`actualites/${id}`);
    },

    /**
     * Create news (admin)
     */
    create: async (data, onProgress = null) => {
        const isMultipart = data instanceof FormData;
        return await apiRequest('actualites', 'POST', data, isMultipart, onProgress);
    },

    /**
     * Delete news (admin)
     */
    delete: async (id) => {
        return await apiRequest(`actualites/${id}`, 'DELETE');
    },

    /**
     * Update news (admin)
     */
    update: async (id, data, onProgress = null) => {
        const isMultipart = data instanceof FormData;
        return await apiRequest(`actualites/${id}`, 'PUT', data, isMultipart, onProgress);
    }
};

export default ActualiteService;
