const bcrypt = require('bcrypt');
const supabase = require('../Config/serverSupabaseConfig');
const jwt = require('jsonwebtoken');

// Create staff
exports.createStaff = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            role
        } = req.body;

        // Check required fields
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Check if staff already exists
        const { data: existingStaff, error: existingStaffError } = await supabase
            .from('staff')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingStaffError) {
            return res.status(500).json({
                message: 'Could not check existing staff'
            });
        }

        if (existingStaff) {
            return res.status(400).json({
                message: 'Staff account already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create staff
        const { data: staff, error: createStaffError } = await supabase
            .from('staff')
            .insert([
                {
                    full_name: fullName,
                    email: email,
                    password: hashedPassword,
                    role: role,
                    is_active: true
                }
            ])
            .select('id, full_name, email, role, is_active, created_at')
            .single();

        if (createStaffError) {
            return res.status(500).json({
                message: 'Staff account creation failed',
                error: createStaffError.message
            });
        }

        res.status(201).json({
            message: 'Staff account created successfully',
            staff: staff
        });

    } catch (error) {
        console.error('Create staff error:', error);

        res.status(500).json({
            message: 'Something went wrong while creating the staff account'
        });
    }
};

// Staff login
exports.loginStaff = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Find staff by email
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (staffError) {
            return res.status(500).json({
                message: 'Could not find staff account'
            });
        }

        // Check if staff exists
        if (!staff) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Check if staff account is active
        if (staff.is_active !== true) {
            return res.status(403).json({
                message: 'Your staff account has been deactivated'
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            staff.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                staffId: staff.id,
                email: staff.email,
                role: staff.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        // Send successful login response
        res.status(200).json({
            message: 'Login successful',
            token: token,
            staff: {
                id: staff.id,
                fullName: staff.full_name,
                email: staff.email,
                role: staff.role
            }
        });

    } catch (error) {
        console.error('Staff login error:', error);

        res.status(500).json({
            message: 'Something went wrong while logging in'
        });
    }
};


// Get registered participants
exports.getParticipants = async (req, res) => {
    try {
        // Check staff role
        if (
            req.staff.role !== 'admin' &&
            req.staff.role !== 'check-in' &&
            req.staff.role !== 'viewer'
        ) {
            return res.status(403).json({
                message: 'You are not authorized to view participants'
            });
        }

        // Get participants from Supabase
        const { data: participants, error } = await supabase
            .from('participants')
            .select(`
                registration_number,
                full_name,
                date_of_birth,
                gender,
                phone,
                email,
                home_church_community,
                tshirt_size,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                message: 'Could not retrieve participants',
                error: error.message
            });
        }

        res.status(200).json({
            message: 'Participants retrieved successfully',
            count: participants.length,
            participants: participants
        });

    } catch (error) {
        console.error('Get participants error:', error);

        res.status(500).json({
            message: 'Something went wrong while retrieving participants'
        });
    }
};