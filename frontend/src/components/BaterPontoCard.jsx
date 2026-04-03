import { useState } from 'react';
import { useJornadaControles } from '../hooks/useJornada';
import { useHorasExtras } from '../hooks/useHorasExtras';
import Relogio from './Relogio';

const FASE_CONFIG = {
    AGUARDANDO_ENTRADA: { cor: 'var(--color-entrada)', emoji: '🟢', pulso: false },
    EM_JORNADA: { cor: 'var(--color-primary)', emoji: '💼', pulso: true },
    EM_INTERVALO: { cor: 'var(--color-intervalo)', emoji: '☕', pulso: true },
    RETORNOU_INTERVALO: { cor: 'var(--color-retorno)', emoji: '🔄', pulso: true },
    CONCLUIDO: { cor: 'var(--color-saida)', emoji: '✅', pulso: false },
};

export default function BaterPontoCard() {
    const { statusDia, loading, error, proximaAcao, executarProximaAcao, faseLabel } = useJornadaControles();
    const { horasExtraFormatado, alertaHoraExtra } = useHorasExtras();
    const [processando, setProcessando] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const fase = statusDia?.fase || 'AGUARDANDO_ENTRADA';
    const faseConf = FASE_CONFIG[fase] || FASE_CONFIG.AGUARDANDO_ENTRADA;

    const handleBaterPonto = async () => {
        if (processando || !proximaAcao) return;
        setProcessando(true);
        setFeedback(null);

        const result = await executarProximaAcao();

        if (result.success) {
            setFeedback({ tipo: 'sucesso', msg: 'Ponto registrado com sucesso!' });
        } else {
            setFeedback({ tipo: 'erro', msg: result.error });
        }
        setProcessando(false);
        setTimeout(() => setFeedback(null), 4000);
    };

    if (loading && !statusDia) {
        return (
            <div className="card bater-ponto-card loading-overlay">
                <div className="spinner" /> Carregando jornada...
            </div>
        );
    }

    return (
        <div className="card card-glass bater-ponto-card fade-in-up" style={{ '--fase-cor': faseConf.cor }}>
            {/* Indicador de fase */}
            <div className="bater-ponto-header">
                <div className="fase-indicator">
                    {faseConf.pulso && <span className="pulse-dot" />}
                    <span className="fase-emoji">{faseConf.emoji}</span>
                    <span className="fase-label">{faseLabel}</span>
                </div>
                {alertaHoraExtra && (
                    <div className="badge badge-error">
                        ⚡ {horasExtraFormatado} extras
                    </div>
                )}
            </div>

            {/* Relógio */}
            <Relogio className="bater-ponto-relogio" />

            {/* Horas trabalhadas do dia */}
            {statusDia && (
                <div className="horas-dia">
                    <div className="horas-item">
                        <span className="horas-label">Trabalhadas</span>
                        <span className="horas-valor font-mono">
                            {statusDia.horasTrabalhadasFormatado || '00:00'}
                        </span>
                    </div>
                    {(statusDia.horasExtrasMin || 0) > 0 && (
                        <div className="horas-item">
                            <span className="horas-label">Extras</span>
                            <span className="horas-valor font-mono text-warning">
                                {statusDia.horasExtrasFormatado}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline de pontos */}
            {statusDia && (
                <div className="ponto-timeline">
                    <TimelineItem
                        label="Entrada"
                        hora={statusDia.entrada}
                        ativo={!!statusDia.entrada}
                        cor="var(--color-entrada)"
                    />
                    <div className="timeline-connector" />
                    <TimelineItem
                        label="Intervalo"
                        hora={statusDia.inicioIntervalo}
                        ativo={!!statusDia.inicioIntervalo}
                        cor="var(--color-intervalo)"
                    />
                    <div className="timeline-connector" />
                    <TimelineItem
                        label="Retorno"
                        hora={statusDia.fimIntervalo}
                        ativo={!!statusDia.fimIntervalo}
                        cor="var(--color-retorno)"
                    />
                    <div className="timeline-connector" />
                    <TimelineItem
                        label="Saída"
                        hora={statusDia.saida}
                        ativo={!!statusDia.saida}
                        cor="var(--color-saida)"
                    />
                </div>
            )}

            {/* Feedback */}
            {feedback && (
                <div className={`feedback-msg ${feedback.tipo}`}>
                    {feedback.tipo === 'sucesso' ? '✅' : '❌'} {feedback.msg}
                </div>
            )}

            {/* Botão de ação */}
            {proximaAcao ? (
                <button
                    className={`btn btn-${proximaAcao.cor === 'success' ? 'success' : proximaAcao.cor === 'warning' ? 'warning' : 'primary'} btn-xl w-full bater-ponto-btn`}
                    onClick={handleBaterPonto}
                    disabled={processando}
                    id={`btn-${proximaAcao.tipo.toLowerCase()}`}
                >
                    {processando ? (
                        <><div className="spinner" /> Registrando...</>
                    ) : (
                        proximaAcao.label
                    )}
                </button>
            ) : (
                <div className="jornada-concluida">
                    ✅ Jornada concluída. Até amanhã!
                </div>
            )}

            {error && <p className="form-error mt-2">{error}</p>}
        </div>
    );
}

function TimelineItem({ label, hora, ativo, cor }) {
    const formatHora = (dt) => {
        if (!dt) return '--:--';
        return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`timeline-item ${ativo ? 'ativo' : ''}`} style={{ '--item-cor': cor }}>
            <div className="timeline-dot" />
            <div className="timeline-info">
                <span className="timeline-label">{label}</span>
                <span className="timeline-hora font-mono">{formatHora(hora)}</span>
            </div>
        </div>
    );
}
