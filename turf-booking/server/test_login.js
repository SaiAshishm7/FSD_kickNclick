const axios = require('axios');

const login = async () => {
    try {
        const response = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'admin@kicknclick.com',
            password: 'admin123'
        });
        console.log('Login successful. Token:', response.data.token);
    } catch (error) {
        console.error('Login error:', error.response ? error.response.data : error.message);
    }
};

login();
