import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Relógio em tempo real com data no formato pt-BR
 */
export default function Relogio({ className = '' }) {
    const [agora, setAgora] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setAgora(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const hora = format(agora, 'HH:mm:ss');
    const data = format(agora, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const dataCapitalizada = data.charAt(0).toUpperCase() + data.slice(1);

    return (
        <div className={`relogio ${className}`}>
            <div className="relogio-hora">{hora}</div>
            <div className="relogio-data">{dataCapitalizada}</div>
        </div>
    );
}
