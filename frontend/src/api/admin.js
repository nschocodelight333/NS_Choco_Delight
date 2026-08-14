import api from './axios';

export const getDashboardStats = () => api.get('/admin/dashboard');
export const getDashboardAnalytics = () => api.get('/admin/dashboard/stats');
export const getCustomers = () => api.get('/admin/customers');
