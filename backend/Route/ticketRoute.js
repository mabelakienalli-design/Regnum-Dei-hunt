
const express = require('express');
const router = express.Router();

const ticketController = require('../Controller/ticketController');

// Public ticket retrieval for the seeker's ticket page.
// Check-in is handled separately through authenticated staff routes.
router.get('/:regNumber', ticketController.getTicket);

module.exports = router;
