import apiRequest from './api.js';

const CategoryService = {
    create: (categoryData) => apiRequest('categories', 'POST', categoryData),

    getAll: () => apiRequest('categories'),

    getById: (id) => apiRequest(`categories/${id}`),

    update: (id, categoryData) => apiRequest(`categories/${id}`, 'PUT', categoryData),

    delete: (id) => apiRequest(`categories/${id}`, 'DELETE')
};

export default CategoryService;
