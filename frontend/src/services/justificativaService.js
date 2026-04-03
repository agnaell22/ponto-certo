import apiClient from './apiClient';

export const justificativaService = {
    /**
     * Enviar justificativa com arquivo (Multipart/Form-Data)
     */
    async enviar(dados) {
        const formData = new FormData();
        formData.append('tipo', dados.tipo);
        formData.append('motivo', dados.motivo);
        formData.append('dataInicio', dados.dataInicio);
        formData.append('dataFim', dados.dataFim);
        if (dados.anexo) {
            formData.append('anexo', dados.anexo);
        }

        const response = await apiClient.post('/justificativa', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Listar minhas justificativas
     */
    async listarMinhas() {
        const response = await apiClient.get('/justificativa/me');
        return response.data;
    },

    /**
     * (RH) Listar todas as pendentes
     */
    async listarPendentes() {
        const response = await apiClient.get('/justificativa/pendentes');
        return response.data;
    },

    /**
     * (RH) Validar justificativa
     */
    async validar(id, decisao) {
        const response = await apiClient.post(`/justificativa/${id}/validar`, decisao);
        return response.data;
    }
};
