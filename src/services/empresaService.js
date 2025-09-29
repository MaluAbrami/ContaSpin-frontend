import api from './api'; // seu axios já configurado

// Criar nova empresa
export const createEmpresa = async ({ nome, email, senha }) => {
  try {
    const { data } = await api.post('/empresa', { nome, email, senha });
    return data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Listar empresas
export const getEmpresas = async () => {
  try {
    const { data } = await api.get('/empresa');
    return data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Login da empresa
export const loginEmpresa = async (email, senha) => {
  try {
    const { data } = await api.post('/empresa/login', { email, senha });
    return data; // { id: "...", ... }
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};
