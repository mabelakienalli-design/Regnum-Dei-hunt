document.addEventListener('DOMContentLoaded', function () {

    const paymentMessage =
        document.getElementById('paymentMessage');

    const urlParams =
        new URLSearchParams(window.location.search);

    const registrationNumber =
        urlParams.get('regNumber');

    if (!registrationNumber) {

        paymentMessage.textContent =
            'We could not identify your Seeker ID.';

        return;
    }

    let attempts = 0;

    const maxAttempts = 30;

    const checkPayment = setInterval(async function () {

        attempts++;

        try {

            const response = await fetch(
                `/api/payments/status/${registrationNumber}`
            );

            const data = await response.json();

            console.log(
                'Payment status:',
                data
            );

            if (
                data.paymentStatus === 'paid' &&
                data.ticketReady === true
            ) {

                clearInterval(checkPayment);

                paymentMessage.textContent =
                    'Payment confirmed! Preparing your ticket...';

                window.location.href =
                    `/ticket.html?regNumber=${registrationNumber}`;

                return;
            }

            if (attempts >= maxAttempts) {

                clearInterval(checkPayment);

                paymentMessage.textContent =
                    'Your payment was received, but your ticket is still being prepared. Please wait a moment and refresh this page.';
            }

        } catch (error) {

            console.error(
                'Payment status check error:',
                error
            );

        }

    }, 2000);

});