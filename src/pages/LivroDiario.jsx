import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getLancamentos, addLancamento } from '../services/lancamentos';
import { getContasContabeis, addContaContabil } from '../services/contasContabeis';
import { format } from 'date-fns';
import { useUser } from '../contexts/UserContext.jsx';

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
  background: #fff;
  box-shadow: 0 4px 16px 0 #2563eb55, 0 1.5px 4px #2563eb22;
  border: 2px solid #2563eb;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  color: #2563eb;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover {
    background: #2563eb;
    color: #fff;
    box-shadow: 0 6px 24px 0 #2563eb99, 0 2px 8px #2563eb33;
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
  background: #fff;
  color: #2563eb;
`;

const Select = styled.select`
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: #2563eb;
`;

const Form = styled.form`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 8px;
`;

export default function LivroDiario() {

  const { userId } = useUser();

  const [lancamentos, setLancamentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [novo, setNovo] = useState({ data: '', descricao: '', debito: '', credito: '', valor: '' });
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const [showContaForm, setShowContaForm] = useState(false);
  const [novaConta, setNovaConta] = useState({ codigo: '', nome: '', tipo: '', subTipo: '', subTipo2: '' });
  // Regras de exibição dos campos do formulário de conta
  const tipos = ['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA'];
  const subTiposAtivo = ['CIRCULANTE', 'NAO_CIRCULANTE'];
  const subTiposPassivo = ['CIRCULANTE', 'NAO_CIRCULANTE'];
  const subTipos2 = ['REALIZAVEL_A_LONGO_PRAZO', 'INVESTIMENTOS', 'IMOBILIZADO', 'INTANGIVEL', 'OUTROS'];

  function handleContaChange(e) {
    setNovaConta({ ...novaConta, [e.target.name]: e.target.value });
  }

  async function adicionarContaHandler(e) {
    e.preventDefault();
    // Validação das regras
    if ((novaConta.tipo === 'ATIVO' || novaConta.tipo === 'PASSIVO') && !novaConta.subTipo) {
      setErro('Selecione o subTipo para ATIVO ou PASSIVO');
      return;
    }
    if (novaConta.tipo === 'PATRIMONIO_LIQUIDO' && (novaConta.subTipo || novaConta.subTipo2)) {
      setErro('PATRIMONIO_LIQUIDO não deve ter subTipo ou subTipo2');
      return;
    }
    if (novaConta.tipo === 'ATIVO' && novaConta.subTipo === 'NAO_CIRCULANTE' && !novaConta.subTipo2) {
      setErro('ATIVO > NAO_CIRCULANTE deve ter subTipo2');
      return;
    }
    if (!(novaConta.tipo === 'ATIVO' && novaConta.subTipo === 'NAO_CIRCULANTE') && novaConta.subTipo2) {
      setErro('subTipo2 só permitido para ATIVO > NAO_CIRCULANTE');
      return;
    }
    try {
      setLoading(true);
      setErro(null);
      const payload = {
        codigo: novaConta.codigo,
        nome: novaConta.nome,
        tipo: novaConta.tipo,
        subTipo: novaConta.subTipo || null,
        subTipo2: novaConta.subTipo2 || null,
        empresaId: userId
      };
      await addContaContabil(payload);
      const contasAtualizadas = await getContasContabeis(userId);
      setContas(contasAtualizadas);
      setNovaConta({ codigo: '', nome: '', tipo: '', subTipo: '', subTipo2: '' });
      setShowContaForm(false);
    } catch (err) {
      setErro(err?.message || 'Erro ao adicionar conta');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [lancData, contasData] = await Promise.all([
          getLancamentos(userId),
          getContasContabeis(userId)
        ]);
        setLancamentos(lancData);
        setContas(contasData);
      } catch (err) {
        setErro(err?.message || 'Erro ao buscar dados');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

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
        valor: Number(novo.valor),
        empresaId: userId
      };
      await addLancamento(payload);
      const dataAtualizada = await getLancamentos(userId);
      setLancamentos(dataAtualizada);
      setNovo({ data: '', descricao: '', debito: '', credito: '', valor: '' });
      setShowForm(false);
      const novaTotalPaginas = Math.ceil((dataAtualizada.length) / porPagina);
      setPagina(novaTotalPaginas);
    } catch (err) {
      setErro(err?.message || 'Erro ao adicionar lançamento');
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
          <div style={{ display: 'flex', gap: 8 }}>
            <AddButton onClick={() => setShowContaForm(!showContaForm)} title="Nova conta" style={{ fontSize: 14, width: 140 }}>Nova Conta+</AddButton>
            <AddButton onClick={() => setShowForm(!showForm)} title="Novo lançamento">+</AddButton>
          </div>
        </div>
        {showContaForm && (
          <Form onSubmit={adicionarContaHandler} style={{ marginBottom: 16 }}>
            <Input type="text" name="codigo" value={novaConta.codigo} onChange={handleContaChange} placeholder="Código" required minLength={2} />
            <Input type="text" name="nome" value={novaConta.nome} onChange={handleContaChange} placeholder="Nome" required minLength={2} />
            <Select name="tipo" value={novaConta.tipo} onChange={handleContaChange} required>
              <option value="">Tipo</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            {/* subTipo para ATIVO ou PASSIVO */}
            {(novaConta.tipo === 'ATIVO' || novaConta.tipo === 'PASSIVO') && (
              <Select name="subTipo" value={novaConta.subTipo} onChange={handleContaChange} required>
                <option value="">SubTipo</option>
                {(novaConta.tipo === 'ATIVO' ? subTiposAtivo : subTiposPassivo).map(st => <option key={st} value={st}>{st}</option>)}
              </Select>
            )}
            {/* subTipo2 só para ATIVO > NAO_CIRCULANTE */}
            {(novaConta.tipo === 'ATIVO' && novaConta.subTipo === 'NAO_CIRCULANTE') && (
              <Select name="subTipo2" value={novaConta.subTipo2} onChange={handleContaChange} required>
                <option value="">SubTipo2</option>
                {subTipos2.map(st2 => <option key={st2} value={st2}>{st2}</option>)}
              </Select>
            )}
            <SaveButton type="submit">Salvar Conta</SaveButton>
          </Form>
        )}
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
