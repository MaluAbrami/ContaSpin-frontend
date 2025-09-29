import api from './api';

export const getContasContabeis = async (empresaId) => {
  const { data } = await api.get('/contas/empresa/' + empresaId);
  return data;
};

export const addContaContabil = async (conta) => {
  const { data } = await api.post('/contas', conta);
  return data;
};