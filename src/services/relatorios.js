import api from './api';

export const getBalancete = async (params) => {
  const { data } = await api.get('/relatorios/gerar-balancete', { params });
  return data;
};

export const getBalancoPatrimonial = async (params) => {
  const { data } = await api.get('/relatorios/gerar-balanco-patrimonial', { params });
  return data;
};

export const getLivroRazao = async (params) => {
  const { data } = await api.get('/relatorios/gerar-livro-razao', { params });
  return data;
};