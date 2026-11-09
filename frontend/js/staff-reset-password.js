let supabaseClient;
const resetForm = document.getElementById('resetForm');
const resetMessage = document.getElementById('resetMessage');
const resetButton = document.getElementById('resetButton');

async function initializeSupabase() {
    try {
        const response = await fetch('/api/config/supabase');
        if (!response.ok) throw new Error('Unable to load Supabase configuration.');
        const config = await response.json();
        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
    } catch (error) {
        resetMessage.textContent = error.message;
        resetButton.disabled = true;
    }
}

resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = document.getElementById('newPassword').value;
    const confirmation = document.getElementById('confirmPassword').value;
    if (password.length < 10) {
        resetMessage.textContent = 'Your password must be at least 10 characters long.';
        return;
    }
    if (password !== confirmation) {
        resetMessage.textContent = 'The passwords do not match.';
        return;
    }
    if (!supabaseClient) {
        resetMessage.textContent = 'Please wait for the reset page to finish loading.';
        return;
    }
    resetButton.disabled = true;
    resetButton.textContent = 'Updating...';
    try {
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw error;
        resetMessage.textContent = 'Your password has been updated. You can now sign in.';
        resetForm.hidden = true;
    } catch (error) {
        resetMessage.textContent = error.message || 'Unable to update your password. Request a new reset link.';
        resetButton.disabled = false;
        resetButton.textContent = 'Update Password';
    }
});

initializeSupabase();