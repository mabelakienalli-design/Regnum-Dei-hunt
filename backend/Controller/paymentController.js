const supabaseServer = require('../Config/serverSupabaseConfig');
const axios = require('axios');

// =========================
// INITIALIZE PAYMENT
// =========================

const initializePayment = async (req, res) => {

    try {

        // Get registration number from the URL
        const { regNumber } = req.params;

        console.log(
            'Registration number received:',
            regNumber
        );

        // Find participant in Supabase
        const { data: participant, error } =
            await supabaseServer
                .from('participants')
                .select(
                    'registration_number, full_name, email, payment_status'
                )
                .eq(
                    'registration_number',
                    regNumber
                )
                .maybeSingle();

        if (error) {

            console.error(
                'Supabase error:',
                error
            );

            return res.status(500).json({
                message: 'Could not find participant',
                error: error.message
            });
        }

        if (!participant) {

            return res.status(404).json({
                message: 'Participant not found'
            });
        }

        // Check if participant has already paid
        if (participant.payment_status === 'paid') {

            return res.status(400).json({
                message: 'Payment has already been completed'
            });
        }

        // Convert registration fee from naira to kobo
        const amount =
            Number(process.env.REGISTRATION_FEE) * 100;

        // Send payment request to Paystack
        const response = await axios.post(

            'https://api.paystack.co/transaction/initialize',

            {
                email: participant.email,

                amount: amount,

                callback_url:
                    `http://localhost:5000/payment-success.html?regNumber=${participant.registration_number}`,

                metadata: {
                    registrationNumber:
                        participant.registration_number
                }
            },

            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                    'Content-Type':
                        'application/json'
                }
            }
        );

        // Send Paystack response back to frontend
        res.status(200).json({

            message:
                'Payment initialized successfully',

            authorizationUrl:
                response.data.data.authorization_url,

            reference:
                response.data.data.reference

        });

    } catch (error) {

        console.error(
            'Payment initialization error:',
            error.response?.data ||
            error.message
        );

        res.status(500).json({
            message:
                'Could not initialize payment'
        });
    }
};


// =========================
// CHECK PAYMENT STATUS
// =========================

const checkPaymentStatus = async (req, res) => {

    try {

        const { regNumber } = req.params;

        const { data: participant, error } =
            await supabaseServer
                .from('participants')
                .select(
                    'registration_number, payment_status, ticket_token'
                )
                .eq(
                    'registration_number',
                    regNumber
                )
                .maybeSingle();

        if (error) {

            console.error(
                'Payment status error:',
                error
            );

            return res.status(500).json({
                message:
                    'Could not check payment status'
            });
        }

        if (!participant) {

            return res.status(404).json({
                message:
                    'Participant not found'
            });
        }

        return res.status(200).json({

            paymentStatus:
                participant.payment_status,

            ticketReady:
                !!participant.ticket_token

        });

    } catch (error) {

        console.error(
            'Payment status check error:',
            error
        );

        return res.status(500).json({
            message:
                'Could not check payment status'
        });
    }
};


// =========================
// VERIFY PAYMENT WITH PAYSTACK
// =========================

const completePayment = require('../Services/completePayment');

const verifyPayment = async (req, res) => {
    try {
        const { regNumber } = req.params;
        const { reference } = req.query;

        if (!reference) {
            return res.status(400).json({
                message: 'Payment reference is required'
            });
        }

        // Verify transaction directly with Paystack
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const transaction = response.data.data;

        // Ensure the transaction belongs to this registration
        if (
            transaction.metadata?.registrationNumber !== regNumber
        ) {
            return res.status(400).json({
                message: 'Payment registration does not match'
            });
        }

        const result = await completePayment(transaction);

        return res.status(200).json({
            message: 'Payment verified successfully',
            paymentStatus: 'paid',
            ticketReady: result.ticketReady
        });

    } catch (error) {
        console.error(
            'Payment verification error:',
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: 'Could not verify payment'
        });
    }
};


// =========================
// EXPORT
// =========================

module.exports = {
    initializePayment,
    checkPaymentStatus,
    verifyPayment
};