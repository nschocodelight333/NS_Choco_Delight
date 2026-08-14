import api from './axios';

// Admin
export const getCampaigns = () => api.get('/admin/campaigns');
export const createCampaign = (formData) =>
  api.post('/admin/campaigns', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateCampaign = (id, formData) =>
  api.put(`/admin/campaigns/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteCampaign = (id) => api.delete(`/admin/campaigns/${id}`);

// Public
export const getActiveCampaigns = () => api.get('/campaigns/active');
export const getCampaign = (id) => api.get(`/campaigns/${id}`);
