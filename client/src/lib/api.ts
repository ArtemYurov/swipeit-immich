import axios from 'axios';

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('immich_access_token') || process.env.NEXT_PUBLIC_IMMICH_ACCESS_TOKEN;
        const serverUrl = localStorage.getItem('immich_server_url') || process.env.NEXT_PUBLIC_IMMICH_SERVER_URL;

        // Only set URL if we have one, otherwise let it fail or use relative if user is proxying (unlikely here)
        if (serverUrl) {
            // Normalize URL: remove /api suffix if present, remove trailing slash
            let baseUrl = serverUrl.replace(/\/$/, '');
            if (baseUrl.endsWith('/api')) {
                baseUrl = baseUrl.slice(0, -4);
            }
            // Use local proxy
            config.baseURL = `/api/proxy`;
            // Pass actual server URL as header
            config.headers['x-immich-url'] = `${baseUrl}/api`;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 handling can be done here or in the context
        return Promise.reject(error);
    }
);

export default api;
