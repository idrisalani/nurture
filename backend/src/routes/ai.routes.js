const router = require('express').Router();
const ctrl = require('../controllers/ai.controller');
const auth = require('../middleware/auth.middleware');
const { requirePro } = require('../middleware/subscription.middleware');
const deviceAuth = require('../middleware/deviceAuth.middleware');

router.post('/scan-message',    deviceAuth, ctrl.scanMessage);  // child device sends message for scan
router.post('/scan-search',     deviceAuth, ctrl.scanSearch);   // child device sends search query
router.get('/threat-log/:childId', auth, requirePro, ctrl.getThreatLog);
router.put('/threat-log/:id/review', auth, requirePro, ctrl.reviewThreat);

module.exports = router;
