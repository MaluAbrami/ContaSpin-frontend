import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx'; // página de seleção de empresas
import LivroDiario from './pages/LivroDiario.jsx';
import LivroRazao from './pages/LivroRazao.jsx';
import Balancete from './pages/Balancete.jsx';
import BalancoPatrimonial from './pages/BalancoPatrimonial.jsx';
import CriarEmpresa from './pages/CriarEmpresa.jsx';
import { UserProvider, useUser } from './contexts/UserContext.jsx';

// contentStyle will be computed inside AppContent based on whether the user is logged

// Rota privada: redireciona para /home (seleção de empresas) se não estiver logado
const PrivateRoute = ({ element }) => {
  const { userId } = useUser();
  return userId ? element : <Navigate to="/home" replace />;
};

function AppContent() {
  const { userId } = useUser();

  const contentStyle = {
    marginLeft: userId ? 200 : 0,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'margin-left 200ms ease',
  };

  return (
    <Router>
      <Navbar />
      <div style={contentStyle}>
        <Routes>
          {/* Página de seleção de empresas */}
          <Route path="/home" element={<Home />} />

          {/* Página de criação de empresa */}
          <Route path="/criar-empresa" element={<CriarEmpresa />} />

          {/* Rotas privadas */}
          <Route path="/" element={<PrivateRoute element={<Home />} />} />
          <Route path="/diario" element={<PrivateRoute element={<LivroDiario />} />} />
          <Route path="/razao" element={<PrivateRoute element={<LivroRazao />} />} />
          <Route path="/balancete" element={<PrivateRoute element={<Balancete />} />} />
          <Route path="/balanco" element={<PrivateRoute element={<BalancoPatrimonial />} />} />

          {/* Qualquer rota desconhecida volta para /home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
