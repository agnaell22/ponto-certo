import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { JornadaProvider } from './context/JornadaContext';
import { NotificacaoProvider } from './context/NotificacaoContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HistoricoPage from './pages/HistoricoPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import RelatoriosPage from './pages/RelatoriosPage';
import JustificativasPage from './pages/HistoricoPage'; // Por hora usando historico ou separada
import AdminJustificativasPage from './pages/AdminJustificativasPage';
import BancoHorasPage from './pages/BancoHorasPage';
import './index.css';
import './pages/DashboardPage.css';

function AppLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((c) => !c)}
            />
            <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Routes>
                    <Route path="/" element={
                        <PrivateRoute>
                            <JornadaProvider>
                                <NotificacaoProvider>
                                    <DashboardPage />
                                </NotificacaoProvider>
                            </JornadaProvider>
                        </PrivateRoute>
                    } />
                    <Route path="/historico" element={
                        <PrivateRoute>
                            <JornadaProvider>
                                <HistoricoPage />
                            </JornadaProvider>
                        </PrivateRoute>
                    } />
                    <Route path="/relatorios" element={
                        <PrivateRoute>
                            <JornadaProvider>
                                <RelatoriosPage />
                            </JornadaProvider>
                        </PrivateRoute>
                    } />
                    <Route path="/configuracoes" element={
                        <PrivateRoute><ConfiguracoesPage /></PrivateRoute>
                    } />
                    <Route path="/banco-horas" element={
                        <PrivateRoute><JornadaProvider><BancoHorasPage /></JornadaProvider></PrivateRoute>
                    } />
                    <Route path="/justificativas" element={
                        <PrivateRoute><JornadaProvider><HistoricoPage /></JornadaProvider></PrivateRoute>
                    } />
                    <Route path="/validacoes" element={
                        <PrivateRoute><AdminJustificativasPage /></PrivateRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/*" element={<AppLayout />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
