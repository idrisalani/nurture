const router = require('express').Router();
const ctrl = require('../controllers/exammode.controller');
const auth = require('../middleware/auth.middleware');
const { requireBasic } = require('../middleware/subscription.middleware');

router.use(auth, requireBasic);
router.get('/calendar',              ctrl.getExamCalendar);
router.get('/whitelist',             ctrl.getWhitelistedApps);
router.get('/:childId',              ctrl.getExamMode);
router.post('/:childId/activate',    ctrl.activateExamMode);
router.put('/:childId',              ctrl.updateExamMode);
router.delete('/:childId/deactivate',ctrl.deactivateExamMode);

module.exports = router;
