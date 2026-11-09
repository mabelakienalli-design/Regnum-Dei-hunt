let supabaseClient;
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const recoveryForm = document.getElementById('recoveryForm');
const recoveryEmail = document.getElementById('recoveryEmail');
const recoveryMessage = document.getElementById('recoveryMessage');
const recoveryButton = document.getElementById('recoveryButton');

async function initializeSupabase() {
    try {
        const response = await fetch('/api/config/supabase');
        if (!response.ok) throw new Error('Unable to load Supabase configuration.');
        const config = await response.json();
        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
    } catch (error) {
        console.error('Supabase initialization error:', error);
        errorMessage.textContent = error.message;
        loginButton.disabled = true;
        recoveryButton.disabled = true;
    }
}

forgotPasswordLink.addEventListener('click', (event) => {
    event.preventDefault();
    recoveryEmail.value = document.getElementById('email').value.trim();
    recoveryForm.hidden = !recoveryForm.hidden;
    recoveryMessage.textContent = '';
});

recoveryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
        recoveryMessage.textContent = 'Password recovery is still initializing. Please try again.';
        return;
    }
    recoveryButton.disabled = true;
    recoveryButton.textContent = 'Sending...';
    recoveryMessage.textContent = '';
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            recoveryEmail.value.trim().toLowerCase(),
            { redirectTo: window.location.origin + '/staff-reset-password.html' }
        );
        if (error) throw error;
        recoveryMessage.textContent = 'If an account exists for this email, a password reset link has been sent. Check your inbox.';
    } catch (error) {
        recoveryMessage.textContent = error.message || 'Unable to send password reset email.';
    } finally {
        recoveryButton.disabled = false;
        recoveryButton.textContent = 'Send Password Reset Link';
    }
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
        errorMessage.textContent = 'Login system is still initializing. Please try again.';
        return;
    }
    errorMessage.textContent = '';
    loginButton.disabled = true;
    loginButton.textContent = 'Signing in...';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Incorrect email or password.');
        const accessToken = data.session.access_token;
        const response = await fetch('/api/staff/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            await supabaseClient.auth.signOut();
            throw new Error(result.message || 'Staff access could not be verified.');
        }
        if (result.staff.role === 'admin') {
            window.location.href = '/admin-dashboard.html';
        } else if (result.staff.role === 'volunteer') {
            window.location.href = '/volunteer-dashboard.html';
        } else {
            await supabaseClient.auth.signOut();
            throw new Error('Your account does not have a valid staff role.');
        }
    } catch (error) {
        errorMessage.textContent = error.message;
        loginButton.disabled = false;
        loginButton.textContent = 'Sign In';
    }
});

initializeSupabase();