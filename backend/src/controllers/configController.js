const { z } = require('zod');
const configRepository = require('../repositories/configRepository');
const { AppError } = require('../middlewares/errorHandler');

const configSchema = z.object({
    jornadaPadraoMinutos: z.number().min(60).max(600).optional(),
    horarioEntrada: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
    horarioSaida: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
    intervaloMinimoMinutos: z.number().min(15).max(180).optional(),
    toleranciaMinutos: z.number().min(0).max(60).optional(),
    notifAntecedenciaMin: z.number().min(0).max(120).optional(),
    notifHoraExtraMin: z.number().min(5).max(120).optional(),
    diasTrabalho: z.array(z.number().min(0).max(6)).optional(),
}).strict();

const configController = {
    // GET /api/configuracoes
    async obter(req, res, next) {
        try {
            const config = await configRepository.findByUserId(req.user.id);
            if (!config) throw new AppError('Configurações não encontradas', 404);
            res.json(config);
        } catch (err) {
            next(err);
        }
    },

    // PUT /api/configuracoes
    async atualizar(req, res, next) {
        try {
            const validated = configSchema.parse(req.body);
            const config = await configRepository.update(req.user.id, validated);
            res.json({ message: 'Configurações atualizadas', config });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = configController;
