import { useState, useEffect } from 'react';
import { useJornada } from '../context/JornadaContext';

const CLT_HORA_EXTRA_MAX = 120; // 2h em minutos

/**
 * Hook para controle de horas extras
 */
export function useHorasExtras() {
    const { statusDia } = useJornada();
    const [alertaHoraExtra, setAlertaHoraExtra] = useState(false);
    const [minutosExtra, setMinutosExtra] = useState(0);

    useEffect(() => {
        if (!statusDia) return;
        const extras = statusDia.horasExtrasMin || 0;
        setMinutosExtra(extras);
        setAlertaHoraExtra(extras >= CLT_HORA_EXTRA_MAX);
    }, [statusDia]);

    const percentualExtra = Math.min(100, Math.round((minutosExtra / CLT_HORA_EXTRA_MAX) * 100));
    const horasExtraFormatado = statusDia?.horasExtrasFormatado || '00:00';

    return {
        minutosExtra,
        horasExtraFormatado,
        percentualExtra,
        alertaHoraExtra,
        limiteAtingido: minutosExtra >= CLT_HORA_EXTRA_MAX,
    };
}
