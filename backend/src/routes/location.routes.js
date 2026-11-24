const router = require('express').Router();
const ctrl = require('../controllers/location.controller');
const auth = require('../middleware/auth.middleware');
const deviceAuth = require('../middleware/deviceAuth.middleware');

router.post('/update',          deviceAuth, ctrl.updateLocation);   // child device
router.get('/:childId',         auth, ctrl.getCurrentLocation);
router.get('/:childId/history', auth, ctrl.getLocationHistory);
router.get('/places',           auth, ctrl.getSavedPlaces);
router.post('/places',          auth, ctrl.addSavedPlace);
router.delete('/places/:id',    auth, ctrl.deleteSavedPlace);
router.post('/sms-locate',      ctrl.smsLocate);  // SMS "LOCATE" webhook from Termii

module.exports = router;
