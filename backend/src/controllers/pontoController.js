const jornadaService = require('../services/jornadaService');
const registroRepository = require('../repositories/registroRepository');

const pontoController = {
    // GET /api/ponto/status — Status do dia atual
    async statusDia(req, res, next) {
        try {
            const status = await jornadaService.obterStatusDia(req.user.id);
            res.json(status);
        } catch (err) {
            next(err);
        }
    },

    // POST /api/ponto/entrada
    async baterEntrada(req, res, next) {
        try {
            const registro = await jornadaService.baterEntrada(req.user.id, req.ip);
            res.status(201).json({ message: 'Entrada registrada', registro });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/ponto/intervalo/inicio
    async iniciarIntervalo(req, res, next) {
        try {
            const registro = await jornadaService.iniciarIntervalo(req.user.id, req.ip);
            res.json({ message: 'Início de intervalo registrado', registro });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/ponto/intervalo/fim
    async finalizarIntervalo(req, res, next) {
        try {
            const registro = await jornadaService.finalizarIntervalo(req.user.id, req.ip);
            res.json({ message: 'Retorno de intervalo registrado', registro });
        } catch (err) {
            next(err);
        }
    },

    // POST /api/ponto/saida
    async baterSaida(req, res, next) {
        try {
            const { horarioManual } = req.body;
            const result = await jornadaService.baterSaida(req.user.id, req.ip, 'MANUAL', horarioManual);
            res.json({ message: 'Saída registrada', ...result });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/ponto/historico
    async historico(req, res, next) {
        try {
            const { page, limit, dataInicio, dataFim } = req.query;
            const result = await registroRepository.findByUserPaginated(req.user.id, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 30,
                dataInicio,
                dataFim,
            });
            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    // GET /api/ponto/semana
    async resumoSemanal(req, res, next) {
        try {
            const resumo = await jornadaService.obterResumaSemanal(req.user.id);
            res.json(resumo);
        } catch (err) {
            next(err);
        }
    },
};

module.exports = pontoController;
