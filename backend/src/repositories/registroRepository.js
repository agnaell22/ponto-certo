const prisma = require('../lib/prismaClient');

/**
 * Repositório de registros de ponto
 */
const registroRepository = {
    /**
     * Buscar registro do dia atual para o usuário
     */
    async findByUserAndDate(userId, data) {
        return prisma.registroPonto.findUnique({
            where: {
                userId_data: { userId, data },
            },
        });
    },

    /**
     * Criar novo registro de ponto
     */
    async create(userId, data) {
        return prisma.registroPonto.create({
            data: { userId, ...data },
        });
    },

    /**
     * Atualizar registro existente
     */
    async update(id, data) {
        return prisma.registroPonto.update({
            where: { id },
            data,
        });
    },

    /**
     * Buscar histórico paginado do usuário
     */
    async findByUserPaginated(userId, { page = 1, limit = 30, dataInicio, dataFim } = {}) {
        const skip = (page - 1) * limit;

        const where = {
            userId,
            ...(dataInicio && dataFim
                ? { data: { gte: new Date(dataInicio), lte: new Date(dataFim) } }
                : {}),
        };

        const [registros, total] = await Promise.all([
            prisma.registroPonto.findMany({
                where,
                orderBy: { data: 'desc' },
                skip,
                take: limit,
            }),
            prisma.registroPonto.count({ where }),
        ]);

        return {
            registros,
            total,
            paginas: Math.ceil(total / limit),
            paginaAtual: page,
        };
    },

    /**
     * Buscar registros de um período (para cálculo semanal/mensal)
     */
    async findByUserAndPeriod(userId, dataInicio, dataFim) {
        return prisma.registroPonto.findMany({
            where: {
                userId,
                data: {
                    gte: dataInicio,
                    lte: dataFim,
                },
            },
            orderBy: { data: 'asc' },
        });
    },

    /**
     * Buscar registros da semana atual
     */
    async findCurrentWeek(userId) {
        const hoje = new Date();
        const diaDaSemana = hoje.getDay(); // 0=Dom
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - diaDaSemana);
        inicioSemana.setHours(0, 0, 0, 0);

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);

        return prisma.registroPonto.findMany({
            where: {
                userId,
                data: { gte: inicioSemana, lte: fimSemana },
            },
            orderBy: { data: 'asc' },
        });
    },

    /**
     * Upsert: cria ou atualiza registro do dia
     */
    async upsert(userId, data, updateData, createData) {
        return prisma.registroPonto.upsert({
            where: { userId_data: { userId, data } },
            update: updateData,
            create: { userId, data, ...createData },
        });
    },
};

module.exports = registroRepository;
