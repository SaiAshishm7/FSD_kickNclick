const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const { sendBookingConfirmation, sendBookingCancellation } = require('../utils/emailService');

// Get all bookings for the current user
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('turf', 'name type location')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

// Get all bookings (admin only)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }

    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('turf', 'name type location')
            .sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
    try {
        const { turfId, date, slot } = req.body;

        // Check if turf exists
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }

        // Check if slot is available
        const existingBooking = await Booking.findOne({
            turf: turfId,
            date,
            'slot.startTime': slot.startTime,
            'slot.endTime': slot.endTime,
            status: { $ne: 'cancelled' }
        });

        if (existingBooking) {
            return res.status(400).json({ error: 'Slot is already booked' });
        }

        // Calculate price
        const basePrice = turf.basePrice;
        const isPeakHour = parseInt(slot.startTime.split(':')[0]) >= 17 && parseInt(slot.startTime.split(':')[0]) <= 21;
        const totalAmount = isPeakHour ? basePrice * 1.2 : basePrice;

        // Create booking
        const booking = new Booking({
            user: req.user._id,
            turf: turfId,
            date,
            slot,
            totalAmount,
            isPeakHour,
            status: 'confirmed'
        });

        await booking.save();

        // Populate the booking with user and turf details
        await booking.populate('user turf');

        // Send confirmation email
        await sendBookingConfirmation(booking, booking.user);

        res.status(201).json(booking);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if user owns the booking or is admin
        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check if booking can be cancelled (e.g., not already cancelled and not in the past)
        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        const bookingDate = new Date(booking.date);
        if (bookingDate < new Date()) {
            return res.status(400).json({ error: 'Cannot cancel past bookings' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Get turf details for email
        const turf = await Turf.findById(booking.turf);

        // Send cancellation email
        await sendBookingCancellation(req.user.email, {
            userName: req.user.name,
            turfName: turf.name,
            date: booking.date,
            startTime: booking.slot.startTime,
            endTime: booking.slot.endTime
        });

        res.json(booking);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
