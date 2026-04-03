import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotificacao } from '../context/NotificacaoContext';

/**
 * Hook para gerenciar notificações e confirmações do usuário
 */
export function useNotificacoes() {
    const notifCtx = useNotificacao();
    const [permissao, setPermissao] = useState(Notification?.permission || 'default');
    const [modalAberto, setModalAberto] = useState(false);
    const [modalTipo, setModalTipo] = useState(null);
    const callbackRef = useRef(null);

    const verificarPermissao = useCallback(async () => {
        if (!('Notification' in window)) return false;
        const resultado = await notifCtx?.solicitarPermissao?.();
        setPermissao(Notification.permission);
        return resultado;
    }, [notifCtx]);

    const abrirModal = useCallback((tipo, callback) => {
        setModalTipo(tipo);
        callbackRef.current = callback;
        setModalAberto(true);
    }, []);

    const fecharModal = useCallback(() => {
        setModalAberto(false);
        setModalTipo(null);
        callbackRef.current = null;
    }, []);

    const confirmarModal = useCallback((dados) => {
        if (callbackRef.current) callbackRef.current(dados);
        fecharModal();
    }, [fecharModal]);

    return {
        permissao,
        permissaoGranted: permissao === 'granted',
        verificarPermissao,
        modalAberto,
        modalTipo,
        abrirModal,
        fecharModal,
        confirmarModal,
    };
}
