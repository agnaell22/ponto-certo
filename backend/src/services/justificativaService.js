const justificativaRepository = require('../repositories/justificativaRepository');
const registroRepository = require('../repositories/registroRepository');
const logger = require('../lib/logger');
const prisma = require('../lib/prismaClient');

const justificativaService = {
    /**
     * Submeter nova justificativa (Usuário)
     */
    async submeterJustificativa(userId, dados) {
        logger.info(`Nova justificativa submetida: userId=${userId} tipo=${dados.tipo}`);
        return justificativaRepository.create({
            userId,
            ...dados
        });
    },

    /**
     * Obter justificativas do usuário logado
     */
    async listarPorUsuario(userId) {
        return justificativaRepository.findByUser(userId);
    },

    /**
     * Listar para o RH (apenas pendentes)
     */
    async listarPendentesRH() {
        return justificativaRepository.findPending();
    },

    /**
     * Validar justificativa (Ação do RH)
     * Art. 473 CLT: Abono ou compensação
     */
    async validarJustificativa(id, rhId, { status, acaoRH, observacaoRH }) {
        const justificativa = await justificativaRepository.findById(id);
        if (!justificativa) throw new Error('Justificativa não encontrada');

        logger.info(`Justificativa validada pelo RH: id=${id} status=${status} acao=${acaoRH}`);

        return await prisma.$transaction(async (tx) => {
            const atualizada = await tx.justificativa.update({
                where: { id },
                data: { status, acaoRH, observacaoRH, updatedAt: new Date() }
            });

            // Se aprovado, aplicar lógica no RegistroPonto ou Banco de Horas
            if (status === 'APROVADO') {
                await this.aplicarDecisaoRH(tx, justificativa, acaoRH);
            }

            return atualizada;
        });
    },

    /**
     * Aplica a decisão do RH aos registros de ponto envolvidos
     */
    async aplicarDecisaoRH(tx, justificativa, acaoRH) {
        const { userId, dataInicio, dataFim } = justificativa;

        // Buscar todos os registros no período (ex: se foi um atestado de 3 dias)
        const registros = await tx.registroPonto.findMany({
            where: {
                userId,
                data: { gte: dataInicio, lte: dataFim }
            }
        });

        for (const reg of registros) {
            if (acaoRH === 'ABONAR') {
                // ABONAR: Define status como ATESTADO (ou similar) e remove faltas/débitos
                await tx.registroPonto.update({
                    where: { id: reg.id },
                    data: {
                        status: justificativa.tipo === 'ATESTADO_MEDICO' ? 'ATESTADO' : 'NORMAL',
                        observacao: `Abonado via justificativa id=${justificativa.id}`
                    }
                });
            } else if (acaoRH === 'COMPENSAR') {
                // COMPENSAR: Mantém débito mas registra que deve ser reposto no Banco de Horas
                // (O motor de Banco de Horas lerá isso no fechamento mensal)
                await tx.registroPonto.update({
                    where: { id: reg.id },
                    data: { observacao: `Compensar via justificativa id=${justificativa.id}` }
                });
            }
        }
    }
};

module.exports = justificativaService;
