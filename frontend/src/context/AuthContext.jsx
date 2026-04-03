import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const initialState = {
    user: null,
    loading: true,
    error: null,
};

function authReducer(state, action) {
    switch (action.type) {
        case 'SET_USER': return { ...state, user: action.payload, loading: false, error: null };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
        case 'LOGOUT': return { ...initialState, loading: false };
        default: return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Recuperar sessão ao carregar a página
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
        }
        authService.getProfile()
            .then((user) => dispatch({ type: 'SET_USER', payload: user }))
            .catch(() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                dispatch({ type: 'LOGOUT' });
            });
    }, []);

    const login = useCallback(async (email, senha) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const user = await authService.login(email, senha);
            dispatch({ type: 'SET_USER', payload: user });
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao fazer login';
            dispatch({ type: 'SET_ERROR', payload: msg });
            return { success: false, error: msg };
        }
    }, []);

    const register = useCallback(async (data) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const result = await authService.register(data);
            dispatch({ type: 'SET_USER', payload: result.user });
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao criar conta';
            dispatch({ type: 'SET_ERROR', payload: msg });
            return { success: false, error: msg };
        }
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        dispatch({ type: 'LOGOUT' });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
    return ctx;
};
