import api from './api';

export const getLancamentos = async () => {
  const { data } = await api.get('/lancamentos');
  return data;
};

export const addLancamento = async (lancamento) => {
  const { data } = await api.post('/lancamentos', lancamento);
  return data;
};
