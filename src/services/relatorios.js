import api from './api';

export const getBalancete = async (dataReferencia, userId) => {
  const { data } = await api.get(`/relatorios/gerar-balancete/${dataReferencia}/${userId}`);
  return data;
};

export const getBalancoPatrimonialByDate = async (empresaId, date) => {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

  const url = `/relatorios/gerar-balanco-patrimonial/${encodeURIComponent(empresaId)}/${encodeURIComponent(dateStr)}`;
  const { data } = await api.get(url);
  return data;
};


export const getDRE = async (userId, dataReferencia) => {
  const [yyyy, mm, dd] = dataReferencia.split('-'); // não usa Date

  const formatted = `${dd}-${mm}-${yyyy}`;

  const { data } = await api.get(`/relatorios/gerar-dre/${userId}/${formatted}`);
  return data;
}

export const getLivroRazao = async (codigoConta, userId) => {
  const { data } = await api.get(`/relatorios/gerar-livro-razao/${codigoConta}/${userId}`);
  return data;
};