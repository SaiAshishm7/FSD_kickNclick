const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');
const { auth, adminAuth } = require('../middleware/auth');

// Get all turfs
router.get('/', async (req, res) => {
    try {
        const filters = {};
        if (req.query.type) filters.type = req.query.type;
        
        const turfs = await Turf.find(filters);
        res.json(turfs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single turf
router.get('/:id', async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }
        res.json(turf);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new turf (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const turf = new Turf(req.body);
        await turf.save();
        res.status(201).json(turf);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update turf (admin only)
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }

        Object.assign(turf, req.body);
        await turf.save();
        res.json(turf);
    } catch (error) {
        res.status(400).json({ error: error.message });
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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add rating and review
router.post('/:id/ratings', auth, async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }

        const { rating, review } = req.body;
        turf.ratings.push({
            user: req.user._id,
            rating,
            review
        });

        await turf.save();
        res.status(201).json(turf);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get available slots for a date
router.get('/:id/slots/:date', async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ error: 'Turf not found' });
        }

        // Filter available slots for the given date
        const slots = turf.availableSlots.filter(slot => !slot.isBooked);
        
        // Mark slots after 6 PM as peak hours
        const slotsWithPeakHours = slots.map(slot => {
            const startHour = parseInt(slot.startTime.split(':')[0]);
            return {
                ...slot.toObject(),
                isPeakHour: startHour >= 18
            };
        });

        res.json(slotsWithPeakHours);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
