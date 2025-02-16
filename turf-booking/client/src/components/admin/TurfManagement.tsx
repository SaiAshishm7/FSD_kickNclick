import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Chip,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { Turf } from '../../types';
import api from '../../utils/api';

interface TurfFormData {
    name: string;
    type: string;
    basePrice: number;
    location: {
        address: string;
        city: string;
        state: string;
    };
    facilities: string[];
    images: File[];
}

const initialFormData: TurfFormData = {
    name: '',
    type: '',
    basePrice: 0,
    location: {
        address: '',
        city: '',
        state: ''
    },
    facilities: [],
    images: []
};

const TurfManagement = () => {
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState<TurfFormData>(initialFormData);
    const [editingTurf, setEditingTurf] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string[]>([]);
    const [success, setSuccess] = useState<string>('');

    const fetchTurfs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/turfs');
            setTurfs(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error fetching turfs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTurfs();
    }, []);

    const handleOpenDialog = (turf?: Turf) => {
        if (turf) {
            setFormData({
                name: turf.name,
                type: turf.type,
                basePrice: turf.basePrice,
                location: { ...turf.location },
                facilities: [...turf.facilities],
                images: []
            });
            setEditingTurf(turf._id);
        } else {
            setFormData(initialFormData);
            setEditingTurf(null);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData(initialFormData);
        setEditingTurf(null);
        setImagePreview([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('location.')) {
            const locationField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location,
                    [locationField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSelectChange = (e: SelectChangeEvent<string[]>) => {
        setFormData(prev => ({
            ...prev,
            facilities: e.target.value as string[]
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...files]
            }));

            // Create preview URLs
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreview(prev => [...prev, ...newPreviews]);
        }
    };

    const validateForm = () => {
        if (!formData.name) return 'Name is required';
        if (!formData.type) return 'Type is required';
        if (!formData.location.address) return 'Address is required';
        if (!formData.location.city) return 'City is required';
        if (!formData.basePrice || formData.basePrice <= 0) return 'Valid base price is required';
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('basePrice', formData.basePrice.toString());
            formDataToSend.append('location', JSON.stringify(formData.location));
            formData.facilities.forEach(facility => {
                formDataToSend.append('facilities[]', facility);
            });
            formData.images.forEach(image => {
                formDataToSend.append('images', image);
            });

            if (editingTurf) {
                await api.put(`/turfs/${editingTurf}`, formDataToSend);
            } else {
                await api.post('/turfs', formDataToSend);
            }

            handleCloseDialog();
            fetchTurfs();
            setSuccess('Turf created/updated successfully!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error saving turf');
            console.error('Error creating/updating turf:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (turfId: string) => {
        if (window.confirm('Are you sure you want to delete this turf?')) {
            try {
                setLoading(true);
                await api.delete(`/turfs/${turfId}`);
                fetchTurfs();
            } catch (err: any) {
                setError(err.response?.data?.error || 'Error deleting turf');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Turf Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add New Turf
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {turfs.map(turf => (
                    <Grid item xs={12} sm={6} md={4} key={turf._id}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="200"
                                image={turf.images[0] || '/placeholder.jpg'}
                                alt={turf.name}
                            />
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {turf.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Type: {turf.type}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Price: ₹{turf.basePrice}/hour
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Location: {turf.location ? turf.location.city : 'City not available'}, {turf.location ? turf.location.state : 'State not available'}
                                </Typography>
                                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                                    {turf.facilities.map((facility, index) => (
                                        <Chip key={index} label={facility} size="small" />
                                    ))}
                                </Stack>
                            </CardContent>
                            <CardActions>
                                <IconButton onClick={() => handleOpenDialog(turf)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDelete(turf._id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingTurf ? 'Edit Turf' : 'Add New Turf'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name"
                                    label="Turf Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="type"
                                    label="Turf Type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="basePrice"
                                    label="Base Price per Hour"
                                    name="basePrice"
                                    type="number"
                                    value={formData.basePrice}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="location.address"
                                    label="Address"
                                    name="location.address"
                                    value={formData.location.address}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="location.city"
                                    label="City"
                                    name="location.city"
                                    value={formData.location.city}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="location.state"
                                    label="State"
                                    name="location.state"
                                    value={formData.location.state}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel id="facilities-label">Facilities</InputLabel>
                                    <Select
                                        labelId="facilities-label"
                                        id="facilities"
                                        multiple
                                        value={formData.facilities}
                                        onChange={handleSelectChange}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        <MenuItem value="Floodlights">Floodlights</MenuItem>
                                        <MenuItem value="Changing Rooms">Changing Rooms</MenuItem>
                                        <MenuItem value="Parking">Parking</MenuItem>
                                        <MenuItem value="Water">Water</MenuItem>
                                        <MenuItem value="First Aid">First Aid</MenuItem>
                                        <MenuItem value="Equipment Rental">Equipment Rental</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadIcon />}
                                    fullWidth
                                >
                                    Upload Images
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </Button>
                            </Grid>
                            {imagePreview.length > 0 && (
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                        {imagePreview.map((preview, index) => (
                                            <img
                                                key={index}
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                style={{
                                                    width: 100,
                                                    height: 100,
                                                    objectFit: 'cover',
                                                    borderRadius: 4
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : (editingTurf ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TurfManagement;
