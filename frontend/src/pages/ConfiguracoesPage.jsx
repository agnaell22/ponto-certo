import { useState, useEffect } from 'react';
import { jornadaService } from '../services/jornadaService';

export default function ConfiguracoesPage() {
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        jornadaService.obterConfiguracoes().then(setForm).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSalvando(true);
        try {
            await jornadaService.salvarConfiguracoes({
                horarioEntrada: form.horarioEntrada,
                horarioSaida: form.horarioSaida,
                jornadaPadraoMinutos: form.jornadaPadraoMinutos,
                intervaloMinimoMinutos: form.intervaloMinimoMinutos,
                notifAntecedenciaMin: form.notifAntecedenciaMin,
                notifHoraExtraMin: form.notifHoraExtraMin,
                toleranciaMinutos: form.toleranciaMinutos,
            });
            setFeedback({ tipo: 'sucesso', msg: 'Configurações salvas com sucesso!' });
        } catch (err) {
            setFeedback({ tipo: 'erro', msg: err.response?.data?.error || 'Erro ao salvar' });
        } finally {
            setSalvando(false);
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    if (loading || !form) return <div className="loading-overlay" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

    return (
        <div className="page-container fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Configurações</h1>
                <p className="page-subtitle">Personalize sua jornada de trabalho</p>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
                <div className="card mb-4">
                    <h3 className="text-lg font-bold mb-4">⏱ Horários</h3>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Entrada</label>
                            <input name="horarioEntrada" type="time" className="form-input" value={form.horarioEntrada || '08:00'} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Saída</label>
                            <input name="horarioSaida" type="time" className="form-input" value={form.horarioSaida || '17:00'} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group mt-4">
                        <label className="form-label">Jornada padrão (minutos) — CLT: 480min (8h)</label>
                        <input name="jornadaPadraoMinutos" type="number" className="form-input" min={60} max={600} value={form.jornadaPadraoMinutos || 480} onChange={handleChange} />
                    </div>
                    <div className="form-group mt-4">
                        <label className="form-label">Intervalo mínimo (minutos) — CLT mínimo: 60min</label>
                        <input name="intervaloMinimoMinutos" type="number" className="form-input" min={15} max={180} value={form.intervaloMinimoMinutos || 60} onChange={handleChange} />
                    </div>
                    <div className="form-group mt-4">
                        <label className="form-label">Tolerância de registro (minutos)</label>
                        <input name="toleranciaMinutos" type="number" className="form-input" min={0} max={60} value={form.toleranciaMinutos || 10} onChange={handleChange} />
                    </div>
                </div>

                <div className="card mb-4">
                    <h3 className="text-lg font-bold mb-4">🔔 Notificações</h3>
                    <div className="form-group">
                        <label className="form-label">Antecipar notificação por (minutos)</label>
                        <input name="notifAntecedenciaMin" type="number" className="form-input" min={0} max={120} value={form.notifAntecedenciaMin || 15} onChange={handleChange} />
                    </div>
                    <div className="form-group mt-4">
                        <label className="form-label">Verificar hora extra a cada (minutos)</label>
                        <input name="notifHoraExtraMin" type="number" className="form-input" min={5} max={120} value={form.notifHoraExtraMin || 30} onChange={handleChange} />
                    </div>
                </div>

                {feedback && (
                    <div className={`feedback-msg ${feedback.tipo} mb-4`}>{feedback.msg}</div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={salvando} id="btn-salvar-config">
                    {salvando ? <><div className="spinner" /> Salvando...</> : '💾 Salvar configurações'}
                </button>
            </form>
        </div>
    );
}
