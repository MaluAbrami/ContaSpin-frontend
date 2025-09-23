import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getLancamentos, addLancamento } from '../services/lancamentos';
import { getContasContabeis } from '../services/contasContabeis';
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
  const [lancamentos, setLancamentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [novo, setNovo] = useState({ data: '', descricao: '', debito: '', credito: '', valor: '' });
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [lancData, contasData] = await Promise.all([
          getLancamentos(),
          getContasContabeis()
        ]);
        setLancamentos(lancData);
        setContas(contasData);
      } catch (err) {
        setErro('Erro ao buscar dados');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalPaginas = Math.ceil(lancamentos.length / porPagina);
  const lancamentosPaginados = lancamentos.slice((pagina - 1) * porPagina, pagina * porPagina);

  function handleChange(e) {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  }

  async function adicionarLancamentoHandler(e) {
    e.preventDefault();
    try {
      setLoading(true);
      // Formatar data para dd-MM-yyyy
      const dataFormatada = novo.data ? format(new Date(novo.data), 'dd-MM-yyyy') : '';
      // Buscar conta pelo código (id) para garantir compatibilidade
      const contaDebito = contas.find(c => (c.nome || c.codigo || c) === novo.debito || c.id === novo.debito || c.codigo === novo.debito);
      const contaCredito = contas.find(c => (c.nome || c.codigo || c) === novo.credito || c.id === novo.credito || c.codigo === novo.credito);
      const payload = {
        descricao: novo.descricao,
        contaDebitoId: contaDebito?.codigo || contaDebito?.id || novo.debito,
        contaCreditoId: contaCredito?.codigo || contaCredito?.id || novo.credito,
        dataLancamento: dataFormatada,
        valor: Number(novo.valor)
      };
      await addLancamento(payload);
      const dataAtualizada = await getLancamentos();
      setLancamentos(dataAtualizada);
      setNovo({ data: '', descricao: '', debito: '', credito: '', valor: '' });
      setShowForm(false);
      const novaTotalPaginas = Math.ceil((dataAtualizada.length) / porPagina);
      setPagina(novaTotalPaginas);
    } catch (err) {
      setErro('Erro ao adicionar lançamento');
    } finally {
      setLoading(false);
    }
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
        {erro && <div style={{ color: 'red', marginBottom: 8 }}>{erro}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Carregando...</div>
        ) : (
          <>
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
                  <tr key={l.id || i + (pagina - 1) * porPagina}>
                    <Td align="center">{l.dataLancamento || l.data || ''}</Td>
                    <Td>{l.descricao}</Td>
                    <Td align="center">{l.contaDebito || l.debito || ''}</Td>
                    <Td align="center">{l.contaCredito || l.credito || ''}</Td>
                    <Td align="right">{Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
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
          </>
        )}
        {showForm && (
          <Form onSubmit={adicionarLancamentoHandler}>
            <Input type="date" name="data" value={novo.data} onChange={handleChange} required />
            <Input type="text" name="descricao" value={novo.descricao} onChange={handleChange} placeholder="Descrição" required minLength={2} />
            <Select name="debito" value={novo.debito} onChange={handleChange} required>
              <option value="">Débito</option>
              {contas.map((c) => (
                <option key={c.id || c.codigo || c.nome || c} value={c.nome || c.codigo || c}>{c.nome || c.codigo || c}</option>
              ))}
            </Select>
            <Select name="credito" value={novo.credito} onChange={handleChange} required>
              <option value="">Crédito</option>
              {contas.map((c) => (
                <option key={c.id || c.codigo || c.nome || c} value={c.nome || c.codigo || c}>{c.nome || c.codigo || c}</option>
              ))}
            </Select>
            <Input type="number" name="valor" value={novo.valor} onChange={handleChange} placeholder="Valor" required min="0" step="0.01" style={{ width: 90 }} />
            <SaveButton type="submit">Salvar</SaveButton>
          </Form>
        )}
      </Card>
    </Container>
  );
}
