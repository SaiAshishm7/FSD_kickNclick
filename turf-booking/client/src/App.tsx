import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from './store/authSlice';
import { AppDispatch, RootState } from './store/store';

// Components
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TurfList from './components/turf/TurfList';
import TurfDetail from './components/turf/TurfDetail';
import BookingList from './components/booking/BookingList';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import UserManagement from './components/admin/UserManagement';
import Reports from './components/admin/Reports';
import TurfManagement from './components/admin/TurfManagement';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('Token found:', token);
        if (token && !isAuthenticated) {
            dispatch(getProfile());
        }
    }, [dispatch, isAuthenticated]);

    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <CssBaseline />
                <Router>
                    <Navbar />
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
                        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />

                        {/* Protected Routes */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <TurfList />
                            </ProtectedRoute>
                        } />
                        <Route path="/turf/:id" element={<TurfDetail />} />
                        <Route path="/turfs/:id" element={
                            <ProtectedRoute>
                                <TurfDetail />
                            </ProtectedRoute>
                        } />
                        <Route path="/bookings" element={
                            <ProtectedRoute>
                                <BookingList />
                            </ProtectedRoute>
                        } />

                        {/* Admin Routes */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requireAdmin>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="turfs" element={<TurfManagement />} />
                            <Route path="reports" element={<Reports />} />
                        </Route>

                        {/* Default Route */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Router>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
