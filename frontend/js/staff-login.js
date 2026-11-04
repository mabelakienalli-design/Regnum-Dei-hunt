// Replace these with your Supabase project details.
// Use your Project URL and publishable/anon key.
// NEVER put your service-role or secret key here.

let supabaseClient;

async function initializeSupabase() {
    try {
        const response = await fetch('/api/config/supabase');

        if (!response.ok) {
            throw new Error('Unable to load Supabase configuration.');
        }

        const config = await response.json();

        supabaseClient = window.supabase.createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

    } catch (error) {
        console.error('Supabase initialization error:', error);
        errorMessage.textContent = error.message;
        loginButton.disabled = true;
    }
}

const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');

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
        // Authenticate with Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error('Incorrect email or password.');
        }

        const accessToken = data.session.access_token;

        // Ask the backend to verify the staff profile and role
        const response = await fetch('/api/staff/me', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            await supabaseClient.auth.signOut();
            throw new Error(result.message || 'Staff access could not be verified.');
        }

        // Redirect according to the role stored in the database
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