import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { jornadaService } from '../services/jornadaService';
import { useAuth } from './AuthContext';

const JornadaContext = createContext(null);

const initialState = {
    statusDia: null,
    resumoSemanal: null,
    loading: false,
    error: null,
    ultimaAtualizacao: null,
};

function jornadaReducer(state, action) {
    switch (action.type) {
        case 'SET_STATUS': return { ...state, statusDia: action.payload, ultimaAtualizacao: new Date(), loading: false };
        case 'SET_SEMANAL': return { ...state, resumoSemanal: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
        case 'CLEAR_ERROR': return { ...state, error: null };
        default: return state;
    }
}

export function JornadaProvider({ children }) {
    const [state, dispatch] = useReducer(jornadaReducer, initialState);
    const { user } = useAuth();

    const atualizarStatus = useCallback(async () => {
        if (!user) return;
        try {
            const status = await jornadaService.obterStatus();
            dispatch({ type: 'SET_STATUS', payload: status });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Erro ao obter status' });
        }
    }, [user]);

    const baterPonto = useCallback(async (tipo, horarioManual = null) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        try {
            let result;
            switch (tipo) {
                case 'ENTRADA': result = await jornadaService.baterEntrada(); break;
                case 'INICIO_INTERVALO': result = await jornadaService.iniciarIntervalo(); break;
                case 'FIM_INTERVALO': result = await jornadaService.finalizarIntervalo(); break;
                case 'SAIDA': result = await jornadaService.baterSaida(horarioManual); break;
                default: throw new Error(`Tipo de ponto inválido: ${tipo}`);
            }
            await atualizarStatus();
            return { success: true, data: result };
        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao registrar ponto';
            dispatch({ type: 'SET_ERROR', payload: msg });
            return { success: false, error: msg };
        }
    }, [atualizarStatus]);

    const atualizarSemanal = useCallback(async () => {
        if (!user) return;
        try {
            const resumo = await jornadaService.obterResumoSemanal();
            dispatch({ type: 'SET_SEMANAL', payload: resumo });
        } catch { }
    }, [user]);

    // Atualizar status ao logar e a cada 30s
    useEffect(() => {
        if (!user) return;
        atualizarStatus();
        atualizarSemanal();
        const interval = setInterval(atualizarStatus, 30000);
        return () => clearInterval(interval);
    }, [user, atualizarStatus, atualizarSemanal]);

    return (
        <JornadaContext.Provider value={{ ...state, baterPonto, atualizarStatus, atualizarSemanal }}>
            {children}
        </JornadaContext.Provider>
    );
}

export const useJornada = () => {
    const ctx = useContext(JornadaContext);
    if (!ctx) throw new Error('useJornadaContext deve ser usado dentro de JornadaProvider');
    return ctx;
};
