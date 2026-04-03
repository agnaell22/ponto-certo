import { useJornada } from '../context/JornadaContext';
import { useCallback } from 'react';

/**
 * Hook customizado para operações de jornada
 * Encapsula lógica de determinação do próximo passo baseado na fase atual
 */
export function useJornadaControles() {
    const { statusDia, loading, error, baterPonto, atualizarStatus } = useJornada();

    const proximaAcao = useCallback(() => {
        if (!statusDia) return null;
        const fase = statusDia.fase;

        const acoes = {
            AGUARDANDO_ENTRADA: { tipo: 'ENTRADA', label: 'Registrar Entrada', cor: 'success' },
            EM_JORNADA: { tipo: 'INICIO_INTERVALO', label: 'Iniciar Intervalo', cor: 'warning' },
            EM_INTERVALO: { tipo: 'FIM_INTERVALO', label: 'Retornar do Intervalo', cor: 'info' },
            RETORNOU_INTERVALO: { tipo: 'SAIDA', label: 'Registrar Saída', cor: 'primary' },
            CONCLUIDO: null,
        };

        return acoes[fase] || null;
    }, [statusDia]);

    const executarProximaAcao = useCallback(async () => {
        const acao = proximaAcao();
        if (!acao) return { success: false, error: 'Jornada já concluída' };
        return await baterPonto(acao.tipo);
    }, [proximaAcao, baterPonto]);

    const faseLabel = {
        AGUARDANDO_ENTRADA: 'Aguardando entrada',
        EM_JORNADA: 'Em jornada',
        EM_INTERVALO: 'Em intervalo',
        RETORNOU_INTERVALO: 'Retornou do intervalo',
        CONCLUIDO: 'Jornada concluída',
    };

    return {
        statusDia,
        loading,
        error,
        proximaAcao: proximaAcao(),
        executarProximaAcao,
        faseLabel: faseLabel[statusDia?.fase] || '',
        emJornada: statusDia?.emJornada || false,
        emIntervalo: statusDia?.emIntervalo || false,
        concluido: statusDia?.concluido || false,
        atualizarStatus,
    };
}
