import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getContasContabeis } from '../services/contasContabeis';
import { getLivroRazao } from '../services/relatorios';

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
const Select = styled.select`
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  color: #2563eb;
`;

export default function LivroRazao() {
  const [contas, setContas] = useState([]);
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [dadosRazao, setDadosRazao] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState(null);
  const porPagina = 10;
  const lancamentos = dadosRazao?.lancamentos || [];
  const saldoFinal = dadosRazao?.saldoFinal;
  const totalPaginas = Math.ceil(lancamentos.length / porPagina);
  const lancamentosPaginados = lancamentos.slice((pagina - 1) * porPagina, pagina * porPagina);

  useEffect(() => {
    async function fetchContas() {
      try {
        const data = await getContasContabeis();
        setContas(data);
      } catch (err) {
        setErro(err?.message || 'Erro ao buscar contas');
      }
    }
    fetchContas();
  }, []);

  async function buscarRazao(codigoConta) {
    setErro(null);
    setDadosRazao(null);
    setPagina(1);
    try {
      const data = await getLivroRazao(codigoConta);
      setDadosRazao(data);
    } catch (err) {
      setErro(err?.message || 'Erro ao buscar razão');
    }
  }

  function handleContaChange(e) {
    setContaSelecionada(e.target.value);
    if (e.target.value) {
      buscarRazao(e.target.value);
    } else {
      setDadosRazao(null);
    }
  }

  function mudarPagina(nova) {
    setPagina(nova);
  }

  return (
    <Container>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Livro Razão</h2>
      <p style={{ maxWidth: 500, margin: '1rem auto', fontSize: 20, color: '#2563eb' }}>Visualize o razão das contas da empresa.</p>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label htmlFor="conta" style={{ color: '#2563eb', fontWeight: 600 }}>Conta:</label>
          <Select id="conta" value={contaSelecionada} onChange={handleContaChange}>
            <option value="">Selecione uma conta</option>
            {contas.map((c) => (
              <option key={c.codigo || c.id || c.nome} value={c.codigo}>{c.codigo} - {c.nome}</option>
            ))}
          </Select>
        </div>
        {erro && <div style={{ color: 'red', marginBottom: 8 }}>{erro}</div>}
        {dadosRazao && (
          <>
            {/* Cabeçalho da conta selecionada */}
            <div style={{ marginBottom: 12, color: '#2563eb', fontWeight: 700, fontSize: 20 }}>
              Conta: {contaSelecionada} - {contas.find(c => c.codigo === contaSelecionada)?.nome || ''}
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Descrição</Th>
                  <Th>Débito</Th>
                  <Th>Crédito</Th>
                  <Th>Saldo</Th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let saldo = 0;
                  // Descobre o tipo da conta selecionada
                  const tipoConta = contas.find(c => c.codigo === contaSelecionada)?.tipo || 'ATIVO';
                  // Função de regra contábil para saldo
                  function calculaSaldo(tipo, saldoAtual, lancamento) {
                    const valor = Number(lancamento.valor);
                    if (tipo === 'ATIVO' || tipo === 'DESPESA') {
                      if (lancamento.tipoLancamento === 'DEBITO') return saldoAtual + valor;
                      if (lancamento.tipoLancamento === 'CREDITO') return saldoAtual - valor;
                    } else if (tipo === 'PASSIVO' || tipo === 'PATRIMONIO_LIQUIDO' || tipo === 'RECEITA') {
                      if (lancamento.tipoLancamento === 'CREDITO') return saldoAtual + valor;
                      if (lancamento.tipoLancamento === 'DEBITO') return saldoAtual - valor;
                    }
                    return saldoAtual;
                  }
                  return lancamentosPaginados.map((l, i) => {
                    let debito = '';
                    let credito = '';
                    if (l.tipoLancamento === 'DEBITO') {
                      debito = Number(l.valor);
                    } else if (l.tipoLancamento === 'CREDITO') {
                      credito = Number(l.valor);
                    }
                    saldo = calculaSaldo(tipoConta, saldo, l);
                    return (
                      <tr key={i}>
                        <Td align="center">{l.data}</Td>
                        <Td>{l.descricao}</Td>
                        <Td align="right">{debito ? debito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}</Td>
                        <Td align="right">{credito ? credito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}</Td>
                        <Td align="right">{saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              {/* Rodapé com totais */}
              {saldoFinal && (() => {
                // Regra contábil para saldo final
                const tipoConta = contas.find(c => c.codigo === contaSelecionada)?.tipo || 'ATIVO';
                let saldoFinalValor = 0;
                if (tipoConta === 'ATIVO' || tipoConta === 'DESPESA') {
                  saldoFinalValor = Number(saldoFinal.debitoFinal) - Number(saldoFinal.creditoFinal);
                } else if (tipoConta === 'PASSIVO' || tipoConta === 'PATRIMONIO_LIQUIDO' || tipoConta === 'RECEITA') {
                  saldoFinalValor = Number(saldoFinal.creditoFinal) - Number(saldoFinal.debitoFinal);
                }
                return (
                  <tfoot>
                    <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                      <Td colSpan={2} align="right">Totais:</Td>
                      <Td align="right">{Number(saldoFinal.debitoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td align="right">{Number(saldoFinal.creditoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                      <Td align="right">{saldoFinalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                    </tr>
                  </tfoot>
                );
              })()}
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
