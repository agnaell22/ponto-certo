import { useState, useRef } from 'react';
import { justificativaService } from '../services/justificativaService';

const TIPOS = [
    { value: 'ATESTADO_MEDICO', label: 'Atestado Médico' },
    { value: 'ATESTADO_ACOMPANHANTE', label: 'Atestado Acompanhante' },
    { value: 'OBITO', label: 'Falecimento em Família (Óbito)' },
    { value: 'CASAMENTO', label: 'Casamento (Gala)' },
    { value: 'NASCIMENTO_FILHO', label: 'Nascimento de Filho (Paternidade)' },
    { value: 'DOACAO_SANGUE', label: 'Doação de Sangue' },
    { value: 'ALISTAMENTO_MILITAR', label: 'Alistamento Militar' },
    { value: 'VESTIBULAR', label: 'Exame Vestibular' },
    { value: 'JUSTICA', label: 'Convocação Judicial' },
    { value: 'CONVOCACAO_ELEITORAL', label: 'Convocação Eleitoral' },
    { value: 'OUTROS', label: 'Outros Motivos' },
];

export default function JustificativaModal({ isOpen, onClose, onSuccess, dataReferencia }) {
    const [form, setForm] = useState({
        tipo: 'ATESTADO_MEDICO',
        motivo: '',
        dataInicio: dataReferencia || new Date().toISOString().split('T')[0],
        dataFim: dataReferencia || new Date().toISOString().split('T')[0],
        anexo: null
    });
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            setErro('Arquivo muito grande! Máximo 5MB.');
            return;
        }
        setForm(f => ({ ...f, anexo: file }));
        setErro('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.motivo) return setErro('Informe o motivo da ausência');

        setLoading(true);
        setErro('');
        try {
            await justificativaService.enviar(form);
            onSuccess?.();
            onClose();
        } catch (err) {
            setErro(err.response?.data?.error || 'Erro ao enviar justificativa');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content card card-glass fade-in-up" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h2 className="text-xl font-bold">Justificar Ausência</h2>
                    <button className="btn-ghost" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                    <div className="form-group">
                        <label className="form-label">Tipo de Justificativa (Art. 473 CLT)</label>
                        <select
                            className="form-input"
                            value={form.tipo}
                            onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                        >
                            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Data Início</label>
                            <input
                                type="date" className="form-input"
                                value={form.dataInicio}
                                onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Data Fim</label>
                            <input
                                type="date" className="form-input"
                                value={form.dataFim}
                                onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Motivo / Descrição</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            placeholder="Descreva brevemente o motivo..."
                            value={form.motivo}
                            onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Anexar Comprovante (PDF, JPG, PNG)</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <button
                                type="button"
                                className="btn btn-outline w-full"
                                onClick={() => fileInputRef.current.click()}
                            >
                                {form.anexo ? `📎 ${form.anexo.name.substring(0, 20)}...` : '📁 Selecionar Arquivo'}
                            </button>
                        </div>
                    </div>

                    {erro && <p className="text-error text-sm">{erro}</p>}

                    <div className="flex gap-3 mt-2">
                        <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                            {loading ? <div className="spinner" /> : 'Enviar para o RH'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
