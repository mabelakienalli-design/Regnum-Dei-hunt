const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabaseServer = createClient(
    config.supabase.url,
    config.supabase.secretKey
);

module.exports = supabaseServer;