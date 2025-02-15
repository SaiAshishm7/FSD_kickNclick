export interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'admin';
    createdAt: string;
}

export interface Location {
    address: string;
    city: string;
    state: string;
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
    isPeakHour: boolean;
}

export interface Rating {
    userId: string;
    rating: number;
    review: string;
    date: string;
}

export interface Turf {
    _id: string;
    name: string;
    type: string;
    basePrice: number;
    location: Location;
    facilities: string[];
    images: string[];
    ratings: Rating[];
    averageRating: number;
}

export interface Booking {
    _id: string;
    turf: {
        _id: string;
        name: string;
        type: string;
    };
    user: {
        _id: string;
        name: string;
        email: string;
    };
    date: string;
    slot: TimeSlot;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    isPeakHour: boolean;
    createdAt: string;
}
