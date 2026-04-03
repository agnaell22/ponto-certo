import { useState, useEffect } from 'react';
import { useJornada } from '../context/JornadaContext';

export default function BancoHorasPage() {
    const { status } = useJornada();
    const [saldo, setSaldo] = useState(0); // em minutos

    // Simulação: buscar do backend no futuro
    useEffect(() => {
        setSaldo(125); // Exemplo: +2h 05min
    }, []);

    const formatSaldo = (min) => {
        const h = Math.abs(Math.floor(min / 60));
        const m = Math.abs(min % 60);
        const sinal = min >= 0 ? '+' : '-';
        return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    return (
        <div className="page-container fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Banco de Horas</h1>
                <p className="page-subtitle">Acompanhe seu saldo acumulado conforme a CLT.</p>
            </div>

            <div className="grid-2">
                <div className="card card-glass flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-sm text-subtle uppercase letter-spacing-1 mb-2">Saldo Atual</p>
                    <h2 className={`text-4xl font-bold ${saldo >= 0 ? 'text-success' : 'text-error'}`} style={{ fontSize: '4rem' }}>
                        {formatSaldo(saldo)}
                    </h2>
                    <p className="mt-4 text-sm text-muted">
                        {saldo >= 0
                            ? 'Você possui horas extras para compensar ou receber.'
                            : 'Você possui horas em débito com a empresa.'}
                    </p>
                </div>

                <div className="card card-glass p-6">
                    <h3 className="text-lg font-bold mb-4">Resumo do Mês</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between">
                            <span className="text-muted">Horas Trabalhadas</span>
                            <span className="font-mono">168:00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted">Horas Extras (+)</span>
                            <span className="font-mono text-success">+12:45</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted">Atrasos/Saídas (-)</span>
                            <span className="font-mono text-error">-10:40</span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }} className="flex justify-between font-bold">
                            <span>TOTAL ACUMULADO</span>
                            <span className="text-success">+02:05</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mt-6" style={{ padding: '2rem' }}>
                <h3 className="text-lg font-bold mb-2">📜 Regras de Compensação (CLT)</h3>
                <ul className="text-sm text-muted" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'inside disc' }}>
                    <li>O banco de horas deve ser compensado em no máximo 6 meses (Art. 59 § 2º).</li>
                    <li>O limite máximo de jornada diária é de 10 horas totais.</li>
                    <li>As horas não compensadas no prazo devem ser pagas com o adicional de 50%.</li>
                    <li>Justificativas aprovadas pelo RH podem abonar débitos sem descontar do saldo.</li>
                </ul>
            </div>
        </div>
    );
}
