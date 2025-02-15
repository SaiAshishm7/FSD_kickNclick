import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { Turf, TimeSlot } from '../../types';

interface TurfState {
    turfs: Turf[];
    selectedTurf: Turf | null;
    availableSlots: TimeSlot[];
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
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/turfs');
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch turfs');
        }
    }
);

export const fetchTurfById = createAsyncThunk(
    'turf/fetchTurfById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/turfs/${id}`);
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch turf');
        }
    }
);

export const fetchAvailableSlots = createAsyncThunk(
    'turf/fetchAvailableSlots',
    async ({ turfId, date }: { turfId: string; date: string }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/turfs/${turfId}/slots?date=${date}`);
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch available slots');
        }
    }
);

export const addRating = createAsyncThunk(
    'turf/addRating',
    async (
        {
            turfId,
            rating,
            review
        }: {
            turfId: string;
            rating: number;
            review: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.post(`/turfs/${turfId}/ratings`, { rating, review }, { headers: { Authorization: `Bearer ${token}` } });
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.error || 'Failed to add rating');
        }
    }
);

const turfSlice = createSlice({
    name: 'turf',
    initialState,
    reducers: {
        clearTurfError: (state) => {
            state.error = null;
        },
        clearSelectedTurf: (state) => {
            state.selectedTurf = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Turfs
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
                state.error = action.payload as string;
            })
            // Fetch Turf by ID
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
                state.error = action.payload as string;
            })
            // Fetch Available Slots
            .addCase(fetchAvailableSlots.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
                state.loading = false;
                state.availableSlots = action.payload;
            })
            .addCase(fetchAvailableSlots.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Add Rating
            .addCase(addRating.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addRating.fulfilled, (state, action) => {
                state.loading = false;
                if (state.selectedTurf) {
                    state.selectedTurf = action.payload;
                }
            })
            .addCase(addRating.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearTurfError, clearSelectedTurf } = turfSlice.actions;
export default turfSlice.reducer;
