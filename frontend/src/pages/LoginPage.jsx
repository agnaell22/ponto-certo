import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const [modo, setModo] = useState('login'); // 'login' | 'registro'
    const [form, setForm] = useState({ nome: '', email: '', senha: '', cargo: '' });
    const [erro, setErro] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Nunca deixar loading do auth bloquear a LoginPage
    const { login, register, user } = useAuth();
    const navigate = useNavigate();

    // Redirecionar se já autenticado (sem bloquear a UI)
    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const trocarModo = (novoModo) => {
        setModo(novoModo);
        setErro('');
        setForm({ nome: '', email: '', senha: '', cargo: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSubmitting(true);

        const result = modo === 'login'
            ? await login(form.email, form.senha)
            : await register(form);

        setSubmitting(false);

        if (result.success) {
            navigate('/');
        } else {
            setErro(result.error);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="bg-orb bg-orb-1" />
                <div className="bg-orb bg-orb-2" />
                <div className="bg-orb bg-orb-3" />
            </div>

            <div className="login-container">
                <div className="login-logo">
                    <span className="login-logo-icon">⏱</span>
                    <h1 className="login-brand">Ponto-Certo</h1>
                    <p className="login-tagline">Sistema inteligente de jornada de trabalho</p>
                </div>

                <div className="card card-glass login-card">
                    {/* Abas */}
                    <div className="login-tabs" role="tablist">
                        <button
                            role="tab"
                            aria-selected={modo === 'login'}
                            className={`login-tab ${modo === 'login' ? 'active' : ''}`}
                            onClick={() => trocarModo('login')}
                            type="button"
                            id="tab-login"
                        >
                            Entrar
                        </button>
                        <button
                            role="tab"
                            aria-selected={modo === 'registro'}
                            className={`login-tab ${modo === 'registro' ? 'active' : ''}`}
                            onClick={() => trocarModo('registro')}
                            type="button"
                            id="tab-registro"
                        >
                            Criar conta
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form" noValidate>
                        {modo === 'registro' && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="nome">Nome completo</label>
                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    className="form-input"
                                    placeholder="Seu nome completo"
                                    value={form.nome}
                                    onChange={handleChange}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="seu@email.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="senha">Senha</label>
                            <input
                                id="senha"
                                name="senha"
                                type="password"
                                className="form-input"
                                placeholder={modo === 'registro' ? 'Mínimo 8 caracteres' : '••••••••'}
                                value={form.senha}
                                onChange={handleChange}
                                required
                                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                                minLength={modo === 'registro' ? 8 : undefined}
                            />
                        </div>

                        {modo === 'registro' && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="cargo">
                                    Cargo <span style={{ color: 'var(--color-text-subtle)', fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <input
                                    id="cargo"
                                    name="cargo"
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: Desenvolvedor, Gerente..."
                                    value={form.cargo}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {erro && (
                            <div className="feedback-msg erro" role="alert">
                                ❌ {erro}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={submitting}
                            id="btn-submit-auth"
                        >
                            {submitting
                                ? <><div className="spinner" /> Aguarde...</>
                                : modo === 'login' ? '→ Entrar no sistema' : '✓ Criar minha conta'
                            }
                        </button>
                    </form>

                    <p className="login-footer-text">
                        {modo === 'login' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
                        <button
                            className="link-btn"
                            type="button"
                            onClick={() => trocarModo(modo === 'login' ? 'registro' : 'login')}
                        >
                            {modo === 'login' ? 'Cadastre-se grátis' : 'Fazer login'}
                        </button>
                    </p>
                </div>

                <p className="login-compliance">
                    🔒 Dados protegidos · Compatível com CLT · Registros auditáveis
                </p>
            </div>
        </div>
    );
}
