require('dotenv').config();

const supabase = require('../Config/serverSupabaseConfig');

async function checkAdminEmail() {
    try {
        const oldEmail = process.env.ADMIN_RESET_EMAIL?.trim().toLowerCase();
        const newEmail = process.env.CORRECT_ADMIN_EMAIL?.trim().toLowerCase();

        const { data, error } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
        });

        if (error) throw error;

        for (const email of [oldEmail, newEmail]) {
            const user = data.users.find(
                u => u.email?.toLowerCase() === email
            );

            console.log('\nChecking:', email);

            if (!user) {
                console.log('No Supabase Auth account found.');
                continue;
            }

            const { data: profile, error: profileError } = await supabase
                .from('staff_profiles')
                .select('id, full_name, role, active')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            console.log('Auth account exists.');
            console.log('Staff profile:', profile || 'No staff profile found.');
        }

    } catch (error) {
        console.error('Check failed:', error.message);
    }
}

checkAdminEmail();