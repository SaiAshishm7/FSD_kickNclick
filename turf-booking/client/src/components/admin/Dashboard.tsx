import React, { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    People as PeopleIcon,
    SportsScore as TurfIcon,
    BookOnline as BookingIcon,
    AttachMoney as RevenueIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

interface DashboardStats {
    totalUsers: number;
    totalTurfs: number;
    totalBookings: number;
    todayBookings: number;
    totalRevenue: number;
    popularTurfs: {
        turf: {
            name: string;
            type: string;
        };
        bookingCount: number;
    }[];
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

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
                <Typography color="error" align="center">
                    {error}
                </Typography>
            </Container>
        );
    }

    if (!stats) return null;

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Icon sx={{ color, mr: 1 }} />
                    <Typography color="textSecondary" variant="h6">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4" component="div">
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Container sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    Admin Dashboard
                </Typography>
                <Tooltip title="Refresh Statistics">
                    <IconButton onClick={fetchDashboardStats}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={PeopleIcon}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Turfs"
                        value={stats.totalTurfs}
                        icon={TurfIcon}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        icon={BookingIcon}
                        color="#ed6c02"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        icon={RevenueIcon}
                        color="#9c27b0"
                    />
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Popular Turfs
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Turf Name</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Total Bookings</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.popularTurfs.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.turf.name}</TableCell>
                                            <TableCell>
                                                {item.turf.type.charAt(0).toUpperCase() + item.turf.type.slice(1)}
                                            </TableCell>
                                            <TableCell align="right">{item.bookingCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
