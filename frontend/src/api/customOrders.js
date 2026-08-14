import api from './axios';

// Customer routes
export const submitCustomOrder = (formData) =>
  api.post('/custom-orders', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyCustomOrders = () => api.get('/custom-orders/my');
export const respondToQuote = (id, action) =>
  api.post(`/custom-orders/${id}/respond`, { action });
export const checkoutCustomOrder = (id, data) =>
  api.post(`/custom-orders/${id}/checkout`, data);

// Admin routes
export const getAllCustomOrders = (status) =>
  api.get('/admin/custom-orders', { params: status ? { status } : {} });
export const setQuote = (id, data) => api.put(`/admin/custom-orders/${id}/quote`, data);
export const updateCustomOrderStatus = (id, status) =>
  api.put(`/admin/custom-orders/${id}/status`, { status });
