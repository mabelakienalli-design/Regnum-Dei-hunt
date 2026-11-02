const crypto = require('crypto');
const supabaseServer = require('../Config/serverSupabaseConfig');
const QRCode = require('qrcode');
const { sendTicketEmail } = require('./emailService');

const completePayment = async (transaction) => {
    // Confirm that the transaction was successful
    if (transaction.status !== 'success') {
        throw new Error('Payment was not successful');
    }

    // Verify the expected amount and currency
    const expectedAmount =
        Number(process.env.REGISTRATION_FEE) * 100;

    if (
        !Number.isFinite(expectedAmount) ||
        expectedAmount <= 0 ||
        transaction.amount !== expectedAmount ||
        transaction.currency !== 'NGN'
    ) {
        throw new Error('Payment amount or currency mismatch');
    }

    // Get registration information from Paystack metadata
    const registrationNumber =
        transaction.metadata?.registrationNumber;

    if (!registrationNumber || !transaction.reference) {
        throw new Error('Missing payment or registration information');
    }

    // Find the participant
    const { data: participant, error: participantError } =
        await supabaseServer
            .from('participants')
            .select('ticket_token, full_name, email, date_of_birth')
            .eq('registration_number', registrationNumber)
            .maybeSingle();

    if (participantError) {
        throw participantError;
    }

    if (!participant) {
        throw new Error('Participant not found');
    }

    // Avoid generating another ticket
    if (participant.ticket_token) {
        return {
            registrationNumber,
            ticketReady: true
        };
    }

    // Calculate participant's age
    const birthDate = new Date(participant.date_of_birth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
        today.getMonth() - birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
            today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    // Generate a unique ticket token
    const ticketToken = crypto.randomBytes(32).toString('hex');

    // Update payment and ticket information
    const { data, error } = await supabaseServer
        .from('participants')
        .update({
            payment_status: 'paid',
            payment_reference: transaction.reference,
            paid_at: transaction.paid_at || new Date().toISOString(),
            ticket_token: ticketToken,
            ticket_used: false
        })
        .eq('registration_number', registrationNumber)
        .is('ticket_token', null)
        .select('registration_number')
        .maybeSingle();

    if (error) {
        throw error;
    }

    // Another request may have completed the ticket already
    if (!data) {
        return {
            registrationNumber,
            ticketReady: true
        };
    }

    // Generate QR code and attempt to email the ticket
const qrCodeDataUrl = await QRCode.toDataURL(ticketToken);

let emailSent = false;

try {
    await sendTicketEmail(
        participant.email,
        participant.full_name,
        age,
        registrationNumber,
        qrCodeDataUrl
    );

    emailSent = true;

} catch (emailError) {
    console.error('Ticket email sending error:', emailError.message);
}

return {
    registrationNumber,
    ticketReady: true,
    emailSent
};
};

module.exports = completePayment;
