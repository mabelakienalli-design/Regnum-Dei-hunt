const crypto = require('crypto');
const supabase = require('../Config/serverSupabaseConfig');

const INVITATION_DURATION = 30 * 60 * 1000;


// Hash invitation tokens before storing them in Supabase
const hashToken = (token) => {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
};


// Find an invitation and confirm that it is still valid
const findValidInvitation = async (token) => {
    if (!token || typeof token !== 'string') {
        return { invitation: null, error: 'Invalid invitation link.' };
    }

    const tokenHash = hashToken(token);

    const { data: invitation, error } = await supabase
        .from('staff_invitations')
        .select('id, role, expires_at, revoked_at')
        .eq('token_hash', tokenHash)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!invitation) {
        return { invitation: null, error: 'Invitation not found.' };
    }

    if (invitation.revoked_at) {
        return { invitation: null, error: 'This invitation has been revoked.' };
    }

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
        return { invitation: null, error: 'This invitation has expired.' };
    }

    return { invitation, error: null };
};


// ADMIN: Create a reusable invitation link
exports.createInvitation = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['admin', 'volunteer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Select a valid invitation role.'
            });
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(token);

        const expiresAt = new Date(
            Date.now() + INVITATION_DURATION
        ).toISOString();

        // Revoke any previous active invitation for this role
        const { error: revokeError } = await supabase
            .from('staff_invitations')
            .update({ revoked_at: new Date().toISOString() })
            .eq('role', role)
            .is('revoked_at', null)
            .gt('expires_at', new Date().toISOString());

        if (revokeError) {
            throw revokeError;
        }

        const { data: invitation, error } = await supabase
            .from('staff_invitations')
            .insert({
                token_hash: tokenHash,
                role,
                created_by: req.staff.id,
                expires_at: expiresAt
            })
            .select('id, role, expires_at')
            .single();

        if (error) {
            throw error;
        }

        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            return res.status(500).json({
                success: false,
                message: 'FRONTEND_URL is not configured.'
            });
        }

        const invitationLink =
            `${frontendUrl.replace(/\/$/, '')}/staff-register.html?token=${token}`;

        return res.status(201).json({
            success: true,
            message: `${role} invitation created. It expires in 30 minutes.`,
            invitation,
            invitationLink
        });

    } catch (error) {
        console.error('Create invitation error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to create invitation.'
        });
    }
};


// PUBLIC: Validate an invitation before showing registration
exports.validateInvitation = async (req, res) => {
    try {
        const { token } = req.body;

        const result = await findValidInvitation(token);

        if (!result.invitation) {
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        return res.status(200).json({
            success: true,
            role: result.invitation.role,
            expiresAt: result.invitation.expires_at
        });

    } catch (error) {
        console.error('Validate invitation error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to validate invitation.'
        });
    }
};


// PUBLIC: Register a staff member through a valid invitation
exports.registerStaff = async (req, res) => {
    let createdUserId = null;

    try {
        const {
            token,
            fullName,
            email,
            password,
            department
        } = req.body;

        if (!token || !fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, password and invitation token are required.'
            });
        }

        if (typeof password !== 'string' || password.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 10 characters.'
            });
        }

        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanEmail) {
            return res.status(400).json({
                success: false,
                message: 'Enter a valid name and email address.'
            });
        }

        // The invitation determines the role.
        const result = await findValidInvitation(token);

        if (!result.invitation) {
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        const invitation = result.invitation;

        // Create the individual Supabase Auth account
        const { data: authData, error: authError } =
            await supabase.auth.admin.createUser({
                email: cleanEmail,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: cleanName
                }
            });

        if (authError) {
            return res.status(400).json({
                success: false,
                message: authError.message
            });
        }

        createdUserId = authData.user.id;

        // Check that the invitation is still valid before creating the profile
        const latestInvitation = await findValidInvitation(token);

        if (!latestInvitation.invitation) {
            await supabase.auth.admin.deleteUser(createdUserId);

            return res.status(400).json({
                success: false,
                message: latestInvitation.error
            });
        }

        // Create the staff profile using the invitation's assigned role
        const { error: profileError } = await supabase
            .from('staff_profiles')
            .insert({
                id: createdUserId,
                full_name: cleanName,
                role: invitation.role,
                department: department ? department.trim() : null,
                active: true,
                invitation_id: invitation.id
            });

        if (profileError) {
            await supabase.auth.admin.deleteUser(createdUserId);
            createdUserId = null;
            throw profileError;
        }

        return res.status(201).json({
            success: true,
            message: 'Your staff account has been created. You can now log in.',
            role: invitation.role
        });

    } catch (error) {
        console.error('Staff registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to complete staff registration.'
        });
    }
};


