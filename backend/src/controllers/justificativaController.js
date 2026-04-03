const justificativaService = require('../services/justificativaService');
const logger = require('../lib/logger');

const justificativaController = {
    /**
     * Submeter nova justificativa (Upload)
     */
    async submeter(req, res, next) {
        try {
            const { tipo, motivo, dataInicio, dataFim } = req.body;
            const userId = req.user.id;
            const anexoUrl = req.file ? `/uploads/justificativas/${req.file.filename}` : null;

            if (!tipo || !motivo || !dataInicio || !dataFim) {
                return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
            }

            const nova = await justificativaService.submeterJustificativa(userId, {
                tipo,
                motivo,
                dataInicio,
                dataFim,
                anexoUrl
            });

            res.status(201).json(nova);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Listar justificativas do usuário logado
     */
    async listarMe(req, res, next) {
        try {
            const lista = await justificativaService.listarPorUsuario(req.user.id);
            res.json(lista);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Listar pendentes para RH
     */
    async listarPendentes(req, res, next) {
        try {
            // No futuro: middleware de roles para garantir Admin_RH
            const lista = await justificativaService.listarPendentesRH();
            res.json(lista);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Validar justificativa (Ação RH)
     */
    async validar(req, res, next) {
        try {
            const { id } = req.params;
            const { status, acaoRH, observacaoRH } = req.body;

            if (!status || !acaoRH) {
                return res.status(400).json({ error: 'Status e ação do RH são obrigatórios' });
            }

            const resultado = await justificativaService.validarJustificativa(id, req.user.id, {
                status,
                acaoRH,
                observacaoRH
            });

            res.json(resultado);
        } catch (err) {
            next(err);
        }
    }
};

module.exports = justificativaController;
