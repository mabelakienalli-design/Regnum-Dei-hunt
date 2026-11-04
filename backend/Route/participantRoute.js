const express = require('express');
const router = express.Router();

const participantController = require('../Controller/participantController');

router.post('/register', participantController.createParticipant);

router.post('/verify-email/request', participantController.requestEmailVerification);

router.post('/verify-email/confirm', participantController.verifyEmailCode);

router.post('/recover-seeker-id', participantController.recoverSeekerID);

module.exports = router;