import axios from 'axios';

export const BASE_URL = 'http://180.235.121.245:8026';

const api = axios.create({
    baseURL: BASE_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper functions for various API endpoints
export const authApi = {
    login: (data: any) => api.post('/login', data),
    register: (data: any) => api.post('/register', data),
    bpaRegister: (data: any) => api.post('/bpa-register', data),
    verifyOtp: (data: any) => api.post('/verify-otp', data),
    resendOtp: (identifier: string) => api.post('/resend-otp', { email: identifier }),
    forgotPassword: (data: any) => api.post('/forgot-password', data),
    bpaForgotPassword: (data: any) => api.post('/bpa-forgot-password', data),
    resetPassword: (data: any) => api.post('/reset-password', data),
};

export const farmerApi = {
    predictAnimal: (formData: FormData) => api.post('/predict-animal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getDetections: () => api.get('/detections/me'),
    getAnalytics: (timeFilter: string) => api.get(`/analytics?time_filter=${timeFilter}`),
    getRecentActivity: () => api.get('/activity/recent'),
    getProfile: () => api.get('/me'),
    updateProfile: (data: any) => api.put('/me', data),
    uploadProfilePhoto: (formData: FormData) => api.post('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getNotifications: () => api.get('/notifications'),
    markNotificationRead: (id: number) => api.put(`/notifications/${id}/read`),
    getVaccinations: () => api.get('/vaccinations'),
    addVaccination: (data: any) => api.post('/vaccinations', data),
    completeVaccination: (id: number) => api.put(`/vaccinations/${id}/complete`),
    deleteVaccination: (id: number) => api.delete(`/vaccinations/${id}`),
    getAlerts: () => api.get('/alerts'),
    getSeasonalReminders: () => api.get('/seasonal-reminders'),
    getTimetable: () => api.get('/timetable'),
    generateTimetable: () => api.post('/timetable/generate'),
    completeTask: (id: number) => api.put(`/timetable/${id}/complete`),
    recordMilkYield: (data: any) => api.post('/milk-yields', data),
    getMilkYields: () => api.get('/milk-yields'),
    registerAnimal: (data: any) => api.post('/register-animal', data),
    getAnimals: () => api.get('/animals'),
    deleteAccount: () => api.delete('/account'),
};

export const bpaApi = {
    getStats: () => api.get('/bpa-stats'),
    getAnimals: () => api.get('/animals'),
    registerAnimal: (data: any) => api.post('/register-animal', data),
    getDistrictFarmers: () => api.get('/farmers'),
    getAllDetections: () => api.get('/detections'),
    getReportsExport: () => api.get('/reports/export', { responseType: 'blob' }),
};

export default api;