// Get the currently logged-in staff member
exports.getCurrentStaff = async (req, res) => {
    return res.status(200).json({
        success: true,
        staff: req.staff
    });
};



// ======================================
// ADMIN: GET STAFF DIRECTORY
// ======================================

exports.getStaffDirectory = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('staff_profiles')
            .select('id, full_name, role, department, active, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            staff: data || []
        });

    } catch (error) {
        console.error('Staff directory error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to load staff directory.'
        });
    }
};


// ======================================
// ADMIN: UPDATE STAFF MEMBER
// ======================================

exports.updateStaffMember = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { role, department, active } = req.body;

        if (!staffId) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID is required.'
            });
        }

        const updates = {};

        if (role !== undefined) {
            if (!['admin', 'volunteer'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid staff role.'
                });
            }

            updates.role = role;
        }

        if (department !== undefined) {
            updates.department =
                typeof department === 'string' && department.trim()
                    ? department.trim()
                    : null;
        }

        if (active !== undefined) {
            if (typeof active !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'Active status must be true or false.'
                });
            }

            updates.active = active;
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({
                success: false,
                message: 'No changes were supplied.'
            });
        }

        const { data: target, error: targetError } = await supabase
            .from('staff_profiles')
            .select('id, role, active')
            .eq('id', staffId)
            .maybeSingle();

        if (targetError) throw targetError;

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found.'
            });
        }

        // Prevent an Admin from locking themselves out.
        if (
            staffId === req.staff.id &&
            (updates.active === false || updates.role === 'volunteer')
        ) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate or demote your own account.'
            });
        }

        // Protect the last active Admin account.
        const removesActiveAdmin =
            target.role === 'admin' &&
            target.active &&
            (
                updates.role === 'volunteer' ||
                updates.active === false
            );

        if (removesActiveAdmin) {
            const { count, error: countError } = await supabase
                .from('staff_profiles')
                .select('id', {
                    count: 'exact',
                    head: true
                })
                .eq('role', 'admin')
                .eq('active', true);

            if (countError) throw countError;

            if ((count || 0) <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'The last active Admin cannot be demoted or deactivated.'
                });
            }
        }

        const { data: updated, error: updateError } = await supabase
            .from('staff_profiles')
            .update(updates)
            .eq('id', staffId)
            .select('id, full_name, role, department, active, created_at')
            .single();

        if (updateError) throw updateError;

        return res.status(200).json({
            success: true,
            message: 'Staff profile updated.',
            staff: updated
        });

    } catch (error) {
        console.error('Update staff member error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to update staff profile.'
        });
    }
};


// ======================================
// ADMIN: GET STAFF INVITATIONS
// ======================================

exports.getInvitations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('staff_invitations')
            .select('id, role, created_by, expires_at, revoked_at, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            invitations: data || []
        });

    } catch (error) {
        console.error('Get invitations error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to load invitations.'
        });
    }
};


// ======================================
// ADMIN: REVOKE INVITATION
// ======================================

exports.revokeInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;

        const { data, error } = await supabase
            .from('staff_invitations')
            .update({
                revoked_at: new Date().toISOString()
            })
            .eq('id', invitationId)
            .is('revoked_at', null)
            .select('id')
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Active invitation not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Invitation revoked.'
        });

    } catch (error) {
        console.error('Revoke invitation error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to revoke invitation.'
        });
    }
};
