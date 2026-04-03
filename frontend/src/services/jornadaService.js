import apiClient from './apiClient';

export const jornadaService = {
    async obterStatus() {
        const res = await apiClient.get('/ponto/status');
        return res.data;
    },

    async baterEntrada() {
        const res = await apiClient.post('/ponto/entrada');
        return res.data;
    },

    async iniciarIntervalo() {
        const res = await apiClient.post('/ponto/intervalo/inicio');
        return res.data;
    },

    async finalizarIntervalo() {
        const res = await apiClient.post('/ponto/intervalo/fim');
        return res.data;
    },

    async baterSaida(horarioManual = null) {
        const res = await apiClient.post('/ponto/saida', { horarioManual });
        return res.data;
    },

    async obterHistorico(params = {}) {
        const res = await apiClient.get('/ponto/historico', { params });
        return res.data;
    },

    async obterResumoSemanal() {
        const res = await apiClient.get('/ponto/semana');
        return res.data;
    },

    async obterRelatorioMensal(mes) {
        const res = await apiClient.get('/relatorios/mensal', { params: { mes } });
        return res.data;
    },

    async obterConfiguracoes() {
        const res = await apiClient.get('/configuracoes');
        return res.data;
    },

    async salvarConfiguracoes(data) {
        const res = await apiClient.put('/configuracoes', data);
        return res.data;
    },
};
