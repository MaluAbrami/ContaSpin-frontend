import React, { useEffect, useState } from 'react';
import { getEmpresas, loginEmpresa } from '../services/empresaService.js';
import { useUser } from '../contexts/UserContext.jsx';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Home() {
  const [empresas, setEmpresas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [showConfirmSwitch, setShowConfirmSwitch] = useState(false);
  const { userId, setUserId } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState(null);

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
      const storedName = (() => { try { return localStorage.getItem('userCompanyName'); } catch (e) { return null; } })();
      if (storedName && selected && storedName !== selected.nome) {
        // pede confirmação para trocar de empresa
        setShowConfirmSwitch(true);
        return;
      }
    } catch (e) {
      // ignore localStorage errors
    }

    await performLogin();
  };

  // realiza o login (utilizado diretamente ou após confirmação)
  const performLogin = async () => {
    try {
      // se existir empresa anterior, remove antes de logar
      try { localStorage.removeItem('userCompanyName'); } catch (e) {}
      setUserId(null);

      const data = await loginEmpresa(selected.email, senha);
      const id = typeof data === 'string' ? data : (data?.id || data?._id || null);
      setUserId(id || data);
      try { localStorage.setItem('userCompanyName', selected.nome); } catch (e) {}
      navigate('/', { state: { toast: { message: `Entrou na empresa ${selected.nome}` } } });
    } catch (err) {
      setError(err.message || 'Senha incorreta');
    } finally {
      setShowConfirmSwitch(false);
    }
  };

  // Se vier um toast via location.state, exibe e limpa o state para não reaparecer
  useEffect(() => {
    if (location?.state && location.state.toast) {
      setToast(location.state.toast);
      // limpar o state da navegação para evitar re-exibição
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // auto-dismiss do toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, position: 'relative' }}>
      {/* Toast fixo no topo central */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: 16, zIndex: 9999 }}>
          <div style={{ background: '#fff', color: '#062f4f', padding: '10px 18px', borderRadius: 10, boxShadow: '0 8px 24px rgba(6,47,79,0.12)', display: 'flex', gap: 12, alignItems: 'center', minWidth: 240, justifyContent: 'center', fontWeight: 700 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#2563eb' }}>{toast.message}</span>
          </div>
        </div>
      )}
      {/* Modal de confirmação para trocar de empresa */}
      {showConfirmSwitch && selected && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ width: 460, maxWidth: '92%', background: '#fff', borderRadius: 12, padding: 22, boxShadow: '0 16px 48px rgba(2,6,23,0.28)', border: '1px solid rgba(37,99,235,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

              <div>
                <h3 style={{ margin: 0, color: '#0b3b73', fontSize: 18, fontWeight: 800 }}>Confirmar troca de empresa</h3>
                <p style={{ margin: '8px 0 0', color: '#334155' }}>Você já está logado em outra empresa. Deseja sair dela e entrar na empresa <strong style={{ color: '#0b3b73' }}>{selected.nome}</strong>?</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => setShowConfirmSwitch(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#2563eb',
                  border: '1px solid #d6e6fb',
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 6px 18px rgba(37,99,235,0.04)',
                  transition: 'transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#eef6ff'; e.currentTarget.style.boxShadow = '0 10px 26px rgba(37,99,235,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Cancelar
              </button>

              <button
                onClick={() => performLogin()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  boxShadow: '0 10px 26px rgba(37,99,235,0.14)',
                  transition: 'transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1e4fbf'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(30,79,191,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.boxShadow = '0 10px 26px rgba(37,99,235,0.14)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.08)', minWidth: 320 }}>
          <h3 style={{ color: '#2563eb', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{selected.nome}</h3>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ padding: 10, borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#111' }}
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
          {empresas
            .filter((empresa) => {
              // filtra a empresa logada pelo nome (nome é único)
              let storedName = null;
              try { storedName = localStorage.getItem('userCompanyName'); } catch (e) { storedName = null; }
              if (!storedName) return true;
              return empresa.nome !== storedName;
            })
            .map((empresa) => (
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
                <p style={{ color: '#2563eb' }}>{empresa.email}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
