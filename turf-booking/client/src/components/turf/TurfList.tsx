import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Rating,
    Box,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material';
import { fetchTurfs } from '../../store/turfSlice';
import { AppDispatch, RootState } from '../../store/store';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';

// Ensure the API_BASE_URL points to your local server
const API_BASE_URL = 'http://localhost:5001';

const TurfList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { turfs, loading, error } = useSelector((state: RootState) => state.turf);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        dispatch(fetchTurfs());
    }, [dispatch]);

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

    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Available Turfs
                </Typography>
                
                <FormControl sx={{ mb: 3, minWidth: 200 }}>
                    <InputLabel>Filter by Sport</InputLabel>
                    <Select
                        value={filter}
                        label="Filter by Sport"
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <MenuItem value="">All Sports</MenuItem>
                        <MenuItem value="football">Football</MenuItem>
                        <MenuItem value="cricket">Cricket</MenuItem>
                        <MenuItem value="basketball">Basketball</MenuItem>
                    </Select>
                </FormControl>

                <Grid container spacing={3}>
                    {turfs
                        .filter(turf => !filter || turf.type.toLowerCase() === filter.toLowerCase())
                        .map((turf) => (
                            <Grid item xs={12} sm={6} md={4} key={turf._id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image={`${API_BASE_URL}${turf.images?.[0] || '/public/images/default-turf.jpg'}`}
                                        alt={turf.name}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            {getSportIcon(turf.type)}
                                            <Typography variant="h6" component="h2" ml={1}>
                                                {turf.name}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" alignItems="center" mb={1}>
                                            <LocationOnIcon fontSize="small" />
                                            <Typography variant="body2" color="text.secondary" ml={1}>
                                                {turf.location.address}, {turf.location.city}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Rating value={turf.averageRating} readOnly size="small" />
                                            <Typography variant="body2" color="text.secondary" ml={1}>
                                                ({turf.ratings.length} reviews)
                                            </Typography>
                                        </Box>

                                        <Typography variant="h6" color="primary" mb={1}>
                                            ₹{turf.basePrice}/hour
                                        </Typography>

                                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                                            {turf.facilities.map((facility, index) => (
                                                <Chip
                                                    key={index}
                                                    label={facility}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={() => {
                                                alert(`Button clicked for turf ID: ${turf._id}`); 
                                                alert('Navigating to booking page...'); 
                                                navigate(`/turf/${turf._id}`);
                                            }}
                                        >
                                            Book Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                </Grid>
            </Box>
        </Container>
    );
};

export default TurfList;
