const router = require('express').Router();
const ctrl = require('../controllers/social.controller');
const auth = require('../middleware/auth.middleware');
const { requireBasic } = require('../middleware/subscription.middleware');

router.use(auth, requireBasic);
router.get('/alerts/:childId',  ctrl.getSocialAlerts);
router.get('/keywords',         ctrl.getKeywords);
router.post('/keywords',        ctrl.addKeyword);
router.delete('/keywords/:id',  ctrl.removeKeyword);
router.get('/platforms',        ctrl.getPlatforms);

module.exports = router;
