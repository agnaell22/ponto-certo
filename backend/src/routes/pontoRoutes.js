const router = require('express').Router();
const pontoController = require('../controllers/pontoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas de ponto exigem autenticação
router.use(authMiddleware);

router.get('/status', pontoController.statusDia);
router.get('/historico', pontoController.historico);
router.get('/semana', pontoController.resumoSemanal);
router.post('/entrada', pontoController.baterEntrada);
router.post('/intervalo/inicio', pontoController.iniciarIntervalo);
router.post('/intervalo/fim', pontoController.finalizarIntervalo);
router.post('/saida', pontoController.baterSaida);

module.exports = router;
