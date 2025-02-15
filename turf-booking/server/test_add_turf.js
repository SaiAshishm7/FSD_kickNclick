const axios = require('axios');

const addTurf = async () => {
    try {
        const response = await axios.post('http://localhost:5001/api/turfs', {
            name: 'Sample Turf',
            type: 'football',
            location: {
                address: '123 Sports Street',
                city: 'Sample City',
                state: 'Sample State',
                coordinates: {
                    lat: 12.9716,
                    lng: 77.5946
                }
            },
            facilities: ['parking', 'water', 'Floodlights'],
            basePrice: 1000,
            availableSlots: [
                {
                    startTime: '06:00',
                    endTime: '07:00',
                    isBooked: false,
                    isPeakHour: false
                },
                {
                    startTime: '07:00',
                    endTime: '08:00',
                    isBooked: false,
                    isPeakHour: true
                }
            ],
            images: []
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2FlZGMyODQ4NGNhMTJiMzNlMTc1MzMiLCJpYXQiOjE3Mzk2MDgyODQsImV4cCI6MTc0MDIxMzA4NH0.3M3g0_8BBxOHDW5XpZGe9CgwbxNEy2GqP0VL_9M92Cs'
            }
        });
        console.log('Turf added successfully:', response.data);
    } catch (error) {
        console.error('Error adding turf:', error.response ? error.response.data : error.message);
    }
};

addTurf();
