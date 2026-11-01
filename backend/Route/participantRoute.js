const express = require('express');
const router = express.Router();

const participantController = require('../Controller/participantController');

router.post('/register', participantController.createParticipant);

module.exports = router;