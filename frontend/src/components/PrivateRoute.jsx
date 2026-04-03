import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay" style={{ minHeight: '100vh' }}>
                <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
                <span>Verificando sessão...</span>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" replace />;
}
