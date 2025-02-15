const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const { adminAuth } = require('../middleware/auth');

// Get all users
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalTurfs = await Turf.countDocuments();
        const totalBookings = await Booking.countDocuments();
        
        // Get today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = await Booking.countDocuments({
            date: { $gte: today }
        });

        // Get revenue statistics
        const bookings = await Booking.find({ status: 'confirmed' });
        const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        
        // Get popular turfs
        const popularTurfs = await Booking.aggregate([
            { $group: {
                _id: '$turf',
                bookingCount: { $sum: 1 }
            }},
            { $sort: { bookingCount: -1 }},
            { $limit: 5 }
        ]);

        // Populate turf details
        await Turf.populate(popularTurfs, { path: '_id' });

        res.json({
            totalUsers,
            totalTurfs,
            totalBookings,
            todayBookings,
            totalRevenue,
            popularTurfs: popularTurfs.map(item => ({
                turf: item._id,
                bookingCount: item.bookingCount
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user role
router.patch('/users/:id/role', adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get booking reports
router.get('/reports/bookings', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate('turf', 'name type')
            .sort({ date: -1 });

        const report = {
            totalBookings: bookings.length,
            confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
            cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
            totalRevenue: bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + b.totalAmount, 0),
            bookings
        };

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
