import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send HttpOnly cookies with every request
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/auth/login') {
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    },
);

// ─── Auth API ────────────────────────────────────
export const authApi = {
    register: (data: { email: string; name: string; password: string }) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    requestMagicLink: (data: { email: string }) =>
        api.post('/auth/magic-link', data),
    verifyMagicLink: (token: string) =>
        api.get(`/auth/verify?token=${token}`),
    getProfile: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};

// ─── KYC API ─────────────────────────────────────
export const kycApi = {
    createSender: (orgId: string, data: Record<string, any>) =>
        api.post(`/kyc/${orgId}/sender`, data),
    getStatus: (orgId: string) =>
        api.get(`/kyc/${orgId}/status`),
    uploadDocument: (orgId: string, data: Record<string, any>) =>
        api.post(`/kyc/${orgId}/documents`, data),
    submitForVerification: (orgId: string) =>
        api.post(`/kyc/${orgId}/verify`),
};

// ─── Organization API ────────────────────────────
export const orgApi = {
    create: (data: Record<string, any>) =>
        api.post('/organizations', data),
    list: () => api.get('/organizations'),
    get: (id: string) => api.get(`/organizations/${id}`),
    update: (id: string, data: Record<string, any>) =>
        api.patch(`/organizations/${id}`, data),
};

// ─── Beneficiary API ─────────────────────────────
export const beneficiaryApi = {
    create: (data: Record<string, any>) =>
        api.post('/beneficiaries', data),
    list: () => api.get('/beneficiaries'),
    get: (id: string) => api.get(`/beneficiaries/${id}`),
    update: (id: string, data: Record<string, any>) =>
        api.patch(`/beneficiaries/${id}`, data),
    delete: (id: string) => api.delete(`/beneficiaries/${id}`),
};

// ─── Payout API ──────────────────────────────────
export const payoutApi = {
    createQuote: (data: Record<string, any>) =>
        api.post('/payouts/quote', data),
    createOrder: (data: Record<string, any>) =>
        api.post('/payouts/order', data),
    list: () => api.get('/payouts'),
    getOrder: (id: string) => api.get(`/payouts/${id}`),
    cancelOrder: (id: string) => api.post(`/payouts/${id}/cancel`),
};

// ─── Transaction API ─────────────────────────────
export const transactionApi = {
    list: (params?: Record<string, any>) =>
        api.get('/transactions', { params }),
    get: (id: string) => api.get(`/transactions/${id}`),
    exportCsv: (params?: Record<string, any>) =>
        api.get('/reconciliation/export', { params, responseType: 'blob' }),
};

export default api;
