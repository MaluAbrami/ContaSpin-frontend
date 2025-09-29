import api from './api';

export const getBalancete = async (dataReferencia, userId) => {
  const { data } = await api.get(`/relatorios/gerar-balancete/${dataReferencia}/${userId}`);
  return data;
};

export const getBalancoPatrimonial = async (userId, params) => {
  const { data } = await api.get(`/relatorios/gerar-balanco-patrimonial/${userId}`, { params });
  return data;
};

export const getLivroRazao = async (codigoConta, userId) => {
  const { data } = await api.get(`/relatorios/gerar-livro-razao/${codigoConta}/${userId}`);
  return data;
};