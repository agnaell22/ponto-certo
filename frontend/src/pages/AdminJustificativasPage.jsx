import { useState, useEffect } from 'react';
import { justificativaService } from '../services/justificativaService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminJustificativasPage() {
    const [pendentes, setPendentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processando, setProcessando] = useState(null); // ID da que está sendo validada

    const carregarPendentes = async () => {
        setLoading(true);
        try {
            const data = await justificativaService.listarPendentes();
            setPendentes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarPendentes();
    }, []);

    const handleValidar = async (id, status, acaoRH) => {
        const obs = prompt('Observação opcional para o colaborador:');
        setProcessando(id);
        try {
            await justificativaService.validar(id, {
                status,
                acaoRH,
                observacaoRH: obs || ''
            });
            await carregarPendentes();
        } catch (err) {
            alert('Erro ao validar: ' + (err.response?.data?.error || err.message));
        } finally {
            setProcessando(null);
        }
    };

    return (
        <div className="page-container fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Validação de Justificativas (RH)</h1>
                <p className="page-subtitle">Existem {pendentes.length} documento(s) aguardando revisão profissional.</p>
            </div>

            {loading ? (
                <div className="loading-overlay"><div className="spinner" /> Carregando documentos...</div>
            ) : (
                <div className="grid-1" style={{ display: 'grid', gap: '1.5rem' }}>
                    {pendentes.length === 0 ? (
                        <div className="card text-center" style={{ padding: '3rem' }}>
                            <p className="text-muted">🎉 Tudo em dia! Nenhuma justificativa pendente.</p>
                        </div>
                    ) : pendentes.map(j => (
                        <div key={j.id} className="card card-glass flex flex-col md-flex-row gap-6 p-6">
                            <div style={{ flex: 1 }}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold">{j.user.nome}</h3>
                                        <p className="text-sm text-subtle">{j.user.cargo || 'Colaborador'} · {j.user.email}</p>
                                    </div>
                                    <span className="badge badge-warning">Pendente</span>
                                </div>

                                <div className="mt-4 grid-2">
                                    <div>
                                        <p className="text-xs text-subtle mb-1">TIPO</p>
                                        <p className="font-bold">{j.tipo.replace(/_/g, ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-subtle mb-1">PERÍODO</p>
                                        <p className="font-bold">
                                            {format(new Date(j.dataInicio), 'dd/MM/yy')} a {format(new Date(j.dataFim), 'dd/MM/yy')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-xs text-subtle mb-1">MOTIVO ALEGADO</p>
                                    <p className="text-sm">{j.motivo}</p>
                                </div>

                                {j.anexoUrl && (
                                    <div className="mt-4">
                                        <a
                                            href={`http://localhost:3001${j.anexoUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-outline"
                                            style={{ color: 'var(--color-primary-light)' }}
                                        >
                                            📄 Ver Comprovante (Anexo)
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                                <p className="text-xs text-subtle text-center mb-2">AÇÃO DO RH</p>

                                <button
                                    className="btn btn-success w-full"
                                    disabled={processando === j.id}
                                    onClick={() => handleValidar(j.id, 'APROVADO', 'ABONAR')}
                                >
                                    ✅ Aprovar e Abonar
                                </button>

                                <button
                                    className="btn btn-primary w-full"
                                    disabled={processando === j.id}
                                    onClick={() => handleValidar(j.id, 'APROVADO', 'COMPENSAR')}
                                >
                                    ⏳ Aprovar e Compensar
                                </button>

                                <button
                                    className="btn btn-ghost w-full text-error"
                                    disabled={processando === j.id}
                                    onClick={() => handleValidar(j.id, 'REJEITADO', 'DESCONTAR')}
                                >
                                    ❌ Recusar Falta
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
