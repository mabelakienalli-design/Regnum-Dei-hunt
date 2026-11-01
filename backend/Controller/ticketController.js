const supabase = require('../Config/serverSupabaseConfig');

//verify ticket
const verifyTicket = async (req, res) => {
    try {
        //get ticket token from the URL
        const { ticketToken } = req.params;

        //find participant using their ticket token
        const { data: participant, error } = await supabase
            .from('participants')
            .select(`
                registration_number,
                full_name,
                email,
                payment_status,
                ticket_token,
                ticket_used,
                ticket_used_at
            `)
            .eq('ticket_token', ticketToken)
            .single();

        //check if ticket exists
        if (error || !participant) {
            return res.status(404).json({
                message: 'Invalid ticket'
            });
        }

        //check if payment was completed
        if (participant.payment_status !== 'paid') {
            return res.status(400).json({
                message: 'Ticket payment has not been completed'
            });
        }

        //check if ticket has already been used
        if (participant.ticket_used === true) {
            return res.status(400).json({
                message: 'Ticket has already been used',
                registrationNumber: participant.registration_number,
                ticketUsedAt: participant.ticket_used_at
            });
        }

        //ticket is valid
        //mark ticket as used
const { data: updatedParticipant, error: updateError } = await supabase
    .from('participants')
    .update({
        ticket_used: true,
        ticket_used_at: new Date().toISOString()
    })
    .eq('ticket_token', ticketToken)
    .select(`
        registration_number,
        full_name,
        payment_status,
        ticket_used,
        ticket_used_at
    `)
    .single();

if (updateError) {
    console.error('Error marking ticket as used:', updateError);

    return res.status(500).json({
        message: 'Could not mark ticket as used'
    });
}

//ticket is valid and has now been used
return res.status(200).json({
    message: 'Valid ticket',
    registrationNumber: updatedParticipant.registration_number,
    fullName: updatedParticipant.full_name,
    paymentStatus: updatedParticipant.payment_status,
    ticketUsedAt: updatedParticipant.ticket_used_at
});

    } catch (error) {
        console.error('Ticket verification error:', error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

// get participant ticket
const getTicket = async (req, res) => {
    try {

        // get registration number from the URL
        const { regNumber } = req.params;

        // find participant
        const { data: participant, error } = await supabase
            .from('participants')
            .select(`
                registration_number,
                full_name,
                payment_status,
                ticket_token,
                ticket_used
            `)
            .eq('registration_number', regNumber)
            .single();

        // check if participant exists
        if (error || !participant) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        // check payment
        if (participant.payment_status !== 'paid') {
            return res.status(400).json({
                message: 'Payment has not been completed'
            });
        }

        // check if ticket was generated
        if (!participant.ticket_token) {
            return res.status(404).json({
                message: 'Ticket has not been generated yet'
            });
        }

        // send ticket information
        return res.status(200).json({
            registrationNumber: participant.registration_number,
            fullName: participant.full_name,
            ticketToken: participant.ticket_token,
            ticketUsed: participant.ticket_used
        });

    } catch (error) {

        console.error('Get ticket error:', error);

        return res.status(500).json({
            message: 'Could not retrieve ticket'
        });
    }
};

module.exports = {
    verifyTicket,
    getTicket
};