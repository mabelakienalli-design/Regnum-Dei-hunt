const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./Config/config');

const participantRoutes = require('./Route/participantRoute');
const paymentRoutes = require('./Route/paymentRoute')
const paymentWebhookRoutes = require('./Route/paymentWebhookRoute');
const ticketRoutes = require('./Route/ticketRoute');
const staffRoutes = require('./Route/staffRoute');

const app = express();
app.use(cors({
    origin: 'http://localhost:3000'
}));

// Paystack webhook must receive the original raw request body
app.use(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    paymentWebhookRoutes
);

// Parse JSON for all other routes
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/participants', participantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/staff', staffRoutes);

app.get('/', (req, res) => {
    res.send('REGNUM DEI Hunt API is running');
});


app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});
