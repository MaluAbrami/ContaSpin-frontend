import React, { useEffect, useState } from 'react';
import { getEmpresas, loginEmpresa } from '../services/empresaService.js';
import { useUser } from '../contexts/UserContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const [empresas, setEmpresas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { setUserId } = useUser();
  const navigate = useNavigate();

  // Buscar empresas
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const data = await getEmpresas();
        setEmpresas(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmpresas();
  }, []);

  // Fazer login
  const handleLogin = async () => {
    if (!senha) return setError('Informe a senha');
    setError('');

    try {
      const data = await loginEmpresa(selected.email, senha);
      setUserId(data);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Senha incorreta');
    }
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, position: 'relative' }}>
      
      {/* Botão no canto superior direito */}
      <Link
        to="/criar-empresa"
        style={{
          position: 'absolute',
          top: 10,
          right: -200,
          padding: '8px 16px',
          backgroundColor: '#2563eb',
          color: '#fff',
          borderRadius: 4,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Criar Empresa
      </Link>

      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb', marginBottom: 20 }}>Escolha sua empresa</h2>

      {selected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <h3>{selected.nome}</h3>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button
            onClick={handleLogin}
            style={{ padding: 10, borderRadius: 4, border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
          >
            Entrar
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={() => { setSelected(null); setSenha(''); setError(''); }} style={{ marginTop: 10, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
            Voltar
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
          {empresas.map((empresa) => (
            <div
              key={empresa.id}
              onClick={() => setSelected(empresa)}
              style={{
                cursor: 'pointer',
                padding: 20,
                borderRadius: 8,
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                minWidth: 200,
                textAlign: 'center',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h3 style={{ color: '#2563eb' }}>{empresa.nome}</h3>
              <p>{empresa.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
