const router = require('express').Router();
const ctrl = require('../controllers/filter.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/:childId',         ctrl.getFilterConfig);
router.put('/:childId',         ctrl.updateFilterConfig);
router.post('/:childId/block-url',   ctrl.addBlockedUrl);
router.delete('/:childId/block-url', ctrl.removeBlockedUrl);
router.get('/categories',       ctrl.getCategories);

module.exports = router;
