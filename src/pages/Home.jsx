import React from 'react';

export default function Home() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Bem-vindo ao ContaSpin</h2>
      <p style={{ maxWidth: 500, margin: '1rem auto', fontSize: 20, color: '#2563eb' }}>
        O ContaSpin é um sistema de contabilidade simples, focado em facilitar o registro e visualização dos principais livros contábeis: Livro Diário, Livro Razão, Balancete e Balanço Patrimonial.
      </p>
    </div>
  );
}
