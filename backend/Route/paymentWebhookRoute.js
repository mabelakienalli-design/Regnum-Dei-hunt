const express = require('express');
const router = express.Router();

const paymentWebhookController = require('../Controller/paymentWebhookController');

router.post('/paystack', paymentWebhookController.handlePaystackWebhook);

module.exports = router;