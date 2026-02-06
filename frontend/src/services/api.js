/**
 * Base API Service for handles all fetch requests to the backend.
 */

const BASE_URL = 'http://localhost:8000'; // Target the PHP local server

const apiRequest = async (endpoint, method = 'GET', data = null, isMultipart = false) => {
    const url = `${BASE_URL}/${endpoint}`;

    const options = {
        method,
        headers: {},
    };

    if (data) {
        if (isMultipart) {
            // FormData will automatically set the correct Content-Type with boundary
            options.body = data;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

export default apiRequest;
