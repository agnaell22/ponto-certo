const registroRepository = require('../repositories/registroRepository');
const cltService = require('../services/cltService');

const relatorioController = {
    // GET /api/relatorios/mensal?mes=2024-03
    async mensal(req, res, next) {
        try {
            const { mes } = req.query;
            const dataRef = mes ? new Date(`${mes}-01`) : new Date();

            const inicio = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1);
            const fim = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0, 23, 59, 59);

            const registros = await registroRepository.findByUserAndPeriod(
                req.user.id,
                inicio,
                fim
            );

            // Calcular totais do mês
            const totalTrabalhadoMin = registros.reduce((a, r) => a + (r.horasTrabalhadasMin || 0), 0);
            const totalExtrasMin = registros.reduce((a, r) => a + (r.horasExtrasMin || 0), 0);
            const diasTrabalhados = registros.filter((r) => r.status !== 'FALTA').length;
            const diasFalta = registros.filter((r) => r.status === 'FALTA').length;
            const diasAtestado = registros.filter((r) => r.status === 'ATESTADO').length;

            // Validações CLT
            const violacoesIntervalo = registros.filter((r) => {
                if (!r.horasTrabalhadasMin) return false;
                const val = cltService.validarIntervalo(r.horasTrabalhadasMin, r.intervaloDuracaoMin || 0);
                return val.violacaoCLT;
            }).length;

            res.json({
                periodo: {
                    inicio: inicio.toISOString().split('T')[0],
                    fim: fim.toISOString().split('T')[0],
                },
                totais: {
                    totalTrabalhadoFormatado: cltService.formatarMinutos(totalTrabalhadoMin),
                    totalExtrasFormatado: cltService.formatarMinutos(totalExtrasMin),
                    totalTrabalhadoMin,
                    totalExtrasMin,
                    diasTrabalhados,
                    diasFalta,
                    diasAtestado,
                    violacoesIntervalo,
                },
                registros: registros.map((r) => ({
                    data: r.data,
                    entrada: r.entrada,
                    inicioIntervalo: r.inicioIntervalo,
                    fimIntervalo: r.fimIntervalo,
                    saida: r.saida,
                    horasTrabalhadasFormatado: cltService.formatarMinutos(r.horasTrabalhadasMin),
                    horasExtrasFormatado: cltService.formatarMinutos(r.horasExtrasMin),
                    status: r.status,
                    observacao: r.observacao,
                })),
            });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = relatorioController;
