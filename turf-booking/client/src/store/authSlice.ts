import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/axios';
import { AppDispatch, RootState } from './store';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

// Get stored auth data
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState: AuthState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    loading: false,
    error: null,
    isAuthenticated: !!storedToken
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; password: string }) => {
        const response = await api.post('/auth/login', credentials);
        // Store auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData: { name: string; email: string; password: string; phone: string }) => {
        const response = await api.post('/auth/register', userData);
        // Store auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
    }
);

let getProfileCallCount = 0;
export const getProfile = createAsyncThunk(
    'auth/getProfile',
    async (_, { getState }) => {
        getProfileCallCount++;
        console.log(`getProfile called ${getProfileCallCount} times`);
        const state = getState() as RootState;
        const { token } = state.auth;
        console.log('Fetching profile with token:', token);
        const response = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile fetched:', response.data);
        return response.data;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Login failed';
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Registration failed';
            })
            .addCase(getProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(getProfile.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            });
    }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
