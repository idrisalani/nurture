const router = require('express').Router();
const ctrl = require('../controllers/prayer.controller');
const auth = require('../middleware/auth.middleware');
const { requireBasic } = require('../middleware/subscription.middleware');

// Prayer times (no auth needed — public API wrapper)
router.get('/times',   ctrl.getPrayerTimes);  // ?city=kano&date=today
router.get('/cities',  ctrl.getNigerianCities);

// Prayer schedule management (auth + basic plan required)
router.use(auth, requireBasic);
router.get('/schedule/:childId',    ctrl.getSchedule);
router.post('/schedule/:childId',   ctrl.saveSchedule);
router.put('/schedule/:childId',    ctrl.updateSchedule);
router.delete('/schedule/:childId', ctrl.deleteSchedule);

module.exports = router;
