// src/services/api.ts

import axios, { AxiosError } from 'axios';
import { User } from '@auth0/auth0-react';


// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor function
// This will be called from AuthProvider when the user is authenticated
export const setupAuthInterceptor = (
  getToken: () => Promise<string | undefined>,
  getUserInfo?: () => User | undefined
) => {
  // Add a request interceptor
  api.interceptors.request.use(async (config) => {
    // Get the token asynchronously
    const token = await getToken();
    
    // If we have a token, add it to the Authorization header
    if (token) {
      //console.log('Adding token to request');
      config.headers.Authorization = `Bearer ${token}`;

      // If we have user info, add the email as a custom header
      const userInfo = getUserInfo?.();
      if (userInfo?.email) {
        //console.log('Adding user email to request headers');
        config.headers['X-User-Email'] = userInfo.email;
      }
    }
    
    return config;
  });
};

// Enhanced error handling for API responses
api.interceptors.response.use(
  // For successful responses, just return the response
  (response) => response,
  
  // For errors, handle them appropriately
  (error: AxiosError) => {
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - token is invalid or expired
        console.warn('Authentication required - your session may have expired');
        // You could trigger a refresh token flow here or redirect to login
      } else if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        console.warn('You do not have permission to perform this action');
      } else if (error.response.status === 404) {
        // Not found
        console.warn('The requested resource was not found');
      } else if (error.response.status >= 500) {
        // Server error
        console.error('A server error occurred. Please try again later.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      // This is typically a network error
      console.error('Network Error: No response received from server', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Error:', error.message);
    }
    
    // Continue propagating the error so components can handle it
    return Promise.reject(error);
  }
);

export default api;