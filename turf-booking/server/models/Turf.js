const mongoose = require('mongoose');

const turfSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['football', 'cricket', 'basketball', 'Football']
    },
    location: {
        address: String,
        city: String,
        state: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    facilities: [{
        type: String,
        enum: ['parking', 'Parking', 'washroom', 'changing_room', 'water', 'floodlights', 'Floodlights', 'equipment', 'First Aid', 'Changing Rooms', 'Water', 'Equipment Rental']
    }],
    images: {
        type: [String],
        default: ['/public/images/default-turf.jpg']
    },
    basePrice: {
        type: Number,
        required: true
    },
    availableSlots: [{
        startTime: String,
        endTime: String,
        isBooked: {
            type: Boolean,
            default: false
        },
        isPeakHour: {
            type: Boolean,
            default: false
        }
    }],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate average rating before saving
turfSchema.pre('save', function(next) {
    if (this.ratings.length > 0) {
        this.averageRating = this.ratings.reduce((acc, curr) => acc + curr.rating, 0) / this.ratings.length;
    }
    next();
});

const Turf = mongoose.model('Turf', turfSchema);
module.exports = Turf;
