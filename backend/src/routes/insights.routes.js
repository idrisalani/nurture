const router = require('express').Router();
const ctrl = require('../controllers/insights.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/:childId/apps',   ctrl.getAppInsights);
router.get('/tips',            ctrl.getDailyTips);   // ?lang=yo

module.exports = router;
