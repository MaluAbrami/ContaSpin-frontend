import api from './api';

export const getContasContabeis = async () => {
  const { data } = await api.get('/contas');
  return data;
};

export const addContaContabil = async (conta) => {
  const { data } = await api.post('/contas', conta);
  return data;
};