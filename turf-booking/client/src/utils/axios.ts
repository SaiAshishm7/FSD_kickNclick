import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { store } from '../store/store';
import { logout } from '../store/authSlice';

const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Unauthorized - clear auth state and redirect to login
                    store.dispatch(logout());
                    window.location.href = '/login';
                    break;
                case 403:
                    // Forbidden - redirect to home
                    window.location.href = '/';
                    break;
                case 404:
                    console.error('Resource not found:', data);
                    break;
                case 400:
                    console.error('Bad request:', data);
                    break;
                case 500:
                    console.error('Server error:', data);
                    break;
                default:
                    console.error('Response error:', data);
            }

            return Promise.reject({
                status,
                message: data.error || 'An error occurred',
                details: data
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            return Promise.reject({
                status: 0,
                message: 'No response from server',
                details: error.request
            });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request setup error:', error.message);
            return Promise.reject({
                status: 0,
                message: 'Request failed',
                details: error.message
            });
        }
    }
);

export default instance;
