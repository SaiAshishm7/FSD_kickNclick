const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Email templates
const getBookingConfirmationTemplate = (booking, user) => {
    return {
        subject: 'Booking Confirmation - Turf Booking',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1976d2;">Booking Confirmation</h2>
                <p>Dear ${user.name},</p>
                <p>Your turf booking has been confirmed. Here are the details:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Turf:</strong> ${booking.turf.name}</p>
                    <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${booking.slot.startTime} - ${booking.slot.endTime}</p>
                    <p><strong>Amount:</strong> ₹${booking.totalAmount}</p>
                    ${booking.isPeakHour ? '<p><em>Peak hour charges applied</em></p>' : ''}
                </div>
                
                <p>Please arrive 10 minutes before your slot time.</p>
                <p>If you need to cancel your booking, please do so at least 2 hours before the slot time.</p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666;">Thank you for choosing KickNClick!</p>
                    <p style="color: #666;">The KickNClick Team</p>
                </div>
            </div>
        `
    };
};

const getBookingCancellationTemplate = (booking, user) => {
    return {
        subject: 'Booking Cancellation - Turf Booking',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc004e;">Booking Cancellation</h2>
                <p>Dear ${user.name},</p>
                <p>Your turf booking has been cancelled. Here are the details:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Turf:</strong> ${booking.turf.name}</p>
                    <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${booking.slot.startTime} - ${booking.slot.endTime}</p>
                </div>
                
                <p>If this was a mistake or you'd like to make a new booking, please visit our website.</p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666;">Thank you for choosing KickNClick!</p>
                    <p style="color: #666;">The KickNClick Team</p>
                </div>
            </div>
        `
    };
};

const getBookingReminderTemplate = (booking, user) => {
    return {
        subject: 'Booking Reminder - Turf Booking',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1976d2;">Booking Reminder</h2>
                <p>Dear ${user.name},</p>
                <p>This is a reminder for your upcoming turf booking:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Turf:</strong> ${booking.turf.name}</p>
                    <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${booking.slot.startTime} - ${booking.slot.endTime}</p>
                </div>
                
                <p>Please arrive 10 minutes before your slot time.</p>
                <p>Location: ${booking.turf.location.address}, ${booking.turf.location.city}</p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666;">We look forward to seeing you!</p>
                    <p style="color: #666;">The Turf Booking Team</p>
                </div>
            </div>
        `
    };
};

// Send email function
const sendEmail = async (to, template) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Turf Booking <noreply@turfbooking.com>',
            to,
            subject: template.subject,
            html: template.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Email service functions
const emailService = {
    sendBookingConfirmation: async (booking, user) => {
        const template = getBookingConfirmationTemplate(booking, user);
        return sendEmail(user.email, template);
    },

    sendBookingCancellation: async (booking, user) => {
        const template = getBookingCancellationTemplate(booking, user);
        return sendEmail(user.email, template);
    },

    sendBookingReminder: async (booking, user) => {
        const template = getBookingReminderTemplate(booking, user);
        return sendEmail(user.email, template);
    }
};

module.exports = emailService;
