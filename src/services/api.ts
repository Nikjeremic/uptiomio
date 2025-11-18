import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://payments.uptimio.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401/403
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 or 403 and we haven't tried to refresh yet
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token - logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/refresh-token`, { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data;

        // Save new tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update authorization header
        api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        originalRequest.headers['Authorization'] = 'Bearer ' + token;

        processQueue(null, token);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  register: (name: string, email: string, password: string, role?: string) =>
    api.post('/register', { name, email, password, role }),
  logout: () => api.post('/logout'),
  refreshToken: (refreshToken: string) => 
    api.post('/refresh-token', { refreshToken }),
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
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string, customPassword?: string) => 
    api.post(`/users/${id}/reset-password`, { customPassword })
};

export default api;
