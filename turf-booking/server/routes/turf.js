const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../utils/uploadMiddleware');
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');

// Get all turfs
router.get('/', async (req, res) => {
    try {
        const turfs = await Turf.find();
        res.json(turfs);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching turfs' });
    }
});

// Get turf by ID
router.get('/:id', async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }
        res.json(turf);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching turf' });
    }
});

// Create new turf (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const turf = new Turf(req.body);
        await turf.save();
        res.status(201).json(turf);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Upload turf images (admin only)
router.post('/upload', adminAuth, upload.array('images', 5), handleUploadError, async (req, res) => {
    try {
        const imageUrls = req.files.map(file => `/uploads/turfs/${file.filename}`);
        res.json({ imageUrls });
    } catch (err) {
        res.status(500).json({ error: 'Error uploading images' });
    }
});

// Update turf (admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const turf = await Turf.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }
        res.json(turf);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete turf (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const turf = await Turf.findByIdAndDelete(req.params.id);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }
        res.json({ message: 'Turf deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting turf' });
    }
});

// Get available slots for a turf
router.get('/:id/slots', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        // Get all bookings for this turf on the specified date
        const bookings = await Booking.find({
            turf: req.params.id,
            date,
            status: { $ne: 'cancelled' }
        });

        // Generate all possible slots
        const slots = generateTimeSlots();

        // Mark booked slots as unavailable
        const availableSlots = slots.map(slot => ({
            ...slot,
            isAvailable: !bookings.some(booking => 
                booking.slot.startTime === slot.startTime &&
                booking.slot.endTime === slot.endTime
            )
        }));

        res.json(availableSlots);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching available slots' });
    }
});

// Add rating to turf
router.post('/:id/ratings', auth, async (req, res) => {
    try {
        const { rating, review } = req.body;
        const turf = await Turf.findById(req.params.id);
        
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }

        // Check if user has already rated
        const existingRating = turf.ratings.find(r => r.userId.toString() === req.user.id);
        if (existingRating) {
            return res.status(400).json({ error: 'You have already rated this turf' });
        }

        turf.ratings.push({
            userId: req.user.id,
            rating,
            review,
            date: new Date()
        });

        // Calculate average rating
        const totalRating = turf.ratings.reduce((sum, r) => sum + r.rating, 0);
        turf.averageRating = totalRating / turf.ratings.length;

        await turf.save();
        res.json(turf);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Helper function to generate time slots
function generateTimeSlots() {
    const slots = [];
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM

    for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        const isPeakHour = hour >= 17 && hour <= 21; // 5 PM to 9 PM

        slots.push({
            startTime,
            endTime,
            isPeakHour
        });
    }

    return slots;
}

module.exports = router;
