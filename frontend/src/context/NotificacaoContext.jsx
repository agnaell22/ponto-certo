import { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useJornada } from './JornadaContext';

const NotificacaoContext = createContext(null);

// Permissão de notificação no browser
async function solicitarPermissao() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

function enviarNotificacao(titulo, corpo, opcoes = {}) {
    if (Notification.permission !== 'granted') return;
    const notif = new Notification(titulo, {
        body: corpo,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: opcoes.tag || 'ponto-certo',
        ...opcoes,
    });
    // Auto-fechar após 8s
    setTimeout(() => notif.close(), 8000);
    return notif;
}

export function NotificacaoProvider({ children }) {
    const { user } = useAuth();
    const { statusDia } = useJornada();
    const configRef = useRef(null);
    const notificadoRef = useRef(new Set()); // evitar notificações duplicadas

    // Solicitar permissão ao logar
    useEffect(() => {
        if (user) solicitarPermissao();
    }, [user]);

    // Carregar configuração do usuário
    useEffect(() => {
        if (user?.configuracao) {
            configRef.current = user.configuracao;
        }
    }, [user]);

    // Monitor de notificações baseado no status atual e horários configurados
    useEffect(() => {
        if (!user || !statusDia || !configRef.current) return;

        const config = configRef.current;
        const antecedencia = config.notifAntecedenciaMin || 15;
        const agora = new Date();

        const parseHorario = (hhmm) => {
            const [h, m] = hhmm.split(':').map(Number);
            const d = new Date(agora);
            d.setHours(h, m, 0, 0);
            return d;
        };

        const diffMin = (alvo) => Math.floor((alvo - agora) / 60000);

        // Verificar horário de entrada
        if (!statusDia.entrada) {
            const entrada = parseHorario(config.horarioEntrada || '08:00');
            const diff = diffMin(entrada);
            const key = `entrada-${entrada.toDateString()}`;

            if (diff > 0 && diff <= antecedencia && !notificadoRef.current.has(key)) {
                notificadoRef.current.add(key);
                enviarNotificacao(
                    '⏰ Hora de registrar entrada!',
                    `Sua jornada começa em ${diff} minuto(s). Clique para registrar.`,
                    { tag: 'entrada' }
                );
            }
        }

        // Verificar fim de jornada / saída
        if (statusDia.entrada && !statusDia.saida) {
            const saida = parseHorario(config.horarioSaida || '17:00');
            const diff = diffMin(saida);
            const key = `saida-${saida.toDateString()}`;

            if (diff > 0 && diff <= antecedencia && !notificadoRef.current.has(key)) {
                notificadoRef.current.add(key);
                enviarNotificacao(
                    '🏠 Hora de ir embora!',
                    `Sua jornada termina em ${diff} minuto(s).`,
                    { tag: 'saida' }
                );
            }

            // Hora extra: avisar se já passou do horário de saída
            if (diff < -5) {
                const key2 = `hora-extra-${agora.getHours()}-${Math.floor(agora.getMinutes() / (config.notifHoraExtraMin || 30))}`;
                if (!notificadoRef.current.has(key2)) {
                    notificadoRef.current.add(key2);
                    enviarNotificacao(
                        '⚡ Hora extra em andamento',
                        `Você está ${Math.abs(diff)} min além do horário. Já parou? Registre a saída.`,
                        { tag: 'hora-extra' }
                    );
                }
            }
        }
    }, [statusDia, user]);

    const notificar = useCallback((titulo, corpo, opcoes) => {
        enviarNotificacao(titulo, corpo, opcoes);
    }, []);

    return (
        <NotificacaoContext.Provider value={{ notificar, solicitarPermissao }}>
            {children}
        </NotificacaoContext.Provider>
    );
}

export const useNotificacao = () => useContext(NotificacaoContext);
