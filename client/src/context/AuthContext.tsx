"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (serverUrl: string, email: string, pass: string) => Promise<void>;
    logout: () => void;
    user: { name: string; email: string } | null;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: () => { },
    user: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            let token = localStorage.getItem('immich_access_token');
            let url = localStorage.getItem('immich_server_url');

            // FORCE OVERRIDE: If env var is present, use it. This prevents stale localStorage values (like incorrect IPs) from breaking the app.
            if (process.env.NEXT_PUBLIC_IMMICH_SERVER_URL) {
                const envUrl = process.env.NEXT_PUBLIC_IMMICH_SERVER_URL;
                let baseUrl = envUrl.replace(/\/$/, '');
                if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);

                if (url !== baseUrl) {
                    console.log(`Updating Server URL from Env: ${baseUrl}`);
                    url = baseUrl;
                    localStorage.setItem('immich_server_url', baseUrl);
                    document.cookie = `immich_server_url=${baseUrl}; path=/; max-age=31536000; SameSite=Lax`;
                }
            }

            // 1. Check Public Env Vars (Auto-Login override)
            if (!token && process.env.NEXT_PUBLIC_IMMICH_ACCESS_TOKEN) {
                token = process.env.NEXT_PUBLIC_IMMICH_ACCESS_TOKEN;
                url = process.env.NEXT_PUBLIC_IMMICH_SERVER_URL || '';

                // Sync to storage so API client can use it
                localStorage.setItem('immich_access_token', token);
                document.cookie = `immich_access_token=${token}; path=/; max-age=31536000; SameSite=Lax`;

                if (url) {
                    let baseUrl = url.replace(/\/$/, '');
                    if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);
                    localStorage.setItem('immich_server_url', baseUrl);
                    document.cookie = `immich_server_url=${baseUrl}; path=/; max-age=31536000; SameSite=Lax`;
                    url = baseUrl;
                }
            }

            // 2. Fallback: Check Server-Side Env Vars (Email/Pass) via API
            if (!token && !url) {
                try {
                    const res = await fetch('/api/auth/check-env');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.accessToken && data.serverUrl) {
                            token = data.accessToken;
                            url = data.serverUrl; // Already normalized by our API route logic if we wanted, but let's normalize here too

                            let baseUrl = url!.replace(/\/$/, '');
                            if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);

                            localStorage.setItem('immich_access_token', token!);
                            localStorage.setItem('immich_server_url', baseUrl);
                            document.cookie = `immich_access_token=${token}; path=/; max-age=31536000; SameSite=Lax`;
                            document.cookie = `immich_server_url=${baseUrl}; path=/; max-age=31536000; SameSite=Lax`;

                            url = baseUrl;
                        }
                    }
                } catch (e) {
                    console.log('Auto-login check failed', e);
                }
            }

            if (token && url) {
                setIsAuthenticated(true);
                // Fetch User Profile
                fetchUser();
            } else {
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/users/me');
            setUser({ name: data.name, email: data.email });
        } catch (e) {
            console.error('Failed to fetch user', e);
        }
    };

    const login = async (serverUrl: string, email: string, pass: string) => {
        // 1. Store URL temporarily or set it in API interceptor context (which allows dynamic config)
        // For now, we set it in localStorage so the interceptor picks it up immediately.
        // However, the interceptor reads from localStorage inside 'request', so we must set it before calling.

        // Normalize URL
        let baseUrl = serverUrl.replace(/\/$/, '');
        if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4);
        }

        localStorage.setItem('immich_server_url', baseUrl);
        document.cookie = `immich_server_url=${baseUrl}; path=/; max-age=31536000; SameSite=Lax`;

        try {
            const { data } = await api.post('/auth/login', {
                email,
                password: pass,
            });

            if (data.accessToken) {
                localStorage.setItem('immich_access_token', data.accessToken);
                document.cookie = `immich_access_token=${data.accessToken}; path=/; max-age=31536000; SameSite=Lax`;
                setIsAuthenticated(true);
                fetchUser();
                router.push('/');
            }
        } catch (error) {
            console.error('Login failed', error);
            // Clean up if failed
            localStorage.removeItem('immich_server_url');
            localStorage.removeItem('immich_access_token');
            document.cookie = `immich_server_url=; path=/; max-age=0`;
            document.cookie = `immich_access_token=; path=/; max-age=0`;
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('immich_access_token');
        localStorage.removeItem('immich_server_url');
        document.cookie = `immich_server_url=; path=/; max-age=0`;
        document.cookie = `immich_access_token=; path=/; max-age=0`;
        setIsAuthenticated(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
};
