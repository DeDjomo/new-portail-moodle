/**
 * Base API Service for handles all fetch requests to the backend.
 */

const BASE_URL = 'http://portal.enspy.training/backend/public';

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
            let errorMsg = result.message || response.statusText;
            if (result.error) {
                errorMsg += " (Debug: " + result.error + ")";
            }
            throw new Error(errorMsg);
        }

        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

const resolveAssetPath = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/+/, '');
    const fullUrl = `${BASE_URL}/${cleanPath}`;
    console.log('[DEBUG] Asset Path:', { input: path, output: fullUrl });
    return fullUrl;
};

export { BASE_URL, resolveAssetPath };
export default apiRequest;
