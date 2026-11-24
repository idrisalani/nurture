const router = require('express').Router();
const ctrl = require('../controllers/payments.controller');
const auth = require('../middleware/auth.middleware');

router.post('/initiate',      auth, ctrl.initiatePayment);
router.post('/webhook/paystack',    ctrl.paystackWebhook);    // no auth — verified by signature
router.post('/webhook/flutterwave', ctrl.flutterwaveWebhook);
router.get('/subscription',   auth, ctrl.getSubscription);
router.get('/history',        auth, ctrl.getPaymentHistory);
router.delete('/cancel',      auth, ctrl.cancelSubscription);
router.get('/plans',          ctrl.getPlans); // public — shown on pricing page

module.exports = router;
