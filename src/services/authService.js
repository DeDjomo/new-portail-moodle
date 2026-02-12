import apiRequest from './api.js';

const AuthService = {
    /**
     * Register a new student
     * @param {Object} studentData { last_name, first_name, email, password, phone? }
     */
    register: async (studentData) => {
        return await apiRequest('students', 'POST', studentData);
    }
};

export default AuthService;
