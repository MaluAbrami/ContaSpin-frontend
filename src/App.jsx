import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import LivroDiario from './pages/LivroDiario.jsx';
import LivroRazao from './pages/LivroRazao.jsx';
import Balancete from './pages/Balancete.jsx';
import BalancoPatrimonial from './pages/BalancoPatrimonial.jsx';

const contentStyle = {
  marginLeft: 200,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function App() {
  return (
    <Router>
      <Navbar />
      <div style={contentStyle}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/diario" element={<LivroDiario />} />
          <Route path="/razao" element={<LivroRazao />} />
          <Route path="/balancete" element={<Balancete />} />
          <Route path="/balanco" element={<BalancoPatrimonial />} />
        </Routes>
      </div>
    </Router>
  );
}
