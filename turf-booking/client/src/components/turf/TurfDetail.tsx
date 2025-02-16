import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Button,
    Rating,
    Chip,
    CircularProgress,
    Alert,
    Paper,
    TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import axios from 'axios';
import { fetchTurfById } from '../../store/turfSlice';
import { createBooking, fetchUserBookings } from '../../store/bookingSlice';
import { AppDispatch, RootState } from '../../store/store';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';

const TurfDetail = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    
    const { selectedTurf: turf, loading, error } = useSelector((state: RootState) => state.turf);
    const bookingState = useSelector((state: RootState) => state.booking);
    
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    useEffect(() => {
        if (id) {
            dispatch(fetchTurfById(id));
        }
    }, [dispatch, id]);

    const getSportIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'football':
                return <SportsSoccerIcon />;
            case 'cricket':
                return <SportsCricketIcon />;
            case 'basketball':
                return <SportsBasketballIcon />;
            default:
                return <SportsSoccerIcon />;
        }
    };

    const handleBooking = async () => {
        if (!turf) {
            console.error('Turf is not defined');
            return; 
        }

        if (!selectedDate || !startTime || !endTime) {
            console.error('Date or time is not defined');
            return; 
        }

        const bookingData = {
            turfId: turf._id,
            date: selectedDate.toISOString().split('T')[0],
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        };

        console.log('Booking data being sent:', bookingData);

        try {
            const resultAction = await dispatch(createBooking(bookingData));

            if (createBooking.fulfilled.match(resultAction)) {
                dispatch(fetchUserBookings());
                navigate('/bookings');
            }
        } catch (err) {
            console.error('Booking failed:', err);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFiles(Array.from(event.target.files));
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('images', selectedFiles[i]);
        }

        try {
            const response = await axios.post('http://localhost:5001/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload successful:', response.data);
        } catch (error) {
            console.error('Error uploading images:', error);
        }
    };

    if (loading) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!turf) {
        return (
            <Container>
                <Alert severity="info" sx={{ mt: 2 }}>
                    Turf not found
                </Alert>
            </Container>
        );
    }

    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="400"
                                image={turf.images[0] || 'https://via.placeholder.com/800x400?text=No+Image'}
                                alt={turf.name}
                            />
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    {getSportIcon(turf.type)}
                                    <Typography variant="h4" component="h1" ml={1}>
                                        {turf.name}
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" mb={2}>
                                    <LocationOnIcon />
                                    <Typography variant="h6" color="text.secondary" ml={1}>
                                        {turf.location.address}, {turf.location.city}
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" mb={2}>
                                    <Rating value={turf.averageRating} readOnly />
                                    <Typography variant="body1" color="text.secondary" ml={1}>
                                        ({turf.ratings.length} reviews)
                                    </Typography>
                                </Box>

                                <Typography variant="h5" color="primary" mb={2}>
                                    ₹{turf.basePrice}/hour
                                </Typography>

                                <Typography variant="h6" gutterBottom>
                                    Facilities
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                                    {turf.facilities.map((facility, index) => (
                                        <Chip key={index} label={facility} variant="outlined" />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Book This Turf
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <DatePicker
                                    label="Select Date"
                                    value={selectedDate}
                                    onChange={(newValue) => setSelectedDate(newValue)}
                                    disablePast
                                    sx={{ width: '100%' }}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <TimePicker
                                    label="Start Time"
                                    value={startTime}
                                    onChange={(newValue) => setStartTime(newValue)}
                                    sx={{ width: '100%' }}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <TimePicker
                                    label="End Time"
                                    value={endTime}
                                    onChange={(newValue) => setEndTime(newValue)}
                                    sx={{ width: '100%' }}
                                />
                            </Box>

                            <form onSubmit={handleSubmit}>
                                <TextField
                                    type="file"
                                    inputProps={{ multiple: true }}
                                    onChange={handleFileChange}
                                    fullWidth
                                />
                                <Button type="submit" variant="contained" color="primary" fullWidth size="large">
                                    Upload Images
                                </Button>
                            </form>

                            {bookingState.error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {bookingState.error}
                                </Alert>
                            )}

                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                onClick={handleBooking}
                                disabled={!selectedDate || !startTime || !endTime || bookingState.loading}
                            >
                                {bookingState.loading ? 'Booking...' : 'Book Now'}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default TurfDetail;
