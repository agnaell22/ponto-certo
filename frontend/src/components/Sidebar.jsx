import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
    { to: '/', icon: '⚡', label: 'Dashboard' },
    { to: '/historico', icon: '📋', label: 'Histórico' },
    { to: '/banco-horas', icon: '⏳', label: 'Banco de Horas' },
    { to: '/justificativas', icon: '📄', label: 'Justificativas' },
    { to: '/validacoes', icon: '🛡️', label: 'Validação RH', adminOnly: true },
    { to: '/relatorios', icon: '📊', label: 'Relatórios' },
    { to: '/configuracoes', icon: '⚙️', label: 'Configurações' },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Fechar sidebar mobile ao mudar de página
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
        {/* Botão hamburger (mobile only) */}
        <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
        >
            <span className="hamburger-icon">☰</span>
        </button>

        {/* Overlay escuro (mobile only) */}
        {mobileOpen && (
            <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
        )}

        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span className="logo-icon">⏱</span>
                    {!collapsed && <span className="logo-text">Ponto-Certo</span>}
                </div>
                <button className="sidebar-toggle btn btn-ghost btn-icon" onClick={() => { onToggle(); setMobileOpen(false); }} title="Recolher menu">
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            {/* Navegação */}
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    // No futuro: if (item.adminOnly && user?.role !== 'ADMIN_RH') return null;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                            title={collapsed ? item.label : ''}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                            {!collapsed && <span className="sidebar-active-indicator" />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Usuário */}
            <div className="sidebar-footer">
                {!collapsed && user && (
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {user.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user.nome}</span>
                            <span className="user-email">{user.email}</span>
                        </div>
                    </div>
                )}
                <button
                    className="btn btn-ghost sidebar-logout"
                    onClick={handleLogout}
                    title="Sair"
                >
                    <span>🚪</span>
                    {!collapsed && <span>Sair</span>}
                </button>
            </div>
        </aside>
        </>
    );
}
