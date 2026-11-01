const express = require('express');
const router = express.Router();

const staffController = require('../Controller/staffController');
const staffAuth = require('../Middleware/staffAuth');

router.post('/create', staffController.createStaff);
router.post('/login', staffController.loginStaff);


router.get('/test-auth', staffAuth, (req, res) => {
    res.status(200).json({
        message: 'Staff authorization successful',
        staff: req.staff
    });
});
router.get('/participants', staffAuth, staffController.getParticipants);

module.exports = router;