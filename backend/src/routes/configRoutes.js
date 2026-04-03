const router = require('express').Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', configController.obter);
router.put('/', configController.atualizar);

module.exports = router;
