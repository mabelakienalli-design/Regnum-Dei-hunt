
const express = require('express');
const router = express.Router();

const staffController = require('../Controller/staffController');
const participantController = require('../Controller/participantController');

const {
    staffAuth,
    adminOnly
} = require('../Middleware/staffAuth');


// ======================================
// PUBLIC ROUTES
// ======================================

router.post(
    '/invitations/validate',
    staffController.validateInvitation
);

router.post(
    '/register',
    staffController.registerStaff
);

router.post(
    '/verify-email/request',
    participantController.requestEmailVerification
);

router.post(
    '/verify-email/confirm',
    participantController.verifyEmailCode
);

// ======================================
// ADMIN-ONLY ROUTES
// ======================================

// Create invitation
router.post(
    '/invitations',
    staffAuth,
    adminOnly,
    staffController.createInvitation
);

// Get invitation history
router.get(
    '/invitations',
    staffAuth,
    adminOnly,
    staffController.getInvitations
);

// Revoke invitation
router.patch(
    '/invitations/:invitationId/revoke',
    staffAuth,
    adminOnly,
    staffController.revokeInvitation
);

// Get staff directory
router.get(
    '/directory',
    staffAuth,
    adminOnly,
    staffController.getStaffDirectory
);

// Update staff member
router.patch(
    '/directory/:staffId',
    staffAuth,
    adminOnly,
    staffController.updateStaffMember
);


// ======================================
// AUTHENTICATED STAFF
// ======================================

router.get(
    '/me',
    staffAuth,
    staffController.getCurrentStaff
);


module.exports = router;
