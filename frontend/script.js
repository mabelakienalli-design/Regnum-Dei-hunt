document.addEventListener('DOMContentLoaded', function () {

    const form = document.getElementById('registrationForm');

    const termsAgreement = document.getElementById('termsAgreement');

    const submitButton = document.getElementById('submitButton');

    const continueToPaymentButton =
    document.getElementById('continueToPaymentButton');

const paymentSection =
    document.getElementById('paymentSection');

const paymentSeekerId =
    document.getElementById('paymentSeekerId');

    const payNowButton =
    document.getElementById('payNowButton');

    const dateOfBirth = document.getElementById('dateOfBirth');

    const phone = document.getElementById('phone');

    const emergencyContactPhone =
        document.getElementById('emergencyContactPhone');


    // =========================
    // T&C CHECKBOX
    // =========================

    termsAgreement.addEventListener('change', function () {

        if (termsAgreement.checked) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }

    });


    // =========================
    // AGE VALIDATION
    // =========================

    dateOfBirth.addEventListener('change', function () {

        if (!dateOfBirth.value) {
            return;
        }

        const birthDate = new Date(dateOfBirth.value);

        const today = new Date();

        let age =
            today.getFullYear() - birthDate.getFullYear();

        const monthDifference =
            today.getMonth() - birthDate.getMonth();

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() < birthDate.getDate()
            )
        ) {
            age--;
        }

        if (age < 15 || age > 22) {

            alert(
                'Sorry, REGNUM DEI is only open to participants between 15 and 22 years old.'
            );

            dateOfBirth.value = '';

            return;
        }

    });


    // =========================
// MEDICAL CONDITION CHECK
// =========================

const hasMedicalConditions =
    document.getElementById('hasMedicalConditions');

const medicalConditionGroup =
    document.getElementById('medicalConditionGroup');

const medicalConditions =
    document.getElementById('medicalConditions');


hasMedicalConditions.addEventListener('change', function () {

    if (hasMedicalConditions.value === 'true') {

        medicalConditionGroup.style.display = 'block';

        medicalConditions.required = true;

    } else {

        medicalConditionGroup.style.display = 'none';

        medicalConditions.required = false;

        medicalConditions.value = '';

    }

});


    // =========================
    // FORM SUBMISSION
    // =========================

    form.addEventListener('submit', async function (event) {

        event.preventDefault();


        // =========================
        // PHONE VALIDATION
        // =========================

        const phoneNumber = phone.value.trim();

        const emergencyPhoneNumber =
            emergencyContactPhone.value.trim();


        // PARTICIPANT PHONE

        if (!/^\d{10}$/.test(phoneNumber)) {

            alert(
                'Please enter exactly 10 digits for your phone number after +234.'
            );

            phone.focus();

            return;
        }


        // EMERGENCY CONTACT PHONE

        if (!/^\d{10}$/.test(emergencyPhoneNumber)) {

            alert(
                'Please enter exactly 10 digits for the emergency contact phone number after +234.'
            );

            emergencyContactPhone.focus();

            return;
        }


       // =========================
// =========================
// EMAIL VALIDATION
// =========================

const email = document.getElementById('email');

const emailValue = email.value.trim();

const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


if (!emailValue) {

    alert(
        'Please enter your email address.\n\nExample: example@gmail.com'
    );

    email.focus();

    return;
}


if (!emailPattern.test(emailValue)) {

    alert(
        'Please enter your email in the correct format.\n\nExample: example@gmail.com'
    );

    email.focus();

    return;
}


        // =========================
        // SIGNATURE VALIDATION
        // =========================

        const fullName =
            document.getElementById('fullName').value.trim();

        const signature =
            document.getElementById('signature').value.trim();


        if (
            signature.toLowerCase() !==
            fullName.toLowerCase()
        ) {

            alert(
                'Your signature must match your full name.'
            );

            document.getElementById('signature').focus();

            return;
        }


        // =========================
// SUBMIT REGISTRATION
// =========================
const formData = {

    fullName: fullName,

    dateOfBirth:
        document.getElementById('dateOfBirth').value,

    gender:
        document.getElementById('gender').value,

    phone: phoneNumber,

    email:
        emailValue,

    homeChurchCommunity:
        document.getElementById('homeChurchCommunity').value.trim(),

    tshirtSize:
        document.getElementById('tshirtSize').value,

    emergencyContactName:
        document.getElementById('emergencyContactName').value.trim(),

    relationship:
        document.getElementById('relationship').value,

    emergencyContactPhone:
        emergencyPhoneNumber,

    hasMedicalConditions:
        hasMedicalConditions.value === 'true',

    medicalConditions:
        medicalConditions.value.trim(),

    isOnMedication:
        document.getElementById('isOnMedication').value === 'true',

    bloodGroup:
        document.getElementById('bloodGroup').value,

    allergies:
        document.getElementById('allergies').value.trim(),

    voluntaryParticipation:
        document.getElementById('voluntaryParticipation').checked,

    medicalDisclosure:
        document.getElementById('medicalDisclosure').checked,

    liabilityAcknowledgement:
        document.getElementById('liabilityAcknowledgement').checked,

    photographyConsent:
        document.getElementById('photographyConsent').checked,

    safetyAgreement:
        document.getElementById('safetyAgreement').checked,

    termsAgreement:
        termsAgreement.checked,

    signature:
        signature
};


// =========================
// SEND TO BACKEND
// =========================

try {

    const response = await fetch(
        'http://localhost:5000/api/participants/register',
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(formData)
        }
    );


    const data = await response.json();


    if (!response.ok) {

        alert(
            data.message ||
            'Registration failed. Please try again.'
        );

        return;
    }


    // =========================
// SHOW SUCCESS SECTION
// =========================

const successSection =
    document.getElementById('successSection');

const registrationNumber =
    document.getElementById('registrationNumber');

// Put the actual registration number from the backend
registrationNumber.textContent =
    data.registrationNumber;

// Hide the registration form
form.style.display = 'none';

// Show the success section
successSection.style.display = 'block';


} catch (error) {

    console.error('Registration error:', error);

    alert(
        'We could not connect to the registration server. Please try again.'
    );

}

    });

    // =========================
// CONTINUE TO PAYMENT
// =========================

continueToPaymentButton.addEventListener('click', function () {

    // Hide success section
    successSection.style.display = 'none';

    // Show payment section
    paymentSection.style.display = 'block';

    // Pass the Seeker ID to the payment section
    paymentSeekerId.textContent =
        registrationNumber.textContent;

});

// =========================
// INITIALIZE PAYMENT
// =========================

payNowButton.addEventListener('click', async function () {

    const seekerId =
        registrationNumber.textContent.trim();

    if (!seekerId) {
        alert('Your Seeker ID could not be found. Please try again.');
        return;
    }

    try {

        payNowButton.disabled = true;
        payNowButton.textContent = 'Connecting to payment...';

        const response = await fetch(
            `http://localhost:5000/api/payments/initialize/${seekerId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                'Could not initialize payment. Please try again.'
            );

            payNowButton.disabled = false;
            payNowButton.textContent = 'Pay Registration Fee';

            return;
        }

        // Send seeker to Paystack
        window.location.href = data.authorizationUrl;

    } catch (error) {

        console.error('Payment initialization error:', error);

        alert(
            'We could not connect to the payment server. Please try again.'
        );

        payNowButton.disabled = false;
        payNowButton.textContent = 'Pay Registration Fee';
    }

});

});