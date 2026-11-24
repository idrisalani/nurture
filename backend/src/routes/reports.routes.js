const router = require('express').Router();
const ctrl = require('../controllers/reports.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/:childId/weekly',     ctrl.getWeeklyReport);
router.get('/:childId/monthly',    ctrl.getMonthlyReport);
router.get('/:childId/apps',       ctrl.getAppBreakdown);
router.get('/:childId/blocked',    ctrl.getBlockedAttempts);
router.get('/:childId/export',     ctrl.exportPdf);

module.exports = router;
