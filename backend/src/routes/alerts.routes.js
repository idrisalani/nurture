const router = require('express').Router();
const ctrl = require('../controllers/alerts.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/',           ctrl.getAlerts);
router.put('/:id/read',   ctrl.markRead);
router.put('/read-all',   ctrl.markAllRead);
router.get('/preferences',ctrl.getPreferences);
router.put('/preferences',ctrl.updatePreferences);

module.exports = router;
