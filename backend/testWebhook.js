require('dotenv').config();

const crypto = require('crypto');
const axios = require('axios');

const webhookUrl =
    'https://anyway-affirm-easily.ngrok-free.dev/api/payments/webhook/paystack';

const payload = {
    event: 'charge.success',
    data: {
        status: 'success',
        reference: 'T072043423579583',
        amount: 315000,
        currency: 'NGN',
        paid_at: '2026-08-25T12:58:02.000Z',
        metadata: {
            registrationNumber: 'RDH-26-7771'
        }
    }
};

//create the Paystack-style signature
const signature = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');

const testWebhook = async () => {
    try {

        const response = await axios.post(
            webhookUrl,
            payload,
            {
                headers: {
                    'x-paystack-signature': signature,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Webhook response:', response.status);
        console.log(response.data);

    } catch (error) {

        console.error(
            'Webhook test failed:',
            error.response?.data || error.message
        );
    }
};

testWebhook();