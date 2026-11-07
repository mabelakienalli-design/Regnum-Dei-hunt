const registerForm = document.getElementById('registerForm');
const registerButton = document.getElementById('registerButton');
const invitationMessage = document.getElementById('invitationMessage');
const errorMessage = document.getElementById('errorMessage');

const loginLink = document.getElementById('loginLink');
const emailInput = document.getElementById('email');
const verifyEmailButton = document.getElementById('verifyEmailButton');
const otpVerificationGroup = document.getElementById('otpVerificationGroup');
const emailOtp = document.getElementById('emailOtp');
const confirmEmailButton = document.getElementById('confirmEmailButton');
const emailVerificationMessage = document.getElementById('emailVerificationMessage');

let verificationToken = null;
let verifiedEmail = null;

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

let invitationValid = false;

// Validate invitation
async function validateInvitation() {
    if (!token) {
        invitationMessage.textContent = 'No invitation token was found.';
        return;
    }

    try {
        const response = await fetch('/api/staff/invitations/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Invalid invitation.');
        }

        invitationValid = true;

        const role = result.role === 'admin' ? 'Admin' : 'Volunteer';

        invitationMessage.textContent =
            `Your ${role} invitation is valid. Complete the form to create your account.`;

        registerForm.hidden = false;

    } catch (error) {
        invitationMessage.textContent = error.message;
    }
}

// Request email verification code
verifyEmailButton.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();

    if (!emailInput.checkValidity()) {
        emailVerificationMessage.textContent = 'Please enter a valid email address.';
        return;
    }

    verifyEmailButton.disabled = true;
    verifyEmailButton.textContent = 'Sending code...';
    emailVerificationMessage.textContent = '';

    try {
        const response = await fetch('/api/staff/verify-email/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Unable to send verification code.');
        }

        otpVerificationGroup.hidden = false;
        emailVerificationMessage.textContent =
            'Verification code sent. Please check your email.';

    } catch (error) {
        emailVerificationMessage.textContent = error.message;
    } finally {
        verifyEmailButton.disabled = false;
        verifyEmailButton.textContent = 'Send Verification Code';
    }
});

// Confirm email verification code
confirmEmailButton.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();
    const code = emailOtp.value.trim();

    if (!/^\d{6}$/.test(code)) {
        emailVerificationMessage.textContent = 'Enter the six-digit code.';
        return;
    }

    confirmEmailButton.disabled = true;
    confirmEmailButton.textContent = 'Verifying...';

    try {
        const response = await fetch('/api/staff/verify-email/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Email verification failed.');
        }

        verificationToken = result.verificationToken;
        verifiedEmail = email;

        emailInput.readOnly = true;
        verifyEmailButton.hidden = true;
        otpVerificationGroup.hidden = true;

        emailVerificationMessage.textContent = 'Email verified successfully. You can now create your account.';

    } catch (error) {
        emailVerificationMessage.textContent = error.message;
    } finally {
        confirmEmailButton.disabled = false;
        confirmEmailButton.textContent = 'Confirm Code';
    }
});

// Register staff member
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!invitationValid) {
        errorMessage.textContent = 'Your invitation is not valid.';
        return;
    }

    if (!verificationToken || verifiedEmail !== emailInput.value.trim().toLowerCase()) {
    errorMessage.textContent = 'Please verify your email address first.';
    return;
}

    errorMessage.textContent = '';
    registerButton.disabled = true;
    registerButton.textContent = 'Creating account...';

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const department = document.getElementById('department').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/staff/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
           body: JSON.stringify({
    token,
    fullName,
    email,
    department,
    password,
    verificationToken
})
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Registration failed.');
        }

       invitationMessage.textContent =
    'Your account has been created successfully.';

registerForm.hidden = true;
loginLink.hidden = false;

    } catch (error) {
        errorMessage.textContent = error.message;
        registerButton.disabled = false;
        registerButton.textContent = 'Create Account';
    }
});


validateInvitation();
