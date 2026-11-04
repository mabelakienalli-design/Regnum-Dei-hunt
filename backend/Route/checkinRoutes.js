
const express = require('express');
const router = express.Router();

const checkinController = require('../Controller/checkinController');

const {
    staffAuth,
    adminOnly
} = require('../Middleware/staffAuth');


// Admins and Volunteers
router.get(
    '/lookup/:registrationNumber',
    staffAuth,
    checkinController.lookupSeeker
);

router.post(
    '/',
    staffAuth,
    checkinController.checkInSeeker
);

router.post(
    '/manual',
    staffAuth,
    checkinController.manualCheckInSeeker
);

// Admin only
router.post(
    '/reverse/:registrationNumber',
    staffAuth,
    adminOnly,
    checkinController.reverseCheckIn
);

module.exports = router;
