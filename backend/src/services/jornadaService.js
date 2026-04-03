const { z } = require('zod');
const registroRepository = require('../repositories/registroRepository');
const logRepository = require('../repositories/logRepository');
const configRepository = require('../repositories/configRepository');
const cltService = require('./cltService');
const { redis } = require('../lib/redisClient');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../lib/logger');

const jornadaService = {
    /**
     * Retorna o registro do dia atual ou cria um vazio
     */
    async obterOuCriarRegistroDia(userId) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        let registro = await registroRepository.findByUserAndDate(userId, hoje);
        if (!registro) {
            registro = await registroRepository.create(userId, { data: hoje });
        }
        return registro;
    },

    /**
     * Bater ponto de entrada
     */
    async baterEntrada(userId, ip, origem = 'MANUAL') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const existente = await registroRepository.findByUserAndDate(userId, hoje);
        if (existente?.entrada) {
            throw new AppError('Entrada já registrada para hoje', 409);
        }

        const agora = new Date();

        const registro = await registroRepository.upsert(
            userId,
            hoje,
            { entrada: agora },
            { entrada: agora }
        );

        await logRepository.create({
            userId,
            registroId: registro.id,
            tipoEvento: 'ENTRADA',
            origem,
            detalhes: { horario: agora.toISOString() },
            ip,
        });

        // Invalidar cache do dia
        await redis.del(redis.jornadaCacheKey(userId, hoje.toISOString().split('T')[0]));

        logger.info(`Entrada registrada: userId=${userId} às ${agora.toISOString()}`);
        return registro;
    },

    /**
     * Bater início de intervalo
     */
    async iniciarIntervalo(userId, ip, origem = 'MANUAL') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const registro = await registroRepository.findByUserAndDate(userId, hoje);
        if (!registro?.entrada) {
            throw new AppError('Entrada não registrada. Registre a entrada primeiro.', 400);
        }
        if (registro.inicioIntervalo) {
            throw new AppError('Intervalo já iniciado', 409);
        }

        const agora = new Date();
        const atualizado = await registroRepository.update(registro.id, {
            inicioIntervalo: agora,
        });

        await logRepository.create({
            userId,
            registroId: registro.id,
            tipoEvento: 'INICIO_INTERVALO',
            origem,
            detalhes: { horario: agora.toISOString() },
            ip,
        });

        await redis.del(redis.jornadaCacheKey(userId, hoje.toISOString().split('T')[0]));

        return atualizado;
    },

    /**
     * Bater fim de intervalo
     */
    async finalizarIntervalo(userId, ip, origem = 'MANUAL') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const registro = await registroRepository.findByUserAndDate(userId, hoje);
        if (!registro?.inicioIntervalo) {
            throw new AppError('Início de intervalo não registrado', 400);
        }
        if (registro.fimIntervalo) {
            throw new AppError('Fim de intervalo já registrado', 409);
        }

        const agora = new Date();
        const config = await configRepository.findByUserId(userId);
        const intervaloMin = config?.intervaloMinimoMinutos || 60;

        const duracaoIntervalo = cltService.calcularDuracaoMinutos(
            registro.inicioIntervalo,
            agora
        );

        // Verificar se o intervalo mínimo foi respeitado
        if (duracaoIntervalo < intervaloMin) {
            logger.warn(
                `Intervalo abaixo do mínimo: userId=${userId} duração=${duracaoIntervalo}min mínimo=${intervaloMin}min`
            );
        }

        const atualizado = await registroRepository.update(registro.id, {
            fimIntervalo: agora,
            intervaloDuracaoMin: duracaoIntervalo,
        });

        await logRepository.create({
            userId,
            registroId: registro.id,
            tipoEvento: 'FIM_INTERVALO',
            origem,
            detalhes: { horario: agora.toISOString(), duracaoMin: duracaoIntervalo },
            ip,
        });

        await redis.del(redis.jornadaCacheKey(userId, hoje.toISOString().split('T')[0]));

        return atualizado;
    },

    /**
     * Bater ponto de saída — calcula horas e extras automaticamente
     */
    async baterSaida(userId, ip, origem = 'MANUAL', horarioManual = null) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const registro = await registroRepository.findByUserAndDate(userId, hoje);
        if (!registro?.entrada) {
            throw new AppError('Entrada não registrada', 400);
        }
        if (registro.saida) {
            throw new AppError('Saída já registrada para hoje', 409);
        }

        const agora = horarioManual ? new Date(horarioManual) : new Date();
        const config = await configRepository.findByUserId(userId);
        const jornadaPadraoMin = config?.jornadaPadraoMinutos || 480;

        // Calcular horas trabalhadas
        const registroComSaida = { ...registro, saida: agora };
        const { horasTrabalhadasMin, intervaloDuracaoMin } =
            cltService.calcularHorasTrabalhadas(registroComSaida);

        // Calcular horas extras
        const { horasExtrasMin } = cltService.calcularHorasExtras(
            horasTrabalhadasMin,
            jornadaPadraoMin
        );

        // Validar intervalo (apenas log/aviso, não bloqueia)
        const validacaoIntervalo = cltService.validarIntervalo(
            horasTrabalhadasMin,
            intervaloDuracaoMin
        );

        if (validacaoIntervalo.violacaoCLT) {
            logger.warn(
                `Violação de intervalo CLT: userId=${userId} ${validacaoIntervalo.mensagem}`
            );
        }

        const atualizado = await registroRepository.update(registro.id, {
            saida: agora,
            horasTrabalhadasMin,
            horasExtrasMin,
            intervaloDuracaoMin,
        });

        await logRepository.create({
            userId,
            registroId: registro.id,
            tipoEvento: 'SAIDA',
            origem,
            detalhes: {
                horario: agora.toISOString(),
                horasTrabalhadasMin,
                horasExtrasMin,
                validacaoIntervalo,
            },
            ip,
        });

        await redis.del(redis.jornadaCacheKey(userId, hoje.toISOString().split('T')[0]));

        return {
            registro: atualizado,
            resumo: {
                horasTrabalhadasFormatado: cltService.formatarMinutos(horasTrabalhadasMin),
                horasExtrasFormatado: cltService.formatarMinutos(horasExtrasMin),
                validacaoIntervalo,
            },
        };
    },

    /**
     * Retorna o status atual da jornada do dia com cache Redis
     */
    async obterStatusDia(userId) {
        const hoje = new Date();
        const dataStr = hoje.toISOString().split('T')[0];
        const cacheKey = redis.jornadaCacheKey(userId, dataStr);

        // Tentar buscar do cache
        const cached = await redis.get(cacheKey);
        if (cached) return cached;

        hoje.setHours(0, 0, 0, 0);
        const registro = await registroRepository.findByUserAndDate(userId, hoje);
        const config = await configRepository.findByUserId(userId);

        const status = this._construirStatusDia(registro, config);

        // Cache por 2 minutos (dados do dia mudam frequentemente)
        await redis.set(cacheKey, status, 120);

        return status;
    },

    /**
     * Constrói o objeto de status do dia com status semântico
     */
    _construirStatusDia(registro, config) {
        if (!registro) {
            return {
                fase: 'AGUARDANDO_ENTRADA',
                entrada: null,
                inicioIntervalo: null,
                fimIntervalo: null,
                saida: null,
                horasTrabalhadasMin: 0,
                horasExtrasMin: 0,
                horasTrabalhadasFormatado: '00:00',
                horasExtrasFormatado: '00:00',
                emJornada: false,
                emIntervalo: false,
                concluido: false,
            };
        }

        let fase = 'AGUARDANDO_ENTRADA';
        if (registro.entrada && !registro.inicioIntervalo && !registro.saida) fase = 'EM_JORNADA';
        else if (registro.inicioIntervalo && !registro.fimIntervalo) fase = 'EM_INTERVALO';
        else if (registro.fimIntervalo && !registro.saida) fase = 'RETORNOU_INTERVALO';
        else if (registro.saida) fase = 'CONCLUIDO';

        // Se saída já foi calculada, usar valores salvos; caso contrário calcular parcial
        let horasTrabalhadasMin = registro.horasTrabalhadasMin || 0;
        let horasExtrasMin = registro.horasExtrasMin || 0;

        if (!registro.saida && registro.entrada) {
            const parcial = cltService.calcularHorasTrabalhadas({
                ...registro,
                saida: new Date(),
            });
            horasTrabalhadasMin = parcial.horasTrabalhadasMin;
            const extra = cltService.calcularHorasExtras(
                horasTrabalhadasMin,
                config?.jornadaPadraoMinutos || 480
            );
            horasExtrasMin = extra.horasExtrasMin;
        }

        return {
            fase,
            entrada: registro.entrada,
            inicioIntervalo: registro.inicioIntervalo,
            fimIntervalo: registro.fimIntervalo,
            saida: registro.saida,
            horasTrabalhadasMin,
            horasExtrasMin,
            horasTrabalhadasFormatado: cltService.formatarMinutos(horasTrabalhadasMin),
            horasExtrasFormatado: cltService.formatarMinutos(horasExtrasMin),
            emJornada: fase === 'EM_JORNADA' || fase === 'RETORNOU_INTERVALO',
            emIntervalo: fase === 'EM_INTERVALO',
            concluido: fase === 'CONCLUIDO',
            status: registro.status,
        };
    },

    /**
     * Relatório semanal com validação CLT
     */
    async obterResumaSemanal(userId) {
        const registros = await registroRepository.findCurrentWeek(userId);
        const resumo = cltService.calcularJornadaSemanal(registros);

        return {
            ...resumo,
            diasRegistrados: registros.length,
            registros: registros.map((r) => ({
                data: r.data,
                horasTrabalhadasFormatado: cltService.formatarMinutos(r.horasTrabalhadasMin),
                horasExtrasFormatado: cltService.formatarMinutos(r.horasExtrasMin),
                status: r.status,
            })),
            totalSemanaFormatado: cltService.formatarMinutos(resumo.totalSemanaMin),
            horasExtrasSemanaisFormatado: cltService.formatarMinutos(resumo.horasExtrasSemanais),
        };
    },
};

module.exports = jornadaService;
