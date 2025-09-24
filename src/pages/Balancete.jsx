import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getBalancete } from '../services/relatorios';
import { format } from 'date-fns';

const Container = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
const Card = styled.div`
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  padding: 24px;
  margin-top: 24px;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  background: #fff;
`;
const Th = styled.th`
  padding: 8px;
  border: 1px solid #eee;
  background: #2563eb;
`;
const Td = styled.td`
  padding: 8px;
  border: 1px solid #eee;
  text-align: ${props => props.align || 'left'};
  color: #2563eb;
`;

export default function Balancete() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const totalPaginas = Math.ceil(linhas.length / porPagina);
  const linhasPaginadas = linhas.slice((pagina - 1) * porPagina, pagina * porPagina);

  useEffect(() => {
    async function fetchBalancete() {
      try {
        setLoading(true);
        setErro(null);
        const hoje = format(new Date(), 'dd-MM-yyyy');
        const data = await getBalancete(hoje);
        setLinhas(data);
      } catch (err) {
        setErro(err?.message || 'Erro ao buscar balancete');
      } finally {
        setLoading(false);
      }
    }
    fetchBalancete();
  }, []);

  function mudarPagina(nova) {
    setPagina(nova);
  }

  // Totais
  const totalDebito = linhas.reduce((acc, l) => acc + Number(l.debito || 0), 0);
  const totalCredito = linhas.reduce((acc, l) => acc + Number(l.credito || 0), 0);

  return (
    <Container>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Balancete</h2>
      <p style={{ maxWidth: 500, margin: '1rem auto', fontSize: 20, color: '#2563eb' }}>Veja o balancete da empresa na data de hoje.</p>
      <Card>
        {erro && <div style={{ color: 'red', marginBottom: 8 }}>{erro}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Carregando...</div>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Conta</Th>
                  <Th>Débito</Th>
                  <Th>Crédito</Th>
                </tr>
              </thead>
              <tbody>
                {linhasPaginadas.map((l, i) => (
                  <tr key={l.conta.codigo + '-' + i}>
                    <Td align="center">{l.conta.codigo}</Td>
                    <Td>{l.conta.nome}</Td>
                    <Td align="right">{Number(l.debito).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                    <Td align="right">{Number(l.credito).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                  <Td colSpan={2} align="right">Totais:</Td>
                  <Td align="right">{totalDebito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                  <Td align="right">{totalCredito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                </tr>
              </tfoot>
            </Table>
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => mudarPagina(i + 1)}
                    style={{
                      background: pagina === i + 1 ? '#2563eb' : '#fff',
                      color: pagina === i + 1 ? '#fff' : '#2563eb',
                      border: '1px solid #2563eb',
                      borderRadius: 6,
                      padding: '4px 12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </Container>
  );
}
