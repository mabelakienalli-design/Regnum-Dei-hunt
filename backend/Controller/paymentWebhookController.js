const crypto = require('crypto');
const supabaseServer = require('../Config/serverSupabaseConfig');
const QRCode = require('qrcode');
const { sendTicketEmail } = require('../Services/emailService');

//handle paystack webhook
const handlePaystackWebhook = async (req, res) => {
    try {

       // Get Paystack signature
const signature = req.headers['x-paystack-signature'];

// Ensure the original request body is available
if (!Buffer.isBuffer(req.body) || !signature) {
    return res.status(400).json({
        message: 'Invalid webhook request'
    });
}

// Generate signature using the original raw request body
const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

// Compare signatures safely
const receivedSignature = Buffer.from(signature, 'hex');
const calculatedSignature = Buffer.from(hash, 'hex');

if (
    receivedSignature.length !== calculatedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, calculatedSignature)
) {
    return res.status(401).json({
        message: 'Invalid webhook signature'
    });
}

// Convert the verified request body into JSON
const event = JSON.parse(req.body.toString('utf8'));

        console.log('Paystack webhook received:', event);

        //only process successful payments
        if (event.event === 'charge.success' && event.data.status === 'success') {

            // Verify expected payment amount
const expectedAmount =
    Number(process.env.REGISTRATION_FEE) * 100;

// Paystack sends amounts in kobo
if (
    !Number.isFinite(expectedAmount) ||
    expectedAmount <= 0 ||
    event.data.amount !== expectedAmount ||
    event.data.currency !== 'NGN'
) {
    console.error('Payment amount or currency mismatch');

    return res.status(400).json({
        message: 'Payment verification failed'
    });
}

// Verify registration metadata
// const registrationNumber =
//     event.data.metadata?.registrationNumber;

if (!registrationNumber) {
    console.error('Missing registration number in payment metadata');

    return res.status(400).json({
        message: 'Missing registration information'
    });
}

            //get registration number and payment information
            const registrationNumber = event.data.metadata.registrationNumber;
            const paymentReference = event.data.reference;
            const paidAt = event.data.paid_at;

            //check if participant already has a ticket
const { data: existingParticipant, error: existingError } =
    await supabaseServer
        .from('participants')
        .select('ticket_token, full_name, email, date_of_birth')
        .eq('registration_number', registrationNumber)
        .single();

if (existingError) {
    console.error('Error checking existing ticket:', existingError);

    return res.status(500).json({
        message: 'Could not check existing ticket'
    });
}

//if ticket already exists, do not generate another one
if (existingParticipant.ticket_token) {
    console.log('Ticket already exists for:', registrationNumber);

    return res.sendStatus(200);
}

//calculate participant's age
const birthDate = new Date(existingParticipant.date_of_birth);
const today = new Date();

let age = today.getFullYear() - birthDate.getFullYear();

const monthDifference = today.getMonth() - birthDate.getMonth();

if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
) {
    age--;
}

            //generate a unique ticket token
const ticketToken = crypto.randomBytes(32).toString('hex');
//deleted from here
            //update participant payment information
            const { data, error } = await supabaseServer
                .from('participants')
                .update({
    payment_status: 'paid',
    payment_reference: paymentReference,
    paid_at: paidAt,
    ticket_token: ticketToken,
    ticket_used: false
})
                .eq('registration_number', registrationNumber)
                .is('ticket_token', null)
                .select('registration_number, payment_status, payment_reference, paid_at')
                .maybeSingle();

                if (!data && !error) {
    console.log(
        'Ticket already generated or payment already processed:',
        registrationNumber
    );

    return res.sendStatus(200);
}

            if (error) {
                console.error('Supabase payment update error:', error);

                return res.status(500).json({
                    message: 'Could not update payment status'
                });
            }

//generate QR code
const qrCodeDataUrl = await QRCode.toDataURL(ticketToken);

//send ticket email
await sendTicketEmail(
    existingParticipant.email,
    existingParticipant.full_name,
    age,
    registrationNumber,
    qrCodeDataUrl
);

            console.log('Participant payment updated:', data);
        }

        //respond to paystack
        res.sendStatus(200);

    } catch (error) {

        console.error('Webhook error:', error);

        res.sendStatus(500);
    }
};

module.exports = {
    handlePaystackWebhook
};