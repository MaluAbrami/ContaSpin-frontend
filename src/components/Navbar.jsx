import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext.jsx';

const navContainer = {
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  width: '300px',
  background: 'linear-gradient(180deg, #4f8cff 0%, #38c6d9 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between', // Mantém o space-between
  boxShadow: '2px 0 8px rgba(0,0,0,0.07)',
  zIndex: 10,
  paddingTop: 40,
  paddingBottom: 40,
  boxSizing: 'border-box', // <-- ADICIONADO: ESSA É A CHAVE!
};

const navLinksContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
  width: '100%',
  // 'flex: 1' continua removido
};

const linkStyle = {
  background: '#fff',
  color: '#2563eb',
  border: 'none',
  borderRadius: '24px',
  padding: '0.7rem',
  fontWeight: 600,
  fontSize: 16,
  textDecoration: 'none',
  transition: 'background 0.2s, color 0.2s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  width: '80%',
  textAlign: 'center'
};

const activeStyle = {
  background: '#2563eb',
  color: '#fff'
};

const logoutButtonStyle = {
  ...linkStyle,
  background: '#ff4d4d',
  color: '#fff',
  cursor: 'pointer',
  // 'marginTop: auto' continua removido
};

export default function Navbar() {
  const { setUserId } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUserId(null);
    navigate('/home');
  };

  return (
    <nav style={navContainer}>
      {/* Container dos links fica no topo */}
      <div style={navLinksContainer}>
        <NavLink to="/" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle} end>
          Início
        </NavLink>
        <NavLink to="/diario" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          Livro Diário
        </NavLink>
        <NavLink to="/razao" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          Livro Razão
        </NavLink>
        <NavLink to="/balancete" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          Balancete
        </NavLink>
        <NavLink to="/balanco" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>
          Balanço Patrimonial
        </NavLink>
      </div>

      {/* Botão de Logout no fim */}
      <button onClick={handleLogout} style={logoutButtonStyle}>
        Logout
      </button>
    </nav>
  );
}