import api from './axios';

export const createRazorpayOrder = (amount) => api.post('/payment/create-order', { amount });
export const verifyPayment = (data) => api.post('/payment/verify', data);
