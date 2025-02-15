import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert,
    Grid,
    Chip
} from '@mui/material';
import { format } from 'date-fns';
import { fetchUserBookings, cancelBooking } from '../../store/bookingSlice';
import { AppDispatch, RootState } from '../../store/store';

const BookingList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { bookings, loading, error } = useSelector((state: RootState) => state.booking);

    useEffect(() => {
        dispatch(fetchUserBookings());
    }, [dispatch]);

    const handleCancelBooking = async (bookingId: string) => {
        try {
            await dispatch(cancelBooking(bookingId)).unwrap();
        } catch (error) {
            console.error('Failed to cancel booking:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Bookings
            </Typography>

            {bookings.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        No bookings found
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {bookings.map((booking) => (
                        <Grid item xs={12} key={booking._id}>
                            <Paper sx={{ p: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={8}>
                                        <Typography variant="h6">
                                            {booking.turf.name}
                                        </Typography>
                                        <Typography color="text.secondary" gutterBottom>
                                            {format(new Date(booking.date), 'MMMM dd, yyyy')}
                                        </Typography>
                                        <Typography variant="body1">
                                            Time: {booking.slot.startTime} - {booking.slot.endTime}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mt: 1 }}>
                                            Amount: ₹{booking.totalAmount}
                                            {booking.isPeakHour && ' (Peak hour rates applied)'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4} sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: { xs: 'flex-start', sm: 'flex-end' },
                                        gap: 1
                                    }}>
                                        <Chip
                                            label={booking.status.toUpperCase()}
                                            color={getStatusColor(booking.status) as any}
                                            sx={{ mb: 1 }}
                                        />
                                        {booking.status !== 'cancelled' && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleCancelBooking(booking._id)}
                                            >
                                                Cancel Booking
                                            </Button>
                                        )}
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default BookingList;
