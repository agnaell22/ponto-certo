const cron = require('node-cron');
const configRepository = require('../repositories/configRepository');
const registroRepository = require('../repositories/registroRepository');
const jornadaService = require('./jornadaService');
const logRepository = require('../repositories/logRepository');
const logger = require('../lib/logger');
const prisma = require('../lib/prismaClient');

/**
 * NotificacaoService — Agendador e motor de notificações
 *
 * Executa verificações a cada minuto para:
 * 1. Notificar usuário antes de horários previstos
 * 2. Auto-registrar pontos caso usuário não responda
 * 3. Verificar horas extras em andamento
 */

// Estado em memória para controlar adiamentos de intervalo
// Em produção com múltiplas instâncias, usar Redis para isso
const estadoNotificacoes = new Map();
// Estrutura: { userId: { intervaloAdiado: bool, contadorHoraExtra: number } }

const notificacaoService = {
    /**
     * Inicializa todos os cron jobs
     */
    agendarNotificacoes() {
        // A cada minuto: verificar necessidade de notificações e auto-registros
        cron.schedule('* * * * *', async () => {
            try {
                await notificacaoService.verificarJornadasAtivas();
            } catch (err) {
                logger.error('Erro no cron de notificações:', err);
            }
        });

        logger.info('Cron jobs de notificação iniciados (intervalo: 1 min)');
    },

    /**
     * Verifica todos os usuários com jornada ativa e dispara ações necessárias
     */
    async verificarJornadasAtivas() {
        const agora = new Date();
        const hoje = new Date(agora);
        hoje.setHours(0, 0, 0, 0);

        // Buscar todos os usuários ativos com configuração
        const configuracoes = await prisma.configuracao.findMany({
            include: { user: { select: { id: true, nome: true, ativo: true } } },
        });

        for (const config of configuracoes) {
            if (!config.user.ativo) continue;
            const userId = config.user.id;

            try {
                await notificacaoService.processarUsuario(userId, config, agora, hoje);
            } catch (err) {
                logger.error(`Erro ao processar notificação para userId=${userId}:`, err.message);
            }
        }
    },

    /**
     * Processa as notificações e auto-registros para um único usuário
     */
    async processarUsuario(userId, config, agora, hoje) {
        const registro = await registroRepository.findByUserAndDate(userId, hoje);
        const diasTrabalho = config.diasTrabalho || [1, 2, 3, 4, 5];
        const diaSemana = agora.getDay();

        if (!diasTrabalho.includes(diaSemana)) return;

        const antecedenciaMin = config.notifAntecedenciaMin || 15;

        // Parser de HH:MM para Date do dia atual
        const parseHorario = (hhmm) => {
            const [h, m] = hhmm.split(':').map(Number);
            const d = new Date(agora);
            d.setHours(h, m, 0, 0);
            return d;
        };

        const horarioEntrada = parseHorario(config.horarioEntrada || '08:00');
        const horarioAlmoco = parseHorario(config.horarioEntrada || '08:00');
        horarioAlmoco.setMinutes(horarioAlmoco.getMinutes() + (config.jornadaPadraoMinutos || 480) / 2);
        const horarioSaida = parseHorario(config.horarioSaida || '17:00');

        // ── Estado do usuário
        if (!estadoNotificacoes.has(userId)) {
            estadoNotificacoes.set(userId, { intervaloAdiado: false, contadorHoraExtra: 0 });
        }
        const estado = estadoNotificacoes.get(userId);

        // ── 1. Entrada não registrada
        if (!registro?.entrada) {
            const diff = Math.floor((agora - horarioEntrada) / 60000);

            if (diff >= -antecedenciaMin && diff < 0) {
                // Notificar X minutos antes
                await notificacaoService.criarEventoNotificacao(userId, 'ENTRADA', 'pre_entrada', diff, null);
            } else if (diff >= 0 && diff <= 30) {
                // Horário de entrada passou e nada registrado — auto-registro após 0-30min de espera
                if (diff === 15) {
                    // Auto-registrar entrada 15min após horário configurado
                    logger.info(`Auto-registro de ENTRADA: userId=${userId}`);
                    await jornadaService.baterEntrada(userId, 'system', 'AUTOMATICO');
                    await logRepository.create({
                        userId,
                        tipoEvento: 'AUTO_REGISTRO',
                        origem: 'SISTEMA',
                        detalhes: { tipo: 'entrada', motivo: 'usuario_nao_respondeu' },
                    });
                }
            }
            return; // Entrada não registrada: demais verificações não se aplicam
        }

        // ── 2. Intervalo
        if (!registro.inicioIntervalo && !registro.saida) {
            const diff = Math.floor((agora - horarioAlmoco) / 60000);

            if (diff >= -antecedenciaMin && diff < 0) {
                await notificacaoService.criarEventoNotificacao(userId, 'INICIO_INTERVALO', 'pre_intervalo', diff, registro.id);
            } else if (diff >= 0) {
                if (!estado.intervaloAdiado) {
                    // Permitir adiamento de até 1h (configAdd = 60min máximo)
                    if (diff < 60) {
                        // Notificar que está atrasado
                        await notificacaoService.criarEventoNotificacao(userId, 'INICIO_INTERVALO', 'intervalo_atrasado', diff, registro.id);
                        // Marcar adiado na primeira vez
                        if (diff === 0) estado.intervaloAdiado = true;
                    } else {
                        // Passou 1h sem iniciar — auto-registrar
                        logger.info(`Auto-registro de INICIO_INTERVALO: userId=${userId}`);
                        await jornadaService.iniciarIntervalo(userId, 'system', 'AUTOMATICO');
                    }
                } else {
                    // Intervalo já adiado — sem segunda chance, auto-iniciar após 1h do horário original
                    if (diff >= 30) {
                        logger.info(`Auto-registro de INICIO_INTERVALO (pós-adiamento): userId=${userId}`);
                        await jornadaService.iniciarIntervalo(userId, 'system', 'AUTOMATICO');
                    }
                }
            }
        }

        // ── 3. Retorno do intervalo (fim de intervalo)
        if (registro.inicioIntervalo && !registro.fimIntervalo && !registro.saida) {
            const intervaloMin = config.intervaloMinimoMinutos || 60;
            const retornoPrevisto = new Date(registro.inicioIntervalo);
            retornoPrevisto.setMinutes(retornoPrevisto.getMinutes() + intervaloMin);

            const diff = Math.floor((agora - retornoPrevisto) / 60000);

            if (diff >= -antecedenciaMin && diff < 0) {
                await notificacaoService.criarEventoNotificacao(userId, 'FIM_INTERVALO', 'pre_retorno', diff, registro.id);
            } else if (diff >= 30) {
                // 30min após retorno previsto sem registro — auto-registrar retorno
                logger.info(`Auto-registro de FIM_INTERVALO: userId=${userId}`);
                await jornadaService.finalizarIntervalo(userId, 'system', 'AUTOMATICO');
            }
        }

        // ── 4. Saída
        if (!registro.saida && !registro.inicioIntervalo) {
            const diff = Math.floor((agora - horarioSaida) / 60000);

            if (diff >= -antecedenciaMin && diff < 0) {
                await this.criarEventoNotificacao(userId, 'SAIDA', 'pre_saida', diff, registro.id);
            }

            // ── 5. Horas extras em andamento
            if (diff > 0) {
                const intervaloHoraExtra = config.notifHoraExtraMin || 30;
                estado.contadorHoraExtra++;

                if (estado.contadorHoraExtra >= intervaloHoraExtra) {
                    await notificacaoService.criarEventoNotificacao(userId, 'HORA_EXTRA_INICIO', 'verificar_hora_extra', diff, registro.id);
                    estado.contadorHoraExtra = 0; // Reset contador
                }
            }
        }
    },

    /**
     * Cria um registro de log de evento de notificação
     */
    async criarEventoNotificacao(userId, tipoEvento, subtipo, diffMin, registroId) {
        try {
            await logRepository.create({
                userId,
                registroId: registroId || null,
                tipoEvento: 'NOTIFICACAO_ENVIADA',
                origem: 'SISTEMA',
                detalhes: { tipoEvento, subtipo, minutosAteEvento: diffMin },
            });
        } catch (err) {
            logger.error(`Erro ao criar log de notificação: ${err.message}`);
        }
    },

    /**
     * Registrar que usuário confirmou parada de hora extra
     * @param {string} userId
     * @param {string} horarioParada - ISO string opcional
     */
    async confirmarParadaHoraExtra(userId, registroId, horarioParada) {
        const horario = horarioParada ? new Date(horarioParada) : new Date();

        await registroRepository.update(registroId, { saida: horario });

        await logRepository.create({
            userId,
            registroId,
            tipoEvento: 'HORA_EXTRA_FIM',
            origem: 'MANUAL',
            detalhes: { horarioParada: horario.toISOString() },
        });

        // Reset contador de hora extra
        if (estadoNotificacoes.has(userId)) {
            estadoNotificacoes.get(userId).contadorHoraExtra = 0;
        }
    },
};

module.exports = notificacaoService;
