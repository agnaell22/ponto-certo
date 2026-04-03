import { useState } from 'react';
import { jornadaService } from '../services/jornadaService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const formatMin = (min) => {
    if (!min && min !== 0) return '--:--';
    const h = Math.floor(min / 60), m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function RelatoriosPage() {
    const hoje = new Date();
    const [mes, setMes] = useState(format(hoje, 'yyyy-MM'));
    const [relatorio, setRelatorio] = useState(null);
    const [loading, setLoading] = useState(false);

    const gerarRelatorio = async () => {
        setLoading(true);
        try {
            const data = await jornadaService.obterRelatorioMensal(mes);
            setRelatorio(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Relatórios</h1>
                <p className="page-subtitle">Análise mensal de jornada com conformidade CLT</p>
            </div>

            {/* Seletor de mês */}
            <div className="card mb-6" style={{ padding: '1rem 1.5rem' }}>
                <div className="flex gap-4 items-center">
                    <div className="form-group" style={{ flex: 1, maxWidth: 200 }}>
                        <label className="form-label">Mês de referência</label>
                        <input type="month" className="form-input" value={mes} onChange={e => setMes(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={gerarRelatorio} style={{ marginTop: '1.25rem' }} disabled={loading} id="btn-gerar-relatorio">
                        {loading ? <><div className="spinner" /> Gerando...</> : '📊 Gerar Relatório'}
                    </button>
                </div>
            </div>

            {relatorio && (
                <>
                    {/* Totais */}
                    <div className="grid-4 mb-6">
                        {[
                            { label: 'Total Trabalhado', valor: relatorio.totais.totalTrabalhadoFormatado, badge: null },
                            { label: 'Horas Extras', valor: relatorio.totais.totalExtrasFormatado, badge: relatorio.totais.totalExtrasMin > 0 ? 'warning' : null },
                            { label: 'Dias Trabalhados', valor: relatorio.totais.diasTrabalhados, badge: null },
                            { label: 'Faltas', valor: relatorio.totais.diasFalta, badge: relatorio.totais.diasFalta > 0 ? 'error' : null },
                        ].map((item) => (
                            <div key={item.label} className="card">
                                <p className="text-muted text-sm">{item.label}</p>
                                <p className={`font-mono font-bold text-3xl mt-1 ${item.badge === 'warning' ? 'text-warning' : item.badge === 'error' ? 'text-error' : ''}`}>
                                    {item.valor}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Alertas CLT */}
                    {(relatorio.totais.violacoesIntervalo > 0 || relatorio.totais.diasFalta > 0) && (
                        <div className="card mb-6" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                            <h3 className="font-bold mb-2">⚠️ Alertas de Conformidade CLT</h3>
                            {relatorio.totais.violacoesIntervalo > 0 && (
                                <p className="text-sm text-error">• {relatorio.totais.violacoesIntervalo} dia(s) com intervalo abaixo do mínimo (Art. 71 CLT)</p>
                            )}
                            {relatorio.totais.diasFalta > 0 && (
                                <p className="text-sm text-error">• {relatorio.totais.diasFalta} falta(s) não justificada(s) → desconto proporcional aplicável</p>
                            )}
                            {relatorio.totais.diasAtestado > 0 && (
                                <p className="text-sm text-muted">• {relatorio.totais.diasAtestado} dia(s) com atestado médico → sem desconto salarial</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {!relatorio && !loading && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    📊 Selecione um mês e clique em <strong>Gerar Relatório</strong>
                </div>
            )}
        </div>
    );
}
