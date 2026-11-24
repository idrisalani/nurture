const paystackSvc = require('../services/paystack.service');
const { sequelize } = require('../config/db.config');
const crypto = require('crypto');

exports.initiatePayment = async (req, res) => {
  const { plan, billing_cycle, payment_method } = req.body;
  const [parents] = await sequelize.query('SELECT * FROM parents WHERE id=$1', { bind: [req.parentId] });
  if (!parents.length) return res.status(404).json({ error: 'Parent not found' });
  const [plans] = await sequelize.query(
    'SELECT * FROM pricing_plans WHERE plan=$1 AND billing_cycle=$2 AND is_active=true',
    { bind: [plan, billing_cycle] }
  );
  if (!plans.length) return res.status(404).json({ error: 'Plan not found' });
  const result = await paystackSvc.initiateCharge({
    email: parents[0].email || `${parents[0].phone.replace('+','')}@nurturenet.ng`,
    amount: plans[0].amount_ngn,
    metadata: { parent_id: req.parentId, plan, billing_cycle },
    payment_method,
  });
  res.json(result);
};

exports.paystackWebhook = async (req, res) => {
  // Verify Paystack signature
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.status(401).send();
  
  const { event, data } = req.body;
  if (event === 'charge.success') {
    const { parent_id, plan, billing_cycle } = data.metadata;
    await sequelize.query(
      `INSERT INTO subscriptions (parent_id, plan, status, provider, amount_ngn, billing_cycle, current_period_start, current_period_end)
       VALUES ($1,$2,'active','paystack',$3,$4,NOW(), NOW() + INTERVAL '1 month')
       ON CONFLICT (parent_id) DO UPDATE SET plan=$2, status='active', current_period_end=NOW() + INTERVAL '1 month'`,
      { bind: [parent_id, plan, data.amount, billing_cycle] }
    );
  }
  res.sendStatus(200);
};

exports.flutterwaveWebhook = async (req, res) => {
  // Verify Flutterwave signature
  const hash = crypto.createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['verif-hash']) return res.status(401).send();
  res.sendStatus(200);
};

exports.getSubscription = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM subscriptions WHERE parent_id=$1', { bind: [req.parentId] });
  res.json(rows[0] || { plan: 'free', status: 'active' });
};

exports.getPaymentHistory = async (req, res) => {
  const [rows] = await sequelize.query(
    'SELECT * FROM payment_transactions WHERE parent_id=$1 ORDER BY initiated_at DESC LIMIT 20',
    { bind: [req.parentId] }
  );
  res.json(rows);
};

exports.cancelSubscription = async (req, res) => {
  await sequelize.query(`UPDATE subscriptions SET status='cancelled', cancelled_at=NOW() WHERE parent_id=$1`, { bind: [req.parentId] });
  res.json({ message: 'Subscription cancelled' });
};

exports.getPlans = async (req, res) => {
  const [rows] = await sequelize.query('SELECT * FROM pricing_plans WHERE is_active=true ORDER BY plan, billing_cycle');
  res.json(rows);
};
