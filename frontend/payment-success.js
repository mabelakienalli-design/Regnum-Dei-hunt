document.addEventListener('DOMContentLoaded', async function () {

    const paymentMessage =
        document.getElementById('paymentMessage');

    const urlParams =
        new URLSearchParams(window.location.search);

    const registrationNumber =
        urlParams.get('regNumber');

    const reference =
        urlParams.get('reference') ||
        urlParams.get('trxref');

    if (!registrationNumber || !reference) {
        paymentMessage.textContent =
            'We could not identify your payment. Please contact the organisers.';

        return;
    }

    paymentMessage.textContent =
        'Confirming your payment... Please wait while we prepare your ticket.';

    try {

        const response = await fetch(
            `/api/payments/verify/${encodeURIComponent(registrationNumber)}?reference=${encodeURIComponent(reference)}`
        );

        const data = await response.json();

        console.log('Payment verification:', data);

        if (
            response.ok &&
            data.paymentStatus === 'paid' &&
            data.ticketReady === true
        ) {
            paymentMessage.textContent =
                'Payment confirmed! Redirecting to your ticket...';

            window.location.href =
                `/ticket.html?regNumber=${encodeURIComponent(registrationNumber)}`;

            return;
        }

        paymentMessage.textContent =
            data.message ||
            'We could not confirm your payment. Please contact the organisers.';

    } catch (error) {

        console.error('Payment verification error:', error);

        paymentMessage.textContent =
            'We could not verify your payment right now. Please refresh this page shortly.';

    }

});