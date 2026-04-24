/**
 * CLTService — Motor de Regras Trabalhistas (CLT)
 *
 * Centraliza toda a lógica de conformidade com a Consolidação das Leis do Trabalho.
 * Art. 58, 59, 71, 72, 7º CF/88
 */

// Constantes CLT
const CLT = {
    JORNADA_DIARIA_MIN: 480,       // 8h = 480 minutos
    LIMITE_SEMANAL_MIN: 2640,      // 44h = 2640 minutos
    HORA_EXTRA_MAXIMA_DIA_MIN: 120, // 2h extras/dia (Art. 59)
    INTERVALO_MINIMO_JORNADA_MIN: 360, // Jornadas > 6h exigem intervalo mínimo de 1h (Art. 71)
    INTERVALO_MINIMO_MIN: 60,      // Intervalo mínimo 1h (Art. 71 §1)
    INTERVALO_MINIMO_JORNADA_CURTA_MIN: 240, // Jornadas de 4-6h: intervalo mínimo 15min
    INTERVALO_CURTO_MIN: 15,       // 15 min para jornada 4-6h
    ADICIONAL_HORA_EXTRA: 0.5,     // 50% adicional (Art. 7 XVI CF)
    DSR_HORAS_SEMANA: 44,          // Base de cálculo DSR
};

