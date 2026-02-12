import { create } from 'zustand';
import { authApi } from '../services/api';

interface User {
    id: string;
    email: string;
    name: string;
    organizations?: any[];
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, name: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    login: async (email, password) => {
        // Backend sets HttpOnly cookie — no token in JS at all
        const { data } = await authApi.login({ email, password });
        set({
            user: data.user,
            isAuthenticated: true,
        });
    },

    register: async (email, name, password) => {
        const { data } = await authApi.register({ email, name, password });
        set({
            user: data.user,
            isAuthenticated: true,
        });
    },

    logout: async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore — clear state regardless
        }
        set({
            user: null,
            isAuthenticated: false,
        });
    },

    checkAuth: async () => {
        try {
            // Cookie is sent automatically with credentials: 'include'
            const { data } = await authApi.getProfile();
            set({
                user: data,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },
}));
