const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:9080'
    : 'https://portal.enspy.training/backend/public';

const apiRequest = async (endpoint, method = 'GET', data = null, isMultipart = false, onProgress = null) => {
    const url = `${BASE_URL}/${endpoint}`;

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
            try {
                const result = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(result);
                } else {
                    const errorMsg = result.message || xhr.statusText || `Error ${xhr.status}`;
                    reject(new Error(errorMsg));
                }
            } catch (e) {
                reject(new Error(`Failed to parse response: ${xhr.statusText} (${xhr.status})`));
            }
        };

        xhr.onerror = () => {
            reject(new Error(`Erreur réseau. Vérifiez votre connexion.`));
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
    return `${BASE_URL}/${cleanPath}`;
};

export { BASE_URL, resolveAssetPath };
export default apiRequest;
