const crypto = require('crypto');
const completePayment = require('../Services/completePayment');

// Handle Paystack webhook
const handlePaystackWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-paystack-signature'];

        // Ensure the original request body and signature exist
        if (!Buffer.isBuffer(req.body) || !signature) {
            return res.status(400).json({
                message: 'Invalid webhook request'
            });
        }

        // Verify Paystack signature
        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(req.body)
            .digest('hex');

        const receivedSignature = Buffer.from(signature, 'hex');
        const calculatedSignature = Buffer.from(hash, 'hex');

        if (
            receivedSignature.length !== calculatedSignature.length ||
            !crypto.timingSafeEqual(
                receivedSignature,
                calculatedSignature
            )
        ) {
            return res.status(401).json({
                message: 'Invalid webhook signature'
            });
        }

        // Convert verified request body into JSON
        const event = JSON.parse(req.body.toString('utf8'));

        console.log('Paystack webhook received:', event.event);

        // Process successful payments
        if (
            event.event === 'charge.success' &&
            event.data.status === 'success'
        ) {
            await completePayment(event.data);
        }

        return res.sendStatus(200);

    } catch (error) {
        console.error('Webhook error:', error);

        return res.sendStatus(500);
    }
};

module.exports = {
    handlePaystackWebhook
};