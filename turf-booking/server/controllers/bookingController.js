const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// Helper function to check if a slot is available
const isSlotAvailable = async (turfId, date, slot) => {
    const existingBooking = await Booking.findOne({
        turf: turfId,
        date,
        'slot.startTime': slot.startTime,
        'slot.endTime': slot.endTime,
        status: { $ne: 'cancelled' }
    });
    return !existingBooking;
};

// Helper function to calculate total amount
const calculateTotalAmount = (basePrice, isPeakHour) => {
    return isPeakHour ? basePrice * 1.3 : basePrice;
};

exports.createBooking = async (req, res) => {
    console.log('Create booking request:', req.body); // Log incoming request
    try {
        const { turfId, date, slot } = req.body;
        const userId = req.user.id;

        // Check if slot is available
        const isAvailable = await isSlotAvailable(turfId, date, slot);
        console.log('Slot availability for turf:', turfId, 'is available:', isAvailable); // Log slot availability
        if (!isAvailable) {
            console.error('This slot is already booked for turf:', turfId); // Log slot already booked
            return res.status(400).json({ error: 'This slot is already booked' });
        }

        // Get turf details
        const turf = await Turf.findById(turfId);
        console.log('Turf lookup result:', turf); // Log turf lookup result
        if (!turf) {
            console.error('Turf not found:', turfId); // Log turf not found
            return res.status(404).json({ error: 'Turf not found' });
        }

        // Calculate total amount
        const totalAmount = calculateTotalAmount(turf.basePrice, slot.isPeakHour);

        // Create booking
        const booking = new Booking({
            turf: turfId,
            user: userId,
            date,
            slot,
            totalAmount,
            isPeakHour: slot.isPeakHour,
            status: 'confirmed'
        });
        console.log('Creating booking:', booking); // Log booking creation
        console.log('Turf details for booking:', turf); // Log turf details for booking

        await booking.save();
        console.log('Booking created successfully:', booking._id); // Log booking creation success

        // Populate booking with turf and user details
        const populatedBooking = await Booking.findById(booking._id)
            .populate('turf', 'name type location')
            .populate('user', 'name email');

        // Send confirmation email
        await emailService.sendBookingConfirmation(populatedBooking, req.user);

        // Schedule reminder email for 2 hours before the booking
        const bookingTime = new Date(date + 'T' + slot.startTime);
        const reminderTime = new Date(bookingTime.getTime() - 2 * 60 * 60 * 1000);
        const now = new Date();

        if (reminderTime > now) {
            setTimeout(async () => {
                const updatedBooking = await Booking.findById(booking._id)
                    .populate('turf', 'name type location')
                    .populate('user', 'name email');
                
                if (updatedBooking && updatedBooking.status === 'confirmed') {
                    await emailService.sendBookingReminder(updatedBooking, req.user);
                }
            }, reminderTime - now);
        }

        res.status(201).json(populatedBooking);
    } catch (error) {
        console.error('Error creating booking:', error); // Log any errors
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('turf', 'name type')
            .sort({ date: -1, 'slot.startTime': -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('turf', 'name type location')
            .populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if user owns the booking or is admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check if booking can be cancelled (at least 2 hours before)
        const bookingTime = new Date(booking.date + 'T' + booking.slot.startTime);
        const now = new Date();
        const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

        if (hoursUntilBooking < 2) {
            return res.status(400).json({
                error: 'Bookings can only be cancelled at least 2 hours before the slot time'
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Send cancellation email
        await emailService.sendBookingCancellation(booking, req.user);

        res.json(booking);
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};

exports.getAdminBookings = async (req, res) => {
    try {
        const { status, date, turfId } = req.query;
        const query = {};

        if (status) query.status = status;
        if (date) query.date = date;
        if (turfId) query.turf = turfId;

        const bookings = await Booking.find(query)
            .populate('turf', 'name type')
            .populate('user', 'name email')
            .sort({ date: -1, 'slot.startTime': -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching admin bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

exports.getBookingStats = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
        
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const bookingsByTurf = await Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: '$turf', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'turfs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'turf'
                }
            },
            { $unwind: '$turf' },
            {
                $project: {
                    _id: 0,
                    turf: { name: '$turf.name', type: '$turf.type' },
                    bookingCount: '$count'
                }
            }
        ]);

        res.json({
            totalBookings,
            confirmedBookings,
            cancelledBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            popularTurfs: bookingsByTurf
        });
    } catch (error) {
        console.error('Error fetching booking stats:', error);
        res.status(500).json({ error: 'Failed to fetch booking statistics' });
    }
};
