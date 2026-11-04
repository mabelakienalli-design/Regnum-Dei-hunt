const supabase = require('../Config/serverSupabaseConfig');

const createInitialAdmin = async () => {
    try {
        const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
        const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

        if (!fullName || !email || !password) {
            throw new Error(
                'Set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in your .env file.'
            );
        }

        if (password.length < 10) {
            throw new Error('Admin password must contain at least 10 characters.');
        }

        // Prevent accidental creation of another initial Admin
        const { data: existingAdmins, error: checkError } = await supabase
            .from('staff_profiles')
            .select('id')
            .eq('role', 'admin')
            .limit(1);

        if (checkError) throw checkError;

        if (existingAdmins.length > 0) {
            throw new Error(
                'An Admin account already exists. Initial Admin setup cannot run again.'
            );
        }

        // Create the Admin's Supabase Auth account
        const { data: authData, error: authError } =
            await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName
                }
            });

        if (authError) throw authError;

        // Create the corresponding staff profile
        const { error: profileError } = await supabase
            .from('staff_profiles')
            .insert({
                id: authData.user.id,
                full_name: fullName,
                role: 'admin',
                department: 'Administration',
                active: true,
                invitation_id: null
            });

        if (profileError) {
            // Remove the Auth account if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        console.log('Initial Admin account created successfully.');
        console.log(`Admin email: ${email}`);

    } catch (error) {
        console.error('Initial Admin setup failed:', error.message);
        process.exitCode = 1;
    }
};

createInitialAdmin();