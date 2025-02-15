const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    turf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Turf',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    slot: {
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    isPeakHour: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Validate booking date is not more than 5 days in advance
bookingSchema.pre('save', function(next) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 5);
    
    if (this.date > maxDate) {
        next(new Error('Booking can only be made up to 5 days in advance'));
    }
    next();
});

// Calculate total amount including peak hour surcharge
bookingSchema.pre('save', function(next) {
    if (this.isPeakHour) {
        this.totalAmount = this.totalAmount * 1.3; // 30% increase for peak hours
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
