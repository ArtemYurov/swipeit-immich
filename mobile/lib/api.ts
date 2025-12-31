import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth headers and base URL
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('immich_access_token');
        const serverUrl = await AsyncStorage.getItem('immich_server_url');

        if (serverUrl) {
            // Normalize URL
            let baseUrl = serverUrl.replace(/\/$/, '');
            if (!baseUrl.endsWith('/api')) {
                baseUrl = `${baseUrl}/api`;
            }
            config.baseURL = baseUrl;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.error('Error reading from AsyncStorage', e);
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

export default api;
