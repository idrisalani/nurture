const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const ctrl = require('../controllers/panic.controller');
const auth = require('../middleware/auth.middleware');
const deviceAuth = require('../middleware/deviceAuth.middleware');
const { panicLimiter } = require('../middleware/ratelimit.middleware');

router.post('/trigger',    panicLimiter, deviceAuth, ctrl.triggerPanic); // child device
router.post('/trigger-parent', panicLimiter, auth, [body('child_id').isUUID()], validate, ctrl.triggerPanicAsParent); // parent app
router.get('/contacts',    auth, ctrl.getContacts);
router.post('/contacts',   auth, ctrl.addContact);
router.delete('/contacts/:id', auth, ctrl.removeContact);
router.get('/history',     auth, ctrl.getPanicHistory);

module.exports = router;
