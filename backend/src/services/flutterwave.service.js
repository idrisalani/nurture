const axios = require('axios');

const fwApi = axios.create({
  baseURL: 'https://api.flutterwave.com/v3',
  headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, 'Content-Type': 'application/json' },
});

exports.initiateCharge = async ({ email, amount, metadata, phone }) => {
  const resp = await fwApi.post('/payments', {
    tx_ref: `NN-${Date.now()}`,
    amount: amount / 100, // Flutterwave uses actual amount, not kobo
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: { email, phone_number: phone },
    meta: metadata,
    redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
  });
  return { payment_url: resp.data.data.link };
};
