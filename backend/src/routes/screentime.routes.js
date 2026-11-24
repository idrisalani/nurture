const router = require('express').Router();
const ctrl = require('../controllers/screentime.controller');
const auth = require('../middleware/auth.middleware');
const deviceAuth = require('../middleware/deviceAuth.middleware');

router.get('/:childId',     auth, ctrl.getLimits);
router.put('/:childId',     auth, ctrl.updateLimits);
router.post('/pause',       auth, ctrl.pauseInternet);
router.post('/resume',      auth, ctrl.resumeInternet);
router.get('/:childId/usage', auth, ctrl.getUsage);
router.post('/sync',        deviceAuth, ctrl.syncUsage);   // child device posts usage data
router.get('/check/:childId', deviceAuth, ctrl.checkAllowed); // child device checks if allowed

module.exports = router;
