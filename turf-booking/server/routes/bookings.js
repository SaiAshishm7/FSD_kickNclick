const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const { auth, adminAuth } = require('../middleware/auth');

// Create booking
router.post('/', auth, async (req, res) => {
    try {
        const { turfId, date, slot } = req.body;

        // Check if turf exists
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }

        // Check if slot is available
        const slotIndex = turf.availableSlots.findIndex(
            s => s.startTime === slot.startTime && s.endTime === slot.endTime
        );

        if (slotIndex === -1 || turf.availableSlots[slotIndex].isBooked) {
            return res.status(400).json({ error: 'Slot not available' });
        }

        // Check if booking date is within 5 days
        const bookingDate = new Date(date);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 5);

        if (bookingDate > maxDate) {
            return res.status(400).json({ error: 'Booking can only be made up to 5 days in advance' });
        }

        // Calculate if it's peak hour (after 6 PM)
        const startHour = parseInt(slot.startTime.split(':')[0]);
        const isPeakHour = startHour >= 18;
        const totalAmount = isPeakHour ? turf.basePrice * 1.3 : turf.basePrice;

        // Create booking
        const booking = new Booking({
            user: req.user._id,
            turf: turfId,
            date: bookingDate,
            slot,
            totalAmount,
            isPeakHour
        });

        // Update turf slot availability
        turf.availableSlots[slotIndex].isBooked = true;
        await turf.save();

        await booking.save();
        
        // Add booking to user's history
        req.user.bookingHistory.push(booking._id);
        await req.user.save();

        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
    try {
        await req.user.populate({
            path: 'bookingHistory',
            populate: { path: 'turf' }
        });
        res.json(req.user.bookingHistory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email phone')
            .populate('turf', 'name type location');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking status (admin only)
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const allowedUpdates = ['status', 'paymentStatus'];
        const updates = Object.keys(req.body);
        
        updates.forEach(update => {
            if (allowedUpdates.includes(update)) {
                booking[update] = req.body[update];
            }
        });

        await booking.save();
        res.json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Only allow cancellation if booking is not already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Free up the slot in turf
        const turf = await Turf.findById(booking.turf);
        const slotIndex = turf.availableSlots.findIndex(
            s => s.startTime === booking.slot.startTime && s.endTime === booking.slot.endTime
        );

        if (slotIndex !== -1) {
            turf.availableSlots[slotIndex].isBooked = false;
            await turf.save();
        }

        res.json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
