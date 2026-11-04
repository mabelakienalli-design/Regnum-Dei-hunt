const registerForm = document.getElementById('registerForm');
const registerButton = document.getElementById('registerButton');
const invitationMessage = document.getElementById('invitationMessage');
const errorMessage = document.getElementById('errorMessage');

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


// Register staff member
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!invitationValid) {
        errorMessage.textContent = 'Your invitation is not valid.';
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
                password
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Registration failed.');
        }

        invitationMessage.textContent =
            'Your account has been created successfully. You can now log in.';

        registerForm.hidden = true;

    } catch (error) {
        errorMessage.textContent = error.message;
        registerButton.disabled = false;
        registerButton.textContent = 'Create Account';
    }
});


validateInvitation();
