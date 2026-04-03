const prisma = require('../lib/prismaClient');

const justificativaRepository = {
    async create(data) {
        return prisma.justificativa.create({
            data: {
                userId: data.userId,
                tipo: data.tipo,
                motivo: data.motivo,
                anexoUrl: data.anexoUrl,
                dataInicio: new Date(data.dataInicio),
                dataFim: new Date(data.dataFim),
                status: 'PENDENTE'
            }
        });
    },

    async findById(id) {
        return prisma.justificativa.findUnique({
            where: { id },
            include: { user: { select: { nome: true, email: true } } }
        });
    },

    async findByUser(userId) {
        return prisma.justificativa.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    },

    async findPending() {
        return prisma.justificativa.findMany({
            where: { status: 'PENDENTE' },
            include: { user: { select: { nome: true, email: true, cargo: true } } },
            orderBy: { createdAt: 'asc' }
        });
    },

    async updateStatus(id, { status, acaoRH, observacaoRH }) {
        return prisma.justificativa.update({
            where: { id },
            data: {
                status,
                acaoRH,
                observacaoRH,
                updatedAt: new Date()
            }
        });
    },

    async confirmarRecebimento(id) {
        return prisma.justificativa.update({
            where: { id },
            data: { confirmadoUser: true }
        });
    }
};

module.exports = justificativaRepository;
