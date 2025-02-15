const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const testUser = new User({
            name: 'Test User',
            email: 'user@kicknclick.com',
            password: 'user123',
            phone: '9876543210',
            role: 'user'
        });

        await testUser.save();
        console.log('Test user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
};

createTestUser();
