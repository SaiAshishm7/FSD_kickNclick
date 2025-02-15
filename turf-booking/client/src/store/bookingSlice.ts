import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/axios';

export interface Booking {
    _id: string;
    turfId: string;
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: string;
}

interface BookingState {
    bookings: Booking[];
    selectedBooking: Booking | null;
    loading: boolean;
    error: string | null;
}

const initialState: BookingState = {
    bookings: [],
    selectedBooking: null,
    loading: false,
    error: null
};

export const createBooking = createAsyncThunk(
    'booking/createBooking',
    async (bookingData: {
        turfId: string;
        date: string;
        startTime: string;
        endTime: string;
    }) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    }
);

export const fetchUserBookings = createAsyncThunk(
    'booking/fetchUserBookings',
    async () => {
        const response = await api.get('/bookings/user');
        return response.data;
    }
);

export const cancelBooking = createAsyncThunk(
    'booking/cancelBooking',
    async (bookingId: string) => {
        const response = await api.post(`/bookings/${bookingId}/cancel`);
        return response.data;
    }
);

const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        clearSelectedBooking: (state) => {
            state.selectedBooking = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createBooking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBooking.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedBooking = action.payload;
                state.bookings.unshift(action.payload);
            })
            .addCase(createBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create booking';
            })
            .addCase(fetchUserBookings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserBookings.fulfilled, (state, action) => {
                state.loading = false;
                state.bookings = action.payload;
            })
            .addCase(fetchUserBookings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch bookings';
            })
            .addCase(cancelBooking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(cancelBooking.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.bookings.findIndex(b => b._id === action.payload._id);
                if (index !== -1) {
                    state.bookings[index] = action.payload;
                }
                if (state.selectedBooking?._id === action.payload._id) {
                    state.selectedBooking = action.payload;
                }
            })
            .addCase(cancelBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to cancel booking';
            });
    }
});

export const { clearSelectedBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
