require('dotenv').config();

const config = {
    port: process.env.PORT || 5000,
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
        secretKey: process.env.SUPABASE_SECRET_KEY
    }
};

module.exports = config;