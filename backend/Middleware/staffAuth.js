const supabase = require('../Config/serverSupabaseConfig');

// Verify that a staff member is logged in
const staffAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the Supabase access token
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired login session.'
            });
        }

        // Retrieve the staff profile belonging to this account
        const { data: staff, error: staffError } = await supabase
            .from('staff_profiles')
            .select('id, full_name, role, department, active')
            .eq('id', user.id)
            .single();

        if (staffError || !staff) {
            return res.status(403).json({
                success: false,
                message: 'You do not have staff access.'
            });
        }

        if (!staff.active) {
            return res.status(403).json({
                success: false,
                message: 'Your staff account has been deactivated.'
            });
        }

        // Make the authenticated user and staff profile available to routes
        req.user = user;
        req.staff = staff;

        next();

    } catch (error) {
        console.error('Staff authentication error:', error);

        return res.status(500).json({
            success: false,
            message: 'An error occurred during authentication.'
        });
    }
};


// Restrict a route to Admins only
const adminOnly = (req, res, next) => {
    if (!req.staff || req.staff.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required.'
        });
    }

    next();
};


module.exports = {
    staffAuth,
    adminOnly
};