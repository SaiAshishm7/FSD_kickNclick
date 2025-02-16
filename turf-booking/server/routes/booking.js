const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const { sendBookingConfirmation, sendBookingCancellation } = require('../utils/emailService');

// Get all bookings for the current user
router.get('/my-bookings', auth, async (req, res) => {
    console.log('Incoming request to get user bookings:', req.user._id);
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('turf', 'name type location')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

// Get all bookings (admin only)
router.get('/all', auth, async (req, res) => {
    console.log('Incoming request to get all bookings:', req.user._id);
    if (req.user.role !== 'admin') {
        console.error('Unauthorized access to get all bookings:', req.user._id);
        return res.status(403).json({ error: 'Not authorized' });
    }

    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('turf', 'name type location')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching all bookings:', err);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
    console.log('Booking request received:', req.body); // Log incoming request
    try {
        const { turfId, date, startTime, endTime } = req.body;

        if (!req.body.startTime || !req.body.endTime) {
            return res.status(400).json({ error: 'Start time or end time is missing or invalid' });
        }

        console.log('Turf ID:', turfId, 'Date:', date, 'Start Time:', startTime, 'End Time:', endTime);

        console.log('Turf ID:', turfId); // Log the turf ID

        const turf = await Turf.findById(turfId);
        if (!turf) {
            console.error('Turf not found:', turfId);
            return res.status(404).json({ error: 'Turf not found' });
        }

        const existingBooking = await Booking.findOne({
            turf: turfId,
            date,
            'slot.startTime': req.body.startTime,
            'slot.endTime': req.body.endTime,
            status: { $ne: 'cancelled' }
        });

        if (existingBooking) {
            console.error('Slot is already booked:', existingBooking);
            return res.status(400).json({ error: 'Slot is already booked' });
        }

        const durationInHours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
        const totalAmount = turf.basePrice * durationInHours;

        const booking = new Booking({
            user: req.user._id,
            turf: turfId,
            date,
            slot: { startTime, endTime },
            totalAmount,
            status: 'confirmed', // Set status to confirmed
        });

        await booking.save();
        const user = { name: req.user.name, email: req.user.email }; // Get user details
        await sendBookingConfirmation(booking, user); // Send email confirmation
        res.status(201).json(booking);
    } catch (err) {
        console.error('Error during booking:', err);
        res.status(500).json({ error: 'Error during booking' });
    }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
    console.log('Incoming request to cancel booking:', req.params.id); // Log incoming request
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            console.error('Booking not found:', req.params.id); // Log booking not found
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if user owns the booking or is admin
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            console.error('Unauthorized access to cancel booking:', req.user._id); // Log unauthorized access
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check if booking can be cancelled (e.g., not already cancelled)
        if (booking.status === 'cancelled') {
            console.error('Booking is already cancelled:', booking); // Log booking already cancelled
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        const currentDate = new Date();
        console.log('Current Date and Time:', currentDate);

        const bookingDate = new Date(booking.date);
        const bookingStartTime = new Date(`${booking.date}T${booking.slot.startTime}`);
        if (bookingStartTime < currentDate) {
            console.error('Cannot cancel past bookings:', booking); // Log cannot cancel past bookings
            return res.status(400).json({ error: 'Cannot cancel past bookings' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Get turf details for email
        const turf = await Turf.findById(booking.turf);

        console.log('Turf object for cancellation email:', turf);

        // Send cancellation email
        const user = { name: req.user.name, email: req.user.email }; // Get user details
        await sendBookingCancellation(booking, user); // Send cancellation email

        res.json(booking);
    } catch (err) {
        console.error('Error during booking cancellation:', err); // Log any errors
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
