require('dotenv').config();

const { sendEmail } = require('./Services/emailService');

const testEmail = async () => {
    try {
        await sendEmail(
            process.env.EMAIL_USER,
            'REGNUM DEI Email Test',
            'Welcome to the Kingdom of God. This is a test email from the REGNUM DEI backend.'
        );

        console.log('Test email completed successfully.');

    } catch (error) {
        console.error('Test email failed:', error);
    }
};

testEmail();