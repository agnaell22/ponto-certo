const prisma = require('../lib/prismaClient');

/**
 * Repositório de configurações do usuário
 */
const configRepository = {
    /**
     * Buscar configurações do usuário
     */
    async findByUserId(userId) {
        return prisma.configuracao.findUnique({ where: { userId } });
    },

    /**
     * Criar configuração padrão para novo usuário
     */
    async createDefault(userId) {
        return prisma.configuracao.create({
            data: { userId },
        });
    },

    /**
     * Atualizar configurações
     */
    async update(userId, data) {
        return prisma.configuracao.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });
    },
};

module.exports = configRepository;
