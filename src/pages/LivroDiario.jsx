import React, { useState } from 'react';
import styled from 'styled-components';

const contas = [
  'Caixa',
  'Banco',
  'Clientes',
  'Fornecedores',
  'Receita',
  'Despesa',
];

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

const AddButton = styled.button`
  background: none;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: #2563eb;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover {
    background: #2563eb;
    color: #fff;
  }
`;

const SaveButton = styled.button`
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #38c6d9;
  }
`;

const Input = styled.input`
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
`;

const Select = styled.select`
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
`;

const Form = styled.form`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 8px;
`;

export default function LivroDiario() {
  const [lancamentos, setLancamentos] = useState([
    { data: '2025-09-23', descricao: 'Venda de produto', debito: 'Caixa', credito: 'Receita', valor: 100 },
    { data: '2025-09-23', descricao: 'Pagamento fornecedor', debito: 'Despesa', credito: 'Caixa', valor: 50 },
    // ...adicione mais lançamentos para testar a paginação...
  ]);
  const [showForm, setShowForm] = useState(false);
  const [novo, setNovo] = useState({ data: '', descricao: '', debito: '', credito: '', valor: '' });
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const totalPaginas = Math.ceil(lancamentos.length / porPagina);
  const lancamentosPaginados = lancamentos.slice((pagina - 1) * porPagina, pagina * porPagina);

  function handleChange(e) {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  }

  function adicionarLancamento(e) {
    e.preventDefault();
    const novosLancamentos = [...lancamentos, { ...novo, valor: Number(novo.valor) }];
    setLancamentos(novosLancamentos);
    setNovo({ data: '', descricao: '', debito: '', credito: '', valor: '' });
    setShowForm(false);
    const novaTotalPaginas = Math.ceil(novosLancamentos.length / porPagina);
    setPagina(novaTotalPaginas); // Vai para última página real
  }

  function mudarPagina(nova) {
    setPagina(nova);
  }

  return (
    <Container>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Livro Diário</h2>
      <p style={{ maxWidth: 500, margin: '1rem auto', fontSize: 20, color: '#2563eb' }}>Registre aqui as movimentações diárias da empresa.</p>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#2563eb' }}>Lançamentos</h3>
          <AddButton onClick={() => setShowForm(!showForm)} title="Novo lançamento">+</AddButton>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Descrição</Th>
              <Th>Débito</Th>
              <Th>Crédito</Th>
              <Th>Valor</Th>
            </tr>
          </thead>
          <tbody>
            {lancamentosPaginados.map((l, i) => (
              <tr key={i + (pagina - 1) * porPagina}>
                <Td align="center">{l.data}</Td>
                <Td>{l.descricao}</Td>
                <Td align="center">{l.debito}</Td>
                <Td align="center">{l.credito}</Td>
                <Td align="right">{l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
              </tr>
            ))}
          </tbody>
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
        {showForm && (
          <Form onSubmit={adicionarLancamento}>
            <Input type="date" name="data" value={novo.data} onChange={handleChange} required />
            <Input type="text" name="descricao" value={novo.descricao} onChange={handleChange} placeholder="Descrição" required minLength={2} />
            <Select name="debito" value={novo.debito} onChange={handleChange} required>
              <option value="">Débito</option>
              {contas.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select name="credito" value={novo.credito} onChange={handleChange} required>
              <option value="">Crédito</option>
              {contas.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input type="number" name="valor" value={novo.valor} onChange={handleChange} placeholder="Valor" required min="0" step="0.01" style={{ width: 90 }} />
            <SaveButton type="submit">Salvar</SaveButton>
          </Form>
        )}
      </Card>
    </Container>
  );
}
