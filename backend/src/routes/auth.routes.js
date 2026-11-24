const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authLimiter, otpLimiter } = require('../middleware/ratelimit.middleware');
const auth = require('../middleware/auth.middleware');

router.post('/register',    authLimiter, [body('phone').isMobilePhone(), body('full_name').notEmpty(), body('password').isLength({ min: 6 })], validate, ctrl.register);
router.post('/verify-otp',  otpLimiter,  [body('phone').isMobilePhone(), body('otp').isLength({ min: 6, max: 6 })], validate, ctrl.verifyOtp);
router.post('/login',       authLimiter, [body('phone').isMobilePhone(), body('password').notEmpty()], validate, ctrl.login);
router.post('/refresh',     ctrl.refresh);
router.post('/logout',      auth, ctrl.logout);
router.post('/forgot-pin',  otpLimiter, [body('phone').isMobilePhone()], validate, ctrl.forgotPin);
router.put('/profile',      auth, ctrl.updateProfile);
router.get('/me',           auth, ctrl.getMe);

module.exports = router;
