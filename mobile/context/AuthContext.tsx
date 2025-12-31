import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';
import { router } from 'expo-router';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    serverUrl: string;
    accessToken: string;
    login: (serverUrl: string, email: string, pass: string) => Promise<void>;
    loginWithToken: (serverUrl: string, token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    serverUrl: '',
    accessToken: '',
    login: async () => { },
    loginWithToken: async () => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [serverUrl, setServerUrl] = useState('');
    const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('immich_access_token');
                const url = await AsyncStorage.getItem('immich_server_url');

                if (token && url) {
                    setServerUrl(url);
                    setAccessToken(token);
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.error('Error initializing auth', e);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (serverUrl: string, email: string, pass: string) => {
        // Normalize URL
        let baseUrl = serverUrl.replace(/\/$/, '');
        if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4);
        }

        // Temporarily set for API call
        await AsyncStorage.setItem('immich_server_url', baseUrl);
        setServerUrl(baseUrl);

        try {
            const { data } = await api.post('/auth/login', {
                email,
                password: pass,
            });

            if (data.accessToken) {
                await AsyncStorage.setItem('immich_access_token', data.accessToken);
                setAccessToken(data.accessToken);
                setIsAuthenticated(true);
                router.replace('/');
            }
        } catch (error) {
            // Clean up on failure
            await AsyncStorage.removeItem('immich_server_url');
            await AsyncStorage.removeItem('immich_access_token');
            setServerUrl('');
            throw error;
        }
    }, []);

    const loginWithToken = useCallback(async (serverUrl: string, token: string) => {
        // Normalize URL
        let baseUrl = serverUrl.replace(/\/$/, '');
        if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4);
        }

        await AsyncStorage.setItem('immich_server_url', baseUrl);
        await AsyncStorage.setItem('immich_access_token', token);
        setServerUrl(baseUrl);
        setAccessToken(token);
        setIsAuthenticated(true);
        router.replace('/');
    }, []);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem('immich_access_token');
        await AsyncStorage.removeItem('immich_server_url');
        setIsAuthenticated(false);
        setServerUrl('');
        setAccessToken('');
        router.replace('/login');
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, serverUrl, accessToken, login, loginWithToken, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
