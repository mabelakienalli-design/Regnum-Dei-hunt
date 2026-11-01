const express = require('express');
const router = express.Router();

const paymentController = require('../Controller/paymentController');

router.post('/initialize/:regNumber', paymentController.initializePayment);

router.get('/status/:regNumber', paymentController.checkPaymentStatus);

module.exports = router;