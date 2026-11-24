const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/devices.controller');
const deviceAuth = require('../middleware/deviceAuth.middleware');
const validate = require('../middleware/validate.middleware');
const { otpLimiter } = require('../middleware/ratelimit.middleware');

// Child's phone redeems the code the parent generated. Public, but rate limited and the code is single use.
router.post('/pair', otpLimiter, [body('code').isLength({ min: 6, max: 6 }).isNumeric(), body('device_name').notEmpty()], validate, ctrl.pair);
router.get('/config', deviceAuth, ctrl.getConfig);
router.post('/heartbeat', deviceAuth, ctrl.heartbeat);
module.exports = router;
