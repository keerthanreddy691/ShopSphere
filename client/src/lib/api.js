
import axios from 'axios';
import { queryClient } from './queryClient';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

// Read the token saved after login or registration.
function getAuthToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

// Attach the token to authenticated API requests.
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export class ApiRequestError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status || 0;
    const body = error.response?.data;

    const message =
      body?.message ||
      (status === 0
        ? 'Unable to reach the server. Check your connection.'
        : 'Something went wrong');

    // Clear cached user data if authentication expires.
    if (status === 401 && !error.config?.url?.includes('/auth/')) {
      queryClient.setQueryData(['me'], null);
    }

    return Promise.reject(
      new ApiRequestError(message, status, body?.errors || []),
    );
  },
);

// Convenience helpers.
export const get = (url, params) =>
  api.get(url, { params }).then((r) => r.data);

export const post = (url, body) => api.post(url, body);
export const patch = (url, body) => api.patch(url, body);
export const put = (url, body) => api.put(url, body);
export const del = (url) => api.delete(url);
