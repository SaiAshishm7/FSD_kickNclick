const axios = require('axios');

const testBooking = async () => {
    try {
        // First, login as a regular user
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'user@kicknclick.com',  // Replace with your test user email
            password: 'user123'            // Replace with your test user password
        });
        
        const token = loginResponse.data.token;
        
        // Create a booking
        const bookingResponse = await axios.post('http://localhost:5001/api/bookings', {
            turfId: '67b050f83f69131ff3881bd3',  // Use the ID of the turf we just created
            date: '2025-02-16',  // Tomorrow's date
            slot: {
                startTime: '07:00',
                endTime: '08:00'
            },
            totalAmount: 1000  // Added totalAmount based on turf's basePrice
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Booking created successfully:', bookingResponse.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

testBooking();
