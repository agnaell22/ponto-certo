const router = require('express').Router();
const relatorioController = require('../controllers/relatorioController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/mensal', relatorioController.mensal);

module.exports = router;
