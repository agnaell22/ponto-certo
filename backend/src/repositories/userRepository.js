const prisma = require('../lib/prismaClient');

/**
 * Repositório de usuários
 * Abstrai todas as operações de banco relacionadas a User
 */
const userRepository = {
    /**
     * Criar novo usuário
     */
    async create({ nome, email, senha, cargo }) {
        return prisma.user.create({
            data: { nome, email, senha, cargo },
            select: { id: true, nome: true, email: true, cargo: true, createdAt: true },
        });
    },

    /**
     * Buscar por email (inclui senha para autenticação)
     */
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
            include: { configuracao: true },
        });
    },

    /**
     * Buscar por ID (sem senha)
     */
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                ativo: true,
                createdAt: true,
                configuracao: true,
            },
        });
    },

    /**
     * Atualizar dados do usuário
     */
    async update(id, data) {
        return prisma.user.update({
            where: { id },
            data,
            select: { id: true, nome: true, email: true, cargo: true, updatedAt: true },
        });
    },

    /**
     * Verificar se email já existe
     */
    async emailExists(email) {
        const count = await prisma.user.count({ where: { email } });
        return count > 0;
    },
};

module.exports = userRepository;
