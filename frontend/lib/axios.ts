import axios from 'axios';
import { getSession } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get session and add token if exists
    if (config.headers) {
      const session = await getSession();
      if (session?.user?.token) {
        config.headers.Authorization = `Bearer ${session.user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Check if the error is from a GitHub API endpoint
      const isGitHubError = error.config?.url?.includes('/github/');
      
      if (isGitHubError) {
        // For GitHub-related unauthorized errors
        throw new Error('GITHUB_UNAUTHORIZED');
      } else {
        // For regular unauthorized errors
        throw new Error('UNAUTHORIZED');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 