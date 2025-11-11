import api from './api';

export const getBalancete = async (dataReferencia, userId) => {
  const { data } = await api.get(`/relatorios/gerar-balancete/${dataReferencia}/${userId}`);
  return data;
};

export const getBalancoPatrimonial = async (userId, date, params) => {
  if (date === undefined) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    date = `${day}-${month}-${year}`;
  }
  const { data } = await api.get(`/relatorios/gerar-balanco-patrimonial/${userId}/${date}`, { params });
  return data;
};

export const getLivroRazao = async (codigoConta, userId) => {
  const { data } = await api.get(`/relatorios/gerar-livro-razao/${codigoConta}/${userId}`);
  return data;
};