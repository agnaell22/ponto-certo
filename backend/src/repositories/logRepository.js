const prisma = require('../lib/prismaClient');

/**
 * Repositório de logs de eventos
 */
const logRepository = {
    /**
     * Criar log de evento
     */
    async create({ userId, registroId, tipoEvento, origem, detalhes, ip }) {
        return prisma.log.create({
            data: {
                userId,
                registroId: registroId || null,
                tipoEvento,
                origem: origem || 'MANUAL',
                detalhes: detalhes || null,
                ip: ip || null,
            },
        });
    },

    /**
     * Buscar logs do usuário com paginação
     */
    async findByUser(userId, { page = 1, limit = 50, dataInicio, dataFim } = {}) {
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(dataInicio && dataFim
                ? { timestamp: { gte: new Date(dataInicio), lte: new Date(dataFim) } }
                : {}),
        };

        const [logs, total] = await Promise.all([
            prisma.log.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
            prisma.log.count({ where }),
        ]);

        return { logs, total, paginas: Math.ceil(total / limit) };
    },
};

module.exports = logRepository;
