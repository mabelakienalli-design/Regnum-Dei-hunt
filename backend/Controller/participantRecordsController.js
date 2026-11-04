
const supabase = require('../Config/serverSupabaseConfig');

// Fields volunteers are permitted to receive.
const volunteerFields = [
    'registration_number',
    'full_name',
    'tshirt_size',
    'payment_status'
];

// Additional fields Admins are permitted to receive.
const adminFields = [
    ...volunteerFields,
    'date_of_birth',
    'gender',
    'phone',
    'email',
    'home_church_community',
    'emergency_contact_name',
    'emergency_contact_phone',
    'relationship',
    'has_medical_conditions',
    'medical_conditions',
    'is_on_medication',
    'medication_details',
    'blood_group',
    'allergies',
    'voluntary_participation',
    'medical_disclosure',
    'liability_acknowledgement',
    'photography_consent',
    'safety_agreement',
    'terms_agreement',
    'signature',
    'created_at',
    'ticket_used',
    'ticket_used_at'
];

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);

    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    if (
        today.getMonth() < birthDate.getMonth() ||
        (
            today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
}

function pickFields(record, fields) {
    const safeRecord = {};

    fields.forEach(field => {
        if (record[field] !== undefined) {
            safeRecord[field] = record[field];
        }
    });

    return safeRecord;
}


// ======================================
// GET ALL PARTICIPANTS + DASHBOARD STATS
// ======================================

exports.getParticipants = async (req, res) => {
    try {
        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 25)
        );

        const offset = (page - 1) * limit;
        const search = String(req.query.search || '').trim();

        // Retrieve participant records.
        let query = supabase
            .from('participants')
            .select(
                'registration_number, full_name, date_of_birth, tshirt_size, payment_status, created_at',
                { count: 'exact' }
            );

        if (search) {
            if (/^RDH-/i.test(search)) {
                query = query.ilike(
                    'registration_number',
                    `%${search}%`
                );
            } else {
                query = query.ilike(
                    'full_name',
                    `%${search}%`
                );
            }
        }

        const {
            data,
            error,
            count
        } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Count statistics independently of the current search.
        const [
            paidResult,
            pendingResult,
            checkedInResult
        ] = await Promise.all([
            supabase
                .from('participants')
                .select('registration_number', {
                    count: 'exact',
                    head: true
                })
                .eq('payment_status', 'paid'),

            supabase
                .from('participants')
                .select('registration_number', {
                    count: 'exact',
                    head: true
                })
                .eq('payment_status', 'pending'),

            supabase
                .from('participants')
                .select('registration_number', {
                    count: 'exact',
                    head: true
                })
                .eq('ticket_used', true)
        ]);

        if (paidResult.error) throw paidResult.error;
        if (pendingResult.error) throw pendingResult.error;
        if (checkedInResult.error) throw checkedInResult.error;

        const participants = (data || []).map(record => {
            const safeRecord = pickFields(
                record,
                volunteerFields
            );

            // Volunteers receive age, never date of birth.
            safeRecord.age = calculateAge(record.date_of_birth);

            return safeRecord;
        });

        return res.status(200).json({
            success: true,
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            participants,

            // Dashboard statistics.
            stats: {
                paid: paidResult.count || 0,
                pending: pendingResult.count || 0,
                checkedIn: checkedInResult.count || 0
            }
        });

    } catch (error) {
        console.error('Participant records error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve participant records.'
        });
    }
};


// ======================================
// GET ONE PARTICIPANT'S FULL RECORD
// ADMIN ONLY
// ======================================

exports.getParticipantDetails = async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        const {
            data,
            error
        } = await supabase
            .from('participants')
            .select('*')
            .eq('registration_number', registrationNumber)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Participant record not found.'
            });
        }

        const participant = pickFields(data, adminFields);

        participant.age = calculateAge(data.date_of_birth);

        return res.status(200).json({
            success: true,
            participant
        });

    } catch (error) {
        console.error('Participant details error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve participant details.'
        });
    }
};


// ======================================
// GET CHECKED-IN SEEKERS
// ADMIN ONLY
// ======================================

exports.getCheckedInParticipants = async (req, res) => {
    try {
        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 25)
        );

        const offset = (page - 1) * limit;

        const {
            data,
            error,
            count
        } = await supabase
            .from('participants')
            .select(`
                registration_number,
                full_name,
                tshirt_size,
                payment_status,
                ticket_used_at
            `, { count: 'exact' })
            .eq('ticket_used', true)
            .order('ticket_used_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            participants: data || []
        });

    } catch (error) {
        console.error('Checked-in participants error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve checked-in seekers.'
        });
    }
};
