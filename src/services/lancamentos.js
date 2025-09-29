import api from './api';

export const getLancamentos = async (empresaId) => {
  const { data } = await api.get('/lancamentos/empresa/' + empresaId);
  return data;
};

export const addLancamento = async (lancamento) => {
  const { data } = await api.post('/lancamentos', lancamento);
  return data;
};
