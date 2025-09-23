import React from 'react';
import { NavLink } from 'react-router-dom';

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
  justifyContent: 'center',
  gap: '2rem',
  boxShadow: '2px 0 8px rgba(0,0,0,0.07)',
  zIndex: 10
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

export default function Navbar() {
  return (
    <nav style={navContainer}>
      <NavLink to="/" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle} end>Início</NavLink>
      <NavLink to="/diario" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>Livro Diário</NavLink>
      <NavLink to="/razao" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>Livro Razão</NavLink>
      <NavLink to="/balancete" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>Balancete</NavLink>
      <NavLink to="/balanco" style={({ isActive }) => isActive ? { ...linkStyle, ...activeStyle } : linkStyle}>Balanço Patrimonial</NavLink>
    </nav>
  );
}
