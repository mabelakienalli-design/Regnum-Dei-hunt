require('dotenv').config();

const supabase = require('../Config/serverSupabaseConfig');

async function resetAdminAccount() {
  try {
    const oldEmail = process.env.ADMIN_RESET_EMAIL?.toLowerCase().trim();
    const correctEmail = process.env.CORRECT_ADMIN_EMAIL?.toLowerCase().trim();
    const newPassword = process.env.NEW_ADMIN_PASSWORD;

    if (!oldEmail || !correctEmail || !newPassword) {
      throw new Error('Missing required environment variables.');
    }

    if (newPassword.length < 8) {
      throw new Error('The new password must contain at least 8 characters.');
    }

    // Find both Auth accounts.
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (error) throw error;

    const oldAccount = data.users.find(
      user => user.email?.toLowerCase() === oldEmail
    );

    const correctAccount = data.users.find(
      user => user.email?.toLowerCase() === correctEmail
    );

    if (!oldAccount) {
      throw new Error('Original Admin Auth account was not found.');
    }

    // Confirm the original account really belongs to an Admin.
    const { data: adminProfile, error: adminError } = await supabase
      .from('staff_profiles')
      .select('id, role')
      .eq('id', oldAccount.id)
      .maybeSingle();

    if (adminError) throw adminError;

    if (!adminProfile || adminProfile.role !== 'admin') {
      throw new Error('Original account does not have an Admin profile. No changes made.');
    }

    // Confirm the target email account has no staff profile.
    if (correctAccount) {
      const { data: targetProfile, error: targetError } = await supabase
        .from('staff_profiles')
        .select('id, role')
        .eq('id', correctAccount.id)
        .maybeSingle();

      if (targetError) throw targetError;

      if (targetProfile) {
        throw new Error(
          `The target email belongs to an account with a ${targetProfile.role} staff profile. No account was deleted.`
        );
      }

      console.log('Removing unused Auth account...');

      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        correctAccount.id
      );

      if (deleteError) throw deleteError;

      console.log('Unused Auth account deleted.');
    }

    // Update the original Admin account.
    const { error: updateError } =
      await supabase.auth.admin.updateUserById(oldAccount.id, {
        email: correctEmail,
        password: newPassword,
        email_confirm: true
      });

    if (updateError) throw updateError;

    console.log('----------------------------------');
    console.log('Admin account updated successfully.');
    console.log(`Admin email: ${correctEmail}`);
    console.log('Your original Admin profile was preserved.');
    console.log('----------------------------------');

  } catch (error) {
    console.error('Admin account update failed:', error.message);
    process.exitCode = 1;
  }
}

resetAdminAccount();