const express = require('express');
const router = express.Router();

const ticketController = require('../Controller/ticketController');

router.get('/verify/:ticketToken', ticketController.verifyTicket);
router.get('/:regNumber', ticketController.getTicket);

module.exports = router;