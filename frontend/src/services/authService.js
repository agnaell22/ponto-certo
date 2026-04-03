import apiClient from './apiClient';

export const authService = {
    async register(data) {
        const res = await apiClient.post('/auth/register', data);
        return res.data;
    },

    async login(email, senha) {
        const res = await apiClient.post('/auth/login', { email, senha });
        const { accessToken, refreshToken, user } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        return user;
    },

    async logout() {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    },

    async getProfile() {
        const res = await apiClient.get('/auth/me');
        return res.data;
    },
};
