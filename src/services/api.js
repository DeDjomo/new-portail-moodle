const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:9080'
    : 'https://portal.enspy.training/backend/public';

const apiRequest = async (endpoint, method = 'GET', data = null, isMultipart = false, onProgress = null) => {
    const url = `${BASE_URL}/${endpoint}`;
    console.log(`[DEBUG] API Request: ${method} ${url}`, {
        window_location: window.location.href,
        base_url: BASE_URL,
        is_localhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    });

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);

        // Progress Handler
        if (onProgress && xhr.upload) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress({
                        percent: Math.round(percentComplete),
                        loaded: e.loaded,
                        total: e.total,
                        loadedMB: (e.loaded / (1024 * 1024)).toFixed(2),
                        totalMB: (e.total / (1024 * 1024)).toFixed(2)
                    });
                }
            };
        }

        xhr.onload = () => {
            console.log(`[DEBUG] API Response (${xhr.status}):`, xhr.responseText.substring(0, 200) + (xhr.responseText.length > 200 ? '...' : ''));
            try {
                const result = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(result);
                } else {
                    let errorMsg = result.message || xhr.statusText || `Error ${xhr.status}`;
                    if (result.error) {
                        errorMsg += " (Debug: " + result.error + ")";
                    }
                    console.error(`[DEBUG] API Error Status: ${xhr.status}`, result);
                    reject(new Error(errorMsg));
                }
            } catch (e) {
                console.error(`[DEBUG] Failed to parse response from ${url}:`, xhr.responseText);
                reject(new Error(`Failed to parse response: ${xhr.statusText} (${xhr.status})`));
            }
        };

        xhr.onerror = () => {
            console.error(`[DEBUG] Network Error or Server Unreachable: ${method} ${url}`);
            reject(new Error(`Network error or server unreachable. Please check if the API at ${BASE_URL} is accessible.`));
        };

        // Headers
        if (!isMultipart) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(data ? JSON.stringify(data) : null);
        } else {
            // FormData sets its own boundary
            xhr.send(data);
        }
    });
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
