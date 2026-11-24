const axios = require('axios');

const paystackApi = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
});

exports.initiateCharge = async ({ email, amount, metadata, payment_method }) => {
  const resp = await paystackApi.post('/transaction/initialize', {
    email, amount,  // amount in kobo
    metadata,
    channels: payment_method === 'mobile_money' ? ['mobile_money'] : ['card', 'bank', 'ussd', 'mobile_money'],
    currency: 'NGN',
    callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
  });
  return { payment_url: resp.data.data.authorization_url, reference: resp.data.data.reference };
};

exports.verifyTransaction = async (reference) => {
  const resp = await paystackApi.get(`/transaction/verify/${reference}`);
  return resp.data.data;
};
