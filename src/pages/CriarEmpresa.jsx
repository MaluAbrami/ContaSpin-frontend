import React, { useState } from "react";
import { createEmpresa } from "../services/empresaService.js";
import { useNavigate } from "react-router-dom";

const CriarEmpresa = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nome || !email || !senha) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      await createEmpresa({ nome, email, senha });
      setSuccess("Empresa criada com sucesso!");
      // opcional: redireciona para login
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Erro ao criar empresa");
    }
  };

  return (
    <div style={{ maxWidth: 540, width: '100%', margin: "60px auto", padding: 28, border: "1px solid #e6eefc", borderRadius: 12, boxShadow: "0 8px 30px rgba(34,60,80,0.08)", background: '#fff' }}>
      <h2 style={{ textAlign: "center", marginBottom: 20, color: '#2563eb', fontSize: 26, fontWeight: 800 }}>Criar Empresa</h2>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      {success && <p style={{ color: "green", textAlign: "center" }}>{success}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <input
          type="text"
          placeholder="Nome da empresa"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ padding: 12, borderRadius: 6, border: "1px solid #d6e6fb", background: '#fff', color: '#111', width: '100%', boxSizing: 'border-box' }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, borderRadius: 6, border: "1px solid #d6e6fb", background: '#fff', color: '#111', width: '100%', boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ padding: 12, borderRadius: 6, border: "1px solid #d6e6fb", background: '#fff', color: '#111', width: '100%', boxSizing: 'border-box' }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 4px 12px rgba(37,99,235,0.12)',
            transition: 'transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.12)';
          }}
        >
          Criar Conta
        </button>
      </form>
    </div>
  );
};

export default CriarEmpresa;
