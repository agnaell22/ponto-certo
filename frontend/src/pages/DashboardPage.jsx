import BaterPontoCard from '../components/BaterPontoCard';
import '../components/BaterPontoCard.css';
import { useJornada } from '../context/JornadaContext';
import { useHorasExtras } from '../hooks/useHorasExtras';

export default function DashboardPage() {
    const { resumoSemanal } = useJornada();
    const { horasExtraFormatado, percentualExtra, limiteAtingido } = useHorasExtras();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Controle sua jornada de trabalho em tempo real</p>
            </div>

            <div className="dashboard-grid">
                {/* Cartão principal de ponto */}
                <div className="dashboard-main">
                    <BaterPontoCard />
                </div>

                {/* Cards laterais */}
                <div className="dashboard-side">
                    {/* Resumo semanal */}
                    <div className="card fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Semana Atual</h3>
                            {resumoSemanal?.ultrapassaLimite && (
                                <span className="badge badge-error">Limite CLT</span>
                            )}
                        </div>

                        {resumoSemanal ? (
                            <>
                                <div className="stat-row">
                                    <span className="text-muted text-sm">Total trabalhado</span>
                                    <span className="font-mono font-bold text-xl">
                                        {resumoSemanal.totalSemanaFormatado}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="text-muted text-sm">Horas extras</span>
                                    <span className="font-mono font-bold text-warning">
                                        {resumoSemanal.horasExtrasSemanaisFormatado}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="text-muted text-sm">Dias trabalhados</span>
                                    <span className="font-bold">{resumoSemanal.diasRegistrados} / 5</span>
                                </div>

                                {/* Barra de progresso semanal */}
                                <div className="progress-bar-wrap mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted">Jornada semanal</span>
                                        <span className="text-muted">{resumoSemanal.percentualJornada}% de 44h</span>
                                    </div>
                                    <div className="progress-track">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${Math.min(100, resumoSemanal.percentualJornada)}%`,
                                                background: resumoSemanal.ultrapassaLimite
                                                    ? 'var(--color-falta)'
                                                    : 'var(--gradient-primary)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="loading-overlay" style={{ minHeight: 80 }}>
                                <div className="spinner" />
                            </div>
                        )}
                    </div>

                    {/* Horas Extras Card */}
                    <div className={`card fade-in-up ${limiteAtingido ? 'card-alert' : ''}`} style={{ animationDelay: '0.2s' }}>
                        <h3 className="text-lg font-bold mb-4">
                            Horas Extras Hoje
                            {limiteAtingido && <span className="badge badge-error" style={{ marginLeft: '0.5rem' }}>Limite CLT!</span>}
                        </h3>
                        <div className="stat-row">
                            <span className="text-muted text-sm">Extras hoje</span>
                            <span className={`font-mono font-bold text-2xl ${limiteAtingido ? 'text-error' : 'text-warning'}`}>
                                {horasExtraFormatado}
                            </span>
                        </div>
                        <div className="progress-bar-wrap mt-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted">Limite diário (2h)</span>
                                <span className="text-muted">{percentualExtra}%</span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${percentualExtra}%`,
                                        background: limiteAtingido ? 'var(--color-falta)' : 'var(--gradient-warning)',
                                    }}
                                />
                            </div>
                        </div>
                        {limiteAtingido && (
                            <p className="text-sm text-error mt-2">
                                ⚠️ Limite de 2h extras/dia atingido (Art. 59 CLT)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