const cltService = {
    /**
     * Calcula a duração em minutos entre dois horários (Date objects)
     */
    calcularDuracaoMinutos(inicio, fim) {
        if (!inicio || !fim) return 0;
        return Math.floor((new Date(fim) - new Date(inicio)) / 60000);
    },

    /**
     * Calcula total de horas trabalhadas no dia (descontando intervalo)
     *
     * @param {object} registro - RegistroPonto
     * @returns {{ horasTrabalhadasMin: number, intervaloDuracaoMin: number }}
     */
    calcularHorasTrabalhadas(registro) {
        const { entrada, saida, inicioIntervalo, fimIntervalo } = registro;

        if (!entrada || !saida) {
            return { horasTrabalhadasMin: 0, intervaloDuracaoMin: 0 };
        }

        const totalMinutos = this.calcularDuracaoMinutos(entrada, saida);

        let intervaloDuracaoMin = 0;
        if (inicioIntervalo && fimIntervalo) {
            intervaloDuracaoMin = this.calcularDuracaoMinutos(inicioIntervalo, fimIntervalo);
        }

        const horasTrabalhadasMin = Math.max(0, totalMinutos - intervaloDuracaoMin);

        return { horasTrabalhadasMin, intervaloDuracaoMin };
    },

    /**
     * Calcula horas extras do dia
     * CLT Art. 59: máximo 2h extras/dia, mínimo 50% adicional
     *
     * @param {number} horasTrabalhadasMin - Total trabalhado em minutos
     * @param {number} jornadaPadraoMin - Jornada contratual em minutos (default: 480)
     * @returns {{ horasExtrasMin: number, ultrapassaLimite: boolean, adicional: number }}
     */
    calcularHorasExtras(horasTrabalhadasMin, jornadaPadraoMin = CLT.JORNADA_DIARIA_MIN) {
        const excedente = Math.max(0, horasTrabalhadasMin - jornadaPadraoMin);
        const ultrapassaLimite = excedente > CLT.HORA_EXTRA_MAXIMA_DIA_MIN;
        
        // Ponto de alteração: liberar as horas extras reais mesmo se excederem o limite legal (que será apenas alertado)
        const horasExtrasMin = excedente;

        // Valor do adicional (apenas referência, salário calculado fora)
        const adicional = CLT.ADICIONAL_HORA_EXTRA;

        return {
            horasExtrasMin,
            excedenteTotalMin: excedente,
            ultrapassaLimiteLegal: ultrapassaLimite,
            adicionalPercentual: adicional * 100,
        };
    },

    /**
     * Valida se o intervalo está em conformidade com a CLT
     * Art. 71: Jornadas > 6h → mínimo 1h; entre 4h e 6h → mínimo 15min; < 4h → sem obrigação
     *
     * @param {number} horasTrabalhadasMin
     * @param {number} intervaloDuracaoMin
     * @returns {{ conforme: boolean, mensagem: string, intervaloMinimoExigido: number }}
     */
    validarIntervalo(horasTrabalhadasMin, intervaloDuracaoMin) {
        if (horasTrabalhadasMin >= CLT.INTERVALO_MINIMO_JORNADA_MIN) {
            // Jornada > 6h: intervalo obrigatório de no mínimo 1h
            const conforme = intervaloDuracaoMin >= CLT.INTERVALO_MINIMO_MIN;
            return {
                conforme,
                intervaloMinimoExigido: CLT.INTERVALO_MINIMO_MIN,
                mensagem: conforme
                    ? 'Intervalo conforme CLT (Art. 71 §1)'
                    : `Intervalo insuficiente. Mínimo: ${CLT.INTERVALO_MINIMO_MIN}min. Registrado: ${intervaloDuracaoMin}min`,
                violacaoCLT: !conforme,
            };
        }

        if (horasTrabalhadasMin >= CLT.INTERVALO_MINIMO_JORNADA_CURTA_MIN) {
            // Jornada entre 4h-6h: 15min mínimo
            const conforme = intervaloDuracaoMin >= CLT.INTERVALO_CURTO_MIN;
            return {
                conforme,
                intervaloMinimoExigido: CLT.INTERVALO_CURTO_MIN,
                mensagem: conforme
                    ? 'Intervalo conforme CLT (Art. 71 §2)'
                    : `Intervalo insuficiente. Mínimo: ${CLT.INTERVALO_CURTO_MIN}min. Registrado: ${intervaloDuracaoMin}min`,
                violacaoCLT: !conforme,
            };
        }

        // Jornada < 4h: sem obrigação de intervalo
        return {
            conforme: true,
            intervaloMinimoExigido: 0,
            mensagem: 'Jornada abaixo de 4h: intervalo não obrigatório',
            violacaoCLT: false,
        };
    },

    /**
     * Calcula o total de horas da semana e verifica limite CLT
     *
     * @param {RegistroPonto[]} registrosDaSemana
     * @returns {{ totalSemanaMin: number, horasExtrasSemanais: number, ultrapassaLimite: boolean }}
     */
    calcularJornadaSemanal(registrosDaSemana) {
        const totalSemanaMin = registrosDaSemana.reduce((acc, reg) => {
            return acc + (reg.horasTrabalhadasMin || 0);
        }, 0);

        const horasExtrasSemanais = Math.max(0, totalSemanaMin - CLT.LIMITE_SEMANAL_MIN);
        const ultrapassaLimite = totalSemanaMin > CLT.LIMITE_SEMANAL_MIN;

        return {
            totalSemanaMin,
            horasExtrasSemanais,
            ultrapassaLimite,
            limiteSemanalMin: CLT.LIMITE_SEMANAL_MIN,
            percentualJornada: Math.round((totalSemanaMin / CLT.LIMITE_SEMANAL_MIN) * 100),
        };
    },

    /**
     * Calcula DSR (Descanso Semanal Remunerado)
     * CLT Art. 67 — 1 descanso de 24h por semana, preferencialmente domingo
     * Base: salário / 30 * dias descansados por semana
     *
     * @param {number} salarioBruto
     * @param {number} diasTrabalhadosSemana - ex: 5
     * @returns {{ valorDSR: number, diasDSR: number }}
     */
    calcularDSR(salarioBruto, diasTrabalhadosSemana = 5) {
        // Valor dia = salário / 30
        const valorDia = salarioBruto / 30;

        // DSR: proporção do dia útil
        const diasDSR = 7 - diasTrabalhadosSemana;
        const valorDSR = valorDia * diasDSR;

        return {
            valorDSR: Math.round(valorDSR * 100) / 100,
            diasDSR,
            valorDia: Math.round(valorDia * 100) / 100,
        };
    },

    /**
     * Calcula desconto por falta não justificada
     * CLT Art. 131 — falta injustificada desconta dia + DSR proporcional
     *
     * @param {number} salarioBruto
     * @param {number} totalFaltas
     * @returns {{ descontoFaltas: number, descontoDSR: number, totalDesconto: number }}
     */
    calcularDescontoFaltas(salarioBruto, totalFaltas) {
        const valorDia = salarioBruto / 30;
        const descontoFaltas = valorDia * totalFaltas;

        // DSR perdido por faltas (Art. 6 Lei 605/49)
        const semanas = Math.ceil(totalFaltas / 5);
        const descontoDSR = valorDia * semanas;

        return {
            descontoFaltas: Math.round(descontoFaltas * 100) / 100,
            descontoDSR: Math.round(descontoDSR * 100) / 100,
            totalDesconto: Math.round((descontoFaltas + descontoDSR) * 100) / 100,
        };
    },

    /**
     * Formata minutos para string "HH:MM"
     */
    formatarMinutos(minutos) {
        if (!minutos && minutos !== 0) return '--:--';
        const h = Math.floor(Math.abs(minutos) / 60);
        const m = Math.abs(minutos) % 60;
        const sinal = minutos < 0 ? '-' : '';
        return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    /**
     * Retorna as constantes CLT para uso externo
     */
    getConstantes() {
        return { ...CLT };
    },
};

module.exports = cltService;
