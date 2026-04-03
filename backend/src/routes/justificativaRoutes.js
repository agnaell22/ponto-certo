const express = require('express');
const router = express.Router();
const justificativaController = require('../controllers/justificativaController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadJustificativa = require('../middlewares/uploadMiddleware');

// Rotas protegidas por JWT
router.use(authMiddleware);

// Usuário: listar e submeter justificativa
router.get('/me', justificativaController.listarMe);
router.post('/', uploadJustificativa.single('anexo'), justificativaController.submeter);

// RH: listar pendentes e validar
router.get('/pendentes', justificativaController.listarPendentes);
router.post('/:id/validar', justificativaController.validar);

module.exports = router;
