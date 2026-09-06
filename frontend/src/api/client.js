import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('assetflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const message = error.message || 'Unable to reach the server. Make sure the backend is running on port 5000.';
      return Promise.reject(new Error(message));
    }

    const message =
      error.response.data?.error ||
      error.response.data?.message ||
      `Request failed with status ${error.response.status}.`;

    return Promise.reject(new Error(message));
  }
);

export default client;