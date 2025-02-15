import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/axios';

export interface Slot {
    startTime: string;
    endTime: string;
    isBooked: boolean;
    isPeakHour: boolean;
}

export interface Turf {
    _id: string;
    name: string;
    type: 'football' | 'cricket' | 'basketball';
    location: {
        address: string;
        city: string;
        state: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    facilities: string[];
    images: string[];
    basePrice: number;
    availableSlots: Slot[];
    ratings: {
        user: string;
        rating: number;
        review: string;
        date: string;
    }[];
    averageRating: number;
}

interface TurfState {
    turfs: Turf[];
    selectedTurf: Turf | null;
    availableSlots: Slot[];
    loading: boolean;
    error: string | null;
}

const initialState: TurfState = {
    turfs: [],
    selectedTurf: null,
    availableSlots: [],
    loading: false,
    error: null
};

export const fetchTurfs = createAsyncThunk(
    'turf/fetchTurfs',
    async (type?: string) => {
        const response = await api.get(`/turfs${type ? `?type=${type}` : ''}`);
        return response.data;
    }
);

export const fetchTurfById = createAsyncThunk(
    'turf/fetchTurfById',
    async (id: string) => {
        const response = await api.get(`/turfs/${id}`);
        return response.data;
    }
);

export const fetchAvailableSlots = createAsyncThunk(
    'turf/fetchAvailableSlots',
    async ({ turfId, date }: { turfId: string; date: string }) => {
        const response = await api.get(`/turfs/${turfId}/slots/${date}`);
        return response.data;
    }
);

export const addRating = createAsyncThunk(
    'turf/addRating',
    async ({ turfId, rating, review }: { turfId: string; rating: number; review: string }, { getState }: any) => {
        const { token } = getState().auth;
        const response = await api.post(
            `/turfs/${turfId}/ratings`,
            { rating, review },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    }
);

const turfSlice = createSlice({
    name: 'turf',
    initialState,
    reducers: {
        clearSelectedTurf: (state) => {
            state.selectedTurf = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTurfs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTurfs.fulfilled, (state, action) => {
                state.loading = false;
                state.turfs = action.payload;
            })
            .addCase(fetchTurfs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch turfs';
            })
            .addCase(fetchTurfById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTurfById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedTurf = action.payload;
            })
            .addCase(fetchTurfById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch turf';
            })
            .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
                state.availableSlots = action.payload;
            })
            .addCase(addRating.fulfilled, (state, action) => {
                state.selectedTurf = action.payload;
            });
    }
});

export const { clearSelectedTurf, clearError } = turfSlice.actions;
export default turfSlice.reducer;
