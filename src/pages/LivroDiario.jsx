import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getLancamentos, addLancamento } from '../services/lancamentos';
import { getContasContabeis, addContaContabil } from '../services/contasContabeis';
import { useUser } from '../contexts/UserContext.jsx';

// --- STYLED COMPONENTS ---
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
  color: white;
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
  height: 36px;
  padding: 0 16px;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: all 0.2s;
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

// --- COMPONENTE PRINCIPAL ---
export default function LivroDiario() {

  const { userId } = useUser();

  const [lancamentos, setLancamentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Estados dos Formulários
  const [showForm, setShowForm] = useState(false);
  const [novo, setNovo] = useState({ data: '', descricao: '', debito: '', credito: '', valor: '' });
  
  const [showContaForm, setShowContaForm] = useState(false);
  const [novaConta, setNovaConta] = useState({ codigo: '', nome: '', tipo: '', subTipo: '', subTipo2: '' });

  // Paginação
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  // Regras de exibição dos campos do formulário de conta
  const tipos = ['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA'];
  const subTiposAtivo = ['CIRCULANTE', 'NAO_CIRCULANTE'];
  const subTiposPassivo = ['CIRCULANTE', 'NAO_CIRCULANTE'];
  const subTipos2 = ['REALIZAVEL_A_LONGO_PRAZO', 'INVESTIMENTOS', 'IMOBILIZADO', 'INTANGIVEL', 'OUTROS'];

  // --- FUNÇÕES DE CARREGAMENTO ---
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
    if (userId) fetchData();
  }, [userId]);

  // --- FUNÇÕES DE CONTA ---
  function handleContaChange(e) {
    setNovaConta({ ...novaConta, [e.target.name]: e.target.value });
  }

  async function adicionarContaHandler(e) {
    e.preventDefault();
    if ((novaConta.tipo === 'ATIVO' || novaConta.tipo === 'PASSIVO') && !novaConta.subTipo) {
      setErro('Selecione o subTipo para ATIVO ou PASSIVO'); return;
    }
    try {
      setLoading(true);
      setErro(null);
      const payload = {
        ...novaConta,
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

  // --- FUNÇÕES DE LANÇAMENTO ---
  function handleChange(e) {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  }

  async function adicionarLancamentoHandler(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const dataFormatada = novo.data ? novo.data.split('-').reverse().join('-') : '';
      
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
      setPagina(Math.ceil((dataAtualizada.length) / porPagina));
    } catch (err) {
      setErro(err?.message || 'Erro ao adicionar lançamento');
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO DE AUTOMAÇÃO (PLANO DE NEGÓCIOS) ---
  async function gerarLancamentosAutomaticos() {
    const transacoes = [
      // 1. Abertura e Subscrição
      { data: '2025-01-02', descricao: 'Subscrição de capital social inicial - Sócios Carlos e Maria', debito: '4.0.4', credito: '4.0.1', valor: 20000.00 },
      // 2. Integralização (Depósito)
      { data: '2025-01-05', descricao: 'Integralização do capital social em dinheiro', debito: '1.0.2', credito: '4.0.4', valor: 20000.00 },
      // 3. Gastos Iniciais
      { data: '2025-01-08', descricao: 'Pgto taxas de abertura (JUCESP/Prefeitura)', debito: '5.1.8', credito: '1.0.2', valor: 450.00 },
      { data: '2025-01-10', descricao: 'Pgto honorários contábeis abertura', debito: '5.1.6', credito: '1.0.2', valor: 1200.00 },
      // 4. Estruturação
      { data: '2025-02-01', descricao: 'Caução aluguel sala comercial SP', debito: '1.0.6', credito: '1.0.2', valor: 2500.00 },
      { data: '2025-02-02', descricao: 'Compra 2 Notebooks Dell Alta Performance', debito: '2.2.5', credito: '1.0.2', valor: 8000.00 },
      { data: '2025-02-03', descricao: 'Compra mobiliário escritório (Cadeiras/Mesas)', debito: '2.2.3', credito: '1.0.2', valor: 3000.00 },
      // 5. Despesas TI e Mkt
      { data: '2025-02-05', descricao: 'Pgto AWS/Azure (Ambiente Testes)', debito: '5.5.1', credito: '1.0.2', valor: 500.00 },
      { data: '2025-02-10', descricao: 'Licenças de Software (IDEs/Design)', debito: '5.5.2', credito: '1.0.2', valor: 800.00 },
      { data: '2025-02-15', descricao: 'Criação Identidade Visual (Agência)', debito: '5.4.1', credito: '3.0.5', valor: 2000.00 },
      // 6. Expansão (Acionistas)
      { data: '2025-03-01', descricao: 'Aumento de Capital - Investidores Externos', debito: '4.0.4', credito: '4.0.1', valor: 80000.00 },
      { data: '2025-03-03', descricao: 'Depósito aporte investidores', debito: '1.0.2', credito: '4.0.4', valor: 80000.00 },
      { data: '2025-03-05', descricao: 'Pgto Agência Marketing (Fatura)', debito: '3.0.5', credito: '1.0.2', valor: 2000.00 },
      { data: '2025-03-10', descricao: 'Investimento Tráfego Pago (Ads)', debito: '5.4.1', credito: '1.0.2', valor: 5000.00 }
    ];

    if (!confirm(`Deseja inserir ${transacoes.length} lançamentos automaticamente?\nCertifique-se de que as Contas Contábeis (ex: 1.0.2, 4.0.1, 5.5.1) já foram cadastradas!`)) {
      return;
    }

    setLoading(true);
    try {
      let contasFaltando = [];
      
      for (const t of transacoes) {
        // Encontra o ID da conta pelo código (ex: '1.0.2')
        const contaDebito = contas.find(c => c.codigo === t.debito);
        const contaCredito = contas.find(c => c.codigo === t.credito);

        if (!contaDebito || !contaCredito) {
          if(!contaDebito) contasFaltando.push(t.debito);
          if(!contaCredito) contasFaltando.push(t.credito);
          console.warn(`Pulei: ${t.descricao} (Conta não achada)`);
          continue;
        }

        // Formata data para dd-MM-yyyy
        const dataFormatada = t.data.split('-').reverse().join('-');

        const payload = {
          descricao: t.descricao,
          contaDebitoId: contaDebito.id || contaDebito.codigo,
          contaCreditoId: contaCredito.id || contaCredito.codigo,
          dataLancamento: dataFormatada,
          valor: Number(t.valor),
          empresaId: userId
        };

        await addLancamento(payload);
      }
      
      if(contasFaltando.length > 0) {
        alert(`Alguns lançamentos falharam pois as contas não existem: ${[...new Set(contasFaltando)].join(', ')}`);
      } else {
        alert('Todos os lançamentos foram gerados com sucesso!');
      }

      const dataAtualizada = await getLancamentos(userId);
      setLancamentos(dataAtualizada);
      setPagina(Math.ceil(dataAtualizada.length / porPagina));
      
    } catch (err) {
      setErro('Erro na automação: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- RENDERIZAÇÃO ---
  const totalPaginas = Math.ceil(lancamentos.length / porPagina);
  const lancamentosPaginados = lancamentos.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <Container>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Livro Diário</h2>
      <p style={{ maxWidth: 500, margin: '1rem auto', fontSize: 20, color: '#2563eb' }}>Registre aqui as movimentações diárias da empresa.</p>
      
      <Card>
        {/* Cabeçalho Unificado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#2563eb' }}>Lançamentos</h3>
          
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Botão Especial */}
            <AddButton 
              onClick={gerarLancamentosAutomaticos} 
              title="Preencher com dados do Plano de Negócios" 
              style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af', width: 'auto' }}
            >
              ⚡ Auto RingEats
            </AddButton>

            <AddButton onClick={() => setShowContaForm(!showContaForm)} title="Nova conta" style={{ width: 'auto' }}>Nova Conta +</AddButton>
            <AddButton onClick={() => setShowForm(!showForm)} title="Novo lançamento" style={{ width: 36 }}>+</AddButton>
          </div>
        </div>

        {/* Formulário de Conta */}
        {showContaForm && (
          <Form onSubmit={adicionarContaHandler} style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <Input type="text" name="codigo" value={novaConta.codigo} onChange={handleContaChange} placeholder="Código (ex: 1.0.1)" required minLength={2} />
            <Input type="text" name="nome" value={novaConta.nome} onChange={handleContaChange} placeholder="Nome da Conta" required minLength={2} />
            <Select name="tipo" value={novaConta.tipo} onChange={handleContaChange} required>
              <option value="">Tipo</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            {(novaConta.tipo === 'ATIVO' || novaConta.tipo === 'PASSIVO') && (
              <Select name="subTipo" value={novaConta.subTipo} onChange={handleContaChange} required>
                <option value="">SubTipo</option>
                {(novaConta.tipo === 'ATIVO' ? subTiposAtivo : subTiposPassivo).map(st => <option key={st} value={st}>{st}</option>)}
              </Select>
            )}
            {(novaConta.tipo === 'ATIVO' && novaConta.subTipo === 'NAO_CIRCULANTE') && (
              <Select name="subTipo2" value={novaConta.subTipo2} onChange={handleContaChange} required>
                <option value="">SubTipo2</option>
                {subTipos2.map(st2 => <option key={st2} value={st2}>{st2}</option>)}
              </Select>
            )}
            <SaveButton type="submit">Salvar Conta</SaveButton>
          </Form>
        )}

        {/* Formulário de Lançamento */}
        {showForm && (
          <Form onSubmit={adicionarLancamentoHandler} style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <Input type="date" name="data" value={novo.data} onChange={handleChange} required />
            <Input type="text" name="descricao" value={novo.descricao} onChange={handleChange} placeholder="Descrição" required minLength={2} style={{flex: 1}} />
            <Select name="debito" value={novo.debito} onChange={handleChange} required>
              <option value="">Débito</option>
              {contas.map((c) => (
                <option key={c.id || c.codigo} value={c.id || c.codigo}>{c.codigo} - {c.nome}</option>
              ))}
            </Select>
            <Select name="credito" value={novo.credito} onChange={handleChange} required>
              <option value="">Crédito</option>
              {contas.map((c) => (
                <option key={c.id || c.codigo} value={c.id || c.codigo}>{c.codigo} - {c.nome}</option>
              ))}
            </Select>
            <Input type="number" name="valor" value={novo.valor} onChange={handleChange} placeholder="R$ 0,00" required min="0" step="0.01" style={{ width: 100 }} />
            <SaveButton type="submit">Lançar</SaveButton>
          </Form>
        )}

        {erro && <div style={{ color: 'red', marginBottom: 16, padding: 8, background: '#fee2e2', borderRadius: 4 }}>{erro}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Carregando dados...</div>
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
                {lancamentosPaginados.length > 0 ? (
                  lancamentosPaginados.map((l, i) => (
                    <tr key={l.id || i}>
                      <Td align="center">{l.dataLancamento || l.data}</Td>
                      <Td>{l.descricao}</Td>
                      <Td align="center">{l.contaDebito?.codigo || l.contaDebito || l.debito}</Td>
                      <Td align="center">{l.contaCredito?.codigo || l.contaCredito || l.credito}</Td>
                      <Td align="right" style={{ fontWeight: 600 }}>
                        {Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan="5" align="center" style={{ padding: 24, color: '#94a3b8' }}>Nenhum lançamento encontrado.</Td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPagina(i + 1)}
                    style={{
                      background: pagina === i + 1 ? '#2563eb' : '#fff',
                      color: pagina === i + 1 ? '#fff' : '#2563eb',
                      border: '1px solid #2563eb',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontWeight: 600,
                      cursor: 'pointer',
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