const express = require('express');
const router = express.Router();

const paymentController = require('../Controller/paymentController');

router.post('/initialize/:regNumber', paymentController.initializePayment);

router.get('/status/:regNumber', paymentController.checkPaymentStatus);

router.get('/verify/:regNumber', paymentController.verifyPayment);

module.exports = router;