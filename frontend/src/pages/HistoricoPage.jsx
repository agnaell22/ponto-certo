import { useState, useEffect } from 'react';
import { jornadaService } from '../services/jornadaService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import JustificativaModal from '../components/JustificativaModal';

const STATUS_LABELS = {
    NORMAL: { label: 'Normal', badge: 'badge-success' },
    FALTA: { label: 'Falta', badge: 'badge-error' },
    ATESTADO: { label: 'Atestado', badge: 'badge-purple' },
    FERIADO: { label: 'Feriado', badge: 'badge-neutral' },
    FOLGA: { label: 'Folga', badge: 'badge-info' },
};

const formatHora = (dt) => dt ? new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const formatMin = (min) => {
    if (!min && min !== 0) return '--:--';
    const h = Math.floor(min / 60), m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function HistoricoPage() {
    const [registros, setRegistros] = useState([]);
    const [total, setTotal] = useState(0);
    const [paginas, setPaginas] = useState(1);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dataParaJustificar, setDataParaJustificar] = useState(null);

    const carregarHistorico = async (page = 1) => {
        setLoading(true);
        try {
            const data = await jornadaService.obterHistorico({ page, limit: 20, ...filtros });
            setRegistros(data.registros);
            setTotal(data.total);
            setPaginas(data.paginas);
            setPaginaAtual(page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const abrirJustificativa = (data) => {
        setDataParaJustificar(data.split('T')[0]);
        setIsModalOpen(true);
    };

    useEffect(() => { carregarHistorico(1); }, []);

    return (
        <div className="page-container fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Histórico de Pontos</h1>
                <p className="page-subtitle">{total} registro(s) encontrado(s)</p>
            </div>

            {/* Filtros */}
            <div className="card mb-6" style={{ padding: '1rem 1.5rem' }}>
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                        <label className="form-label">Data início</label>
                        <input type="date" className="form-input"
                            value={filtros.dataInicio}
                            onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                        <label className="form-label">Data fim</label>
                        <input type="date" className="form-input"
                            value={filtros.dataFim}
                            onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))} />
                    </div>
                    <button className="btn btn-primary" onClick={() => carregarHistorico(1)} style={{ marginTop: '1.25rem' }}>
                        Filtrar
                    </button>
                    <button className="btn btn-outline" onClick={() => { setFiltros({ dataInicio: '', dataFim: '' }); carregarHistorico(1); }} style={{ marginTop: '1.25rem' }}>
                        Limpar
                    </button>
                </div>
            </div>

            {/* Tabela */}
            {loading ? (
                <div className="loading-overlay"><div className="spinner" /> Carregando...</div>
            ) : (
                <>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
                                        {['Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Trabalhado', 'Extras', 'Status', 'Ações'].map(h => (
                                            <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-subtle)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {registros.length === 0 ? (
                                        <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum registro encontrado</td></tr>
                                    ) : registros.map((r) => {
                                        const s = STATUS_LABELS[r.status] || STATUS_LABELS.NORMAL;
                                        return (
                                            <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'var(--transition-fast)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                                                    {format(new Date(r.data), 'dd/MM/yyyy', { locale: ptBR })}
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }} className="font-mono">{formatHora(r.entrada)}</td>
                                                <td style={{ padding: '0.875rem 1rem' }} className="font-mono">{formatHora(r.inicioIntervalo)}</td>
                                                <td style={{ padding: '0.875rem 1rem' }} className="font-mono">{formatHora(r.fimIntervalo)}</td>
                                                <td style={{ padding: '0.875rem 1rem' }} className="font-mono">{formatHora(r.saida)}</td>
                                                <td style={{ padding: '0.875rem 1rem' }} className="font-mono font-bold">{formatMin(r.horasTrabalhadasMin)}</td>
                                                <td style={{ padding: '0.875rem 1rem' }} className="font-mono text-warning">{formatMin(r.horasExtrasMin)}</td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    <span className={`badge ${s.badge}`}>{s.label}</span>
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}
                                                        onClick={() => abrirJustificativa(r.data)}
                                                    >
                                                        Justificar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginação */}
                    {paginas > 1 && (
                        <div className="flex gap-2 items-center justify-center mt-4">
                            <button className="btn btn-outline btn-icon" onClick={() => carregarHistorico(paginaAtual - 1)} disabled={paginaAtual === 1}>←</button>
                            <span className="text-muted text-sm">Pág. {paginaAtual} de {paginas}</span>
                            <button className="btn btn-outline btn-icon" onClick={() => carregarHistorico(paginaAtual + 1)} disabled={paginaAtual === paginas}>→</button>
                        </div>
                    )}
                </>
            )}

            <JustificativaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => carregarHistorico(paginaAtual)}
                dataReferencia={dataParaJustificar}
            />
        </div>
    );
}
