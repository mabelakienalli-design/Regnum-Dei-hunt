
const express = require('express');

const router = express.Router();

const participantRecordsController = require(
    '../Controller/participantRecordsController'
);

const {
    staffAuth,
    adminOnly
} = require('../Middleware/staffAuth');

// Admins and Volunteers can access the restricted participant list.
router.get(
    '/',
    staffAuth,
    participantRecordsController.getParticipants
);

// Admins and Volunteers can view the restricted checked-in list.
router.get(
    '/checked-in',
    staffAuth,
    participantRecordsController.getCheckedInParticipants
);

// Only Admins can access full participant details.
router.get(
    '/:registrationNumber',
    staffAuth,
    adminOnly,
    participantRecordsController.getParticipantDetails
);

module.exports = router;
