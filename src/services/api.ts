import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://payments.uptimio.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  register: (name: string, email: string, password: string, role?: string) =>
    api.post('/register', { name, email, password, role }),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data: any) => api.put('/profile', data),
  getByUserId: (userId: string) => api.get(`/users/${userId}/profile`),
  updateByUserId: (userId: string, data: any) => api.put(`/users/${userId}/profile`, data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/profile/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadSignature: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/profile/signature', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadLogoForUser: (userId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/users/${userId}/profile/logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
};

export const invoiceAPI = {
  getAllInvoices: (search?: string) => api.get('/invoices', { params: search ? { search } : undefined }),
  getMyInvoices: (search?: string) => api.get('/my-invoices', { params: search ? { search } : undefined }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  createInvoice: (invoiceData: any) => api.post('/invoices', invoiceData),
  markAsPaid: (id: string, paymentMethod: string) =>
    api.patch(`/invoices/${id}/pay`, { paymentMethod }),
  deleteById: (id: string) => api.delete(`/invoices/${id}`)
};

export const userAPI = {
  getAllUsers: () => api.get('/users'),
  createUser: (name: string, email: string, password: string, role: 'user' | 'admin', profile?: any) =>
    api.post('/users', { name, email, password, role, profile }),
  deleteUser: (id: string) => api.delete(`/users/${id}`)
};

export default api;
