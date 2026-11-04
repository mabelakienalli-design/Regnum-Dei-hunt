
const supabase = require('../Config/serverSupabaseConfig');


// Calculate age without exposing date of birth.
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


// ======================================
// LOOK UP SEEKER BY REGISTRATION NUMBER
// ADMIN AND VOLUNTEER
// ======================================

exports.lookupSeeker = async (req, res) => {
    try {
        const registrationNumber =
            String(req.params.registrationNumber || '').trim();

        if (!registrationNumber) {
            return res.status(400).json({
                success: false,
                message: 'Enter a Seeker ID.'
            });
        }

        const { data, error } = await supabase
            .from('participants')
            .select(`
                registration_number,
                full_name,
                date_of_birth,
                tshirt_size,
                payment_status,
                ticket_used,
                ticket_used_at
            `)
            .eq('registration_number', registrationNumber)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'No seeker was found with that ID.'
            });
        }

        return res.status(200).json({
            success: true,
            seeker: {
                registrationNumber: data.registration_number,
                fullName: data.full_name,
                age: calculateAge(data.date_of_birth),
                tshirtSize: data.tshirt_size,
                paymentStatus: data.payment_status,
                checkedIn: Boolean(data.ticket_used),
                checkedInAt: data.ticket_used_at
            }
        });

    } catch (error) {
        console.error('Seeker lookup error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to look up this seeker.'
        });
    }
};


// ======================================
// CHECK IN USING QR TICKET TOKEN
// ADMIN AND VOLUNTEER
// ======================================

exports.checkInSeeker = async (req, res) => {
    try {
        const { ticketToken } = req.body;

        if (
            typeof ticketToken !== 'string' ||
            !ticketToken.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'A valid ticket QR code is required.'
            });
        }

        const { data, error } = await supabase.rpc(
            'staff_checkin_ticket',
            {
                p_ticket_token: ticketToken.trim(),
                p_staff_id: req.staff.id
            }
        );

        if (error) throw error;

        if (!data || !data.status) {
            throw new Error('Unexpected check-in response.');
        }

        if (data.status === 'invalid') {
            return res.status(404).json({
                success: false,
                status: 'invalid',
                message: 'This ticket is not valid.'
            });
        }

        if (data.status === 'unpaid') {
            return res.status(400).json({
                success: false,
                status: 'unpaid',
                message: 'Payment has not been completed. This seeker cannot be checked in.'
            });
        }

        if (data.status === 'already_used') {
            return res.status(409).json({
                success: false,
                status: 'already_used',
                message: 'This ticket has already been checked in.',
                seeker: {
                    registrationNumber: data.registration_number,
                    fullName: data.full_name,
                    checkedIn: true,
                    checkedInAt: data.ticket_used_at
                }
            });
        }

        return res.status(200).json({
            success: true,
            status: 'checked_in',
            message: 'Seeker successfully checked in.',
            seeker: {
                registrationNumber: data.registration_number,
                fullName: data.full_name,
                age: calculateAge(data.date_of_birth),
                tshirtSize: data.tshirt_size,
                paymentStatus: data.payment_status,
                checkedIn: true,
                checkedInAt: data.ticket_used_at
            }
        });

    } catch (error) {
        console.error('Check-in error:', error);

        return res.status(500).json({
            success: false,
            message: 'The check-in could not be completed.'
        });
    }
};






// ======================================
// MANUAL CHECK-IN USING REGISTRATION NUMBER
// ADMIN AND VOLUNTEER
// ======================================

exports.manualCheckInSeeker = async (req, res) => {
    try {
        const registrationNumber =
            String(req.body.registrationNumber || '').trim();

        if (!registrationNumber) {
            return res.status(400).json({
                success: false,
                message: 'Enter the Seeker ID.'
            });
        }

        const { data, error } = await supabase.rpc(
            'staff_checkin_by_registration_number',
            {
                p_registration_number: registrationNumber,
                p_staff_id: req.staff.id
            }
        );

        if (error) throw error;

        if (!data || !data.status) {
            throw new Error('Unexpected manual check-in response.');
        }

        if (data.status === 'invalid') {
            return res.status(404).json({
                success: false,
                status: 'invalid',
                message: 'No seeker was found with that ID.'
            });
        }

        if (data.status === 'unpaid') {
            return res.status(400).json({
                success: false,
                status: 'unpaid',
                message: 'Payment has not been completed. This seeker cannot be checked in.'
            });
        }

        if (data.status === 'already_used') {
            return res.status(409).json({
                success: false,
                status: 'already_used',
                message: 'This seeker has already been checked in.',
                seeker: {
                    registrationNumber: data.registration_number,
                    fullName: data.full_name,
                    checkedIn: true,
                    checkedInAt: data.ticket_used_at
                }
            });
        }

        return res.status(200).json({
            success: true,
            status: 'checked_in',
            message: 'Seeker successfully checked in manually.',
            seeker: {
                registrationNumber: data.registration_number,
                fullName: data.full_name,
                age: calculateAge(data.date_of_birth),
                tshirtSize: data.tshirt_size,
                paymentStatus: data.payment_status,
                checkedIn: true,
                checkedInAt: data.ticket_used_at
            }
        });

    } catch (error) {
        console.error('Manual check-in error:', error);

        return res.status(500).json({
            success: false,
            message: 'Manual check-in could not be completed.'
        });
    }
};






// ======================================
// REVERSE CHECK-IN
// ADMIN ONLY
// ======================================

exports.reverseCheckIn = async (req, res) => {
    try {
        const registrationNumber =
            String(req.params.registrationNumber || '').trim();

        if (!registrationNumber) {
            return res.status(400).json({
                success: false,
                message: 'Seeker ID is required.'
            });
        }

        const { data, error } = await supabase.rpc(
            'staff_reverse_checkin',
            {
                p_registration_number: registrationNumber,
                p_staff_id: req.staff.id
            }
        );

        if (error) throw error;

        if (data.status === 'not_found') {
            return res.status(404).json({
                success: false,
                message: 'Seeker not found.'
            });
        }

        if (data.status === 'not_checked_in') {
            return res.status(400).json({
                success: false,
                message: 'This seeker has not been checked in.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Check-in successfully reversed.',
            seeker: {
                registrationNumber: data.registration_number,
                fullName: data.full_name,
                checkedIn: false
            }
        });

    } catch (error) {
        console.error('Reverse check-in error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to reverse this check-in.'
        });
    }
};
