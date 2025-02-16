export const API_BASE_URL = 'http://localhost:5001/api';

export const ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    
    // Turfs
    TURFS: '/turfs',
    TURF_DETAIL: (id: string) => `/turfs/${id}`,
    TURF_SLOTS: (id: string, date: string) => `/turfs/${id}/slots/${date}`,
    
    // Bookings
    BOOKINGS: '/bookings',
    USER_BOOKINGS: '/bookings/user',
    BOOKING_DETAIL: (id: string) => `/bookings/${id}`,
    CANCEL_BOOKING: (id: string) => `/bookings/${id}/cancel`,
    
    // Admin
    ADMIN_STATS: '/admin/stats',
    ADMIN_USERS: '/admin/users',
    ADMIN_BOOKINGS: '/admin/bookings'
};
