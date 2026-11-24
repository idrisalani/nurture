const router = require('express').Router();
const ctrl = require('../controllers/routines.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/:childId',         ctrl.getRoutines);
router.post('/:childId',        ctrl.createRoutine);
router.put('/:childId/:id',     ctrl.updateRoutine);
router.delete('/:childId/:id',  ctrl.deleteRoutine);
router.get('/presets',          ctrl.getPresets);
router.post('/:childId/apply-preset', ctrl.applyPreset);

module.exports = router;
