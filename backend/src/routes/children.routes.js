const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/children.controller');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(auth);
router.get('/',          ctrl.getChildren);
router.post('/',        [body('full_name').notEmpty()], validate, ctrl.addChild);
router.put('/:id',      [param('id').isUUID()], validate, ctrl.updateChild);
router.delete('/:id',   [param('id').isUUID()], validate, ctrl.deleteChild);
router.get('/:id/summary', ctrl.getChildSummary);
router.post('/:id/pairing-code', [param('id').isUUID()], validate, ctrl.createPairingCode);
router.get('/:id/devices', [param('id').isUUID()], validate, ctrl.getDevices);

module.exports = router;
