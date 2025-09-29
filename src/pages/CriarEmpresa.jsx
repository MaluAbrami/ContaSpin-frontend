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
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, border: "1px solid #ddd", borderRadius: 8, boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Criar Empresa</h2>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      {success && <p style={{ color: "green", textAlign: "center" }}>{success}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <input
          type="text"
          placeholder="Nome da empresa"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 4, border: "none", backgroundColor: "#28a745", color: "#fff", cursor: "pointer" }}>
          Criar Conta
        </button>
      </form>
    </div>
  );
};

export default CriarEmpresa;
