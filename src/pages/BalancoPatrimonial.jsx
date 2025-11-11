import React, { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import styled from 'styled-components';
import { getBalancoPatrimonial } from '../services/relatorios';
import { useUser } from '../contexts/UserContext';

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
  max-width: 1100px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  padding: 24px;
  margin-top: 24px;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
`;
const Th = styled.th`
  padding: 8px;
  border: 1px solid #eee;
  background: #2563eb;
  color: #fff;
`;
const Td = styled.td`
  padding: 8px;
  border: 1px solid #eee;
  color: #2563eb;
  text-align: ${props => props.align || 'left'};
`;
const Col = styled.div`
  flex: 1;
  min-width: 320px;
`;
const Row = styled.div`
  display: flex;
  gap: 32px;
`;

function renderTree(node, nivel = 0, showValorNaData = false) {
  if (!node) return null;
  return (
    <>
      <tr>
        <Td style={{ paddingLeft: 16 + nivel * 24, fontWeight: nivel === 0 ? 700 : 400 }}>
          {node.codigo ? `${node.codigo} - ` : ''}{node.nome}
        </Td>
        <Td align="right" style={{ fontWeight: nivel === 0 ? 700 : 400 }}>
          {moeda(node.valorAtual ?? node.valor ?? 0)}
        </Td>
        <Td align="right" style={{ fontWeight: nivel === 0 ? 700 : 400 }}>
          {showValorNaData ? moeda(node.valorNaData ?? node.valor ?? 0) : '-'}
        </Td>
      </tr>
      {node.filhos && node.filhos.map((f, i) => <React.Fragment key={(f.codigo ?? f.nome) + i}>{renderTree(f, nivel + 1, showValorNaData)}</React.Fragment>)}
    </>
  );
}

// cria índice por código/nome na árvore B e mescla valores com a árvore A
function mergeTrees(rootA, rootB) {
  if (!rootA) return null;

  const keyOf = (n) => (n?.codigo ?? n?.nome ?? '').toString();

  const indexB = new Map();
  function indexNodeB(n) {
    if (!n) return;
    indexB.set(keyOf(n), n);
    n.filhos?.forEach(indexNodeB);
  }
  if (rootB) indexNodeB(rootB);

  function build(a) {
    const match = indexB.get(keyOf(a));
    const filhos = a.filhos?.map(build) ?? [];
    const valorAtual = Number(a.valor ?? a.total ?? 0);
    const valorNaData = Number(match?.valor ?? match?.total ?? 0);
    return { ...a, filhos, valorAtual, valorNaData };
  }
  return build(rootA);
}

function moeda(v) {
  if (v === null || v === undefined) return '-';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function usePdfExportStyle() {
  useEffect(() => {
    if (!document.head.querySelector('style#pdf-export-style')) {
      const style = document.createElement('style');
      style.id = 'pdf-export-style';
      style.textContent = `
        .pdf-export { font-size: 12px !important; max-width: 900px !important; }
        .pdf-export table { font-size: 12px !important; max-width: 900px !important; }
        .pdf-export th, .pdf-export td { padding: 4px 6px !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);
}

export default function BalancoPatrimonial() {
  const { userId } = useUser();
  const [dados, setDados] = useState(null); // balanço "atual"
  const [dadosNaData, setDadosNaData] = useState(null); // balanço na data selecionada
  const [dataEscolhida, setDataEscolhida] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const pdfRef = useRef();
  usePdfExportStyle();

  useEffect(() => {
    let alive = true;
    async function fetchAtual() {
      try {
        setLoading(true);
        setErro(null);
        const resp = await getBalancoPatrimonial(userId);
        if (!alive) return;
        setDados(resp);
      } catch (e) {
        if (!alive) return;
        setErro(e?.message || 'Erro ao buscar balanço');
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (userId) fetchAtual();
    return () => { alive = false; };
  }, [userId]);

  useEffect(() => {
    let alive = true;
    async function fetchNaData() {
      if (!dataEscolhida) {
        setDadosNaData(null);
        return;
      }
      try {
        setLoading(true);
        setErro(null);
        const resp = await getBalancoPatrimonial(userId, { data: dataEscolhida });
        if (!alive) return;
        setDadosNaData(resp);
      } catch (e) {
        if (!alive) return;
        setErro(e?.message || 'Erro ao buscar balanço na data');
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (userId) fetchNaData();
    return () => { alive = false; };
  }, [userId, dataEscolhida]);

  const ativo = mergeTrees(dados?.ativo, dadosNaData?.ativo);
  const passivoPL = mergeTrees(dados?.passivoPL ?? dados?.passivo, dadosNaData?.passivoPL ?? dadosNaData?.passivo);
  const patrimonioLiquido = mergeTrees(dados?.patrimonioLiquido, dadosNaData?.patrimonioLiquido);

  const showValorNaData = Boolean(dataEscolhida);

  function exportarPDF() {
    if (!pdfRef.current) return;
    html2pdf().set({
      margin: 0.2,
      filename: `balanco-patrimonial${dataEscolhida ? `-${dataEscolhida}` : ''}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    }).from(pdfRef.current).save();
  }

  const totalAtivoAtual = ativo?.valorAtual ?? 0;
  const totalAtivoNaData = ativo?.valorNaData ?? 0;
  const totalPassivoPLAtual = (passivoPL?.valorAtual ?? 0) + (patrimonioLiquido?.valorAtual ?? 0);
  const totalPassivoPLNaData = (passivoPL?.valorNaData ?? 0) + (patrimonioLiquido?.valorNaData ?? 0);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label htmlFor="data" style={{ fontWeight: 600, color: '#2563eb' }}>Data de referência:</label>
        <input
          id="data"
          type="date"
          value={dataEscolhida}
          onChange={(e) => setDataEscolhida(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button onClick={exportarPDF} style={{ marginLeft: 'auto', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>
          Exportar PDF
        </button>
      </div>

      <div ref={pdfRef} style={{ marginTop: 16 }} className="pdf-export">
        {erro && <div style={{ color: 'red', marginBottom: 8 }}>{erro}</div>}
        {loading && !dados ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Carregando...</div>
        ) : (
          <Row>
            <Col>
              <h3 style={{ color: '#2563eb', textAlign: 'center', fontWeight: 700 }}>ATIVO</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Conta</Th>
                    <Th align="right">Valor Atual</Th>
                    <Th align="right">Valor na Data</Th>
                  </tr>
                </thead>
                <tbody>
                  {renderTree(ativo, 0, showValorNaData)}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total do Ativo</Td>
                    <Td align="right">{moeda(totalAtivoAtual)}</Td>
                    <Td align="right">{showValorNaData ? moeda(totalAtivoNaData) : '-'}</Td>
                  </tr>
                </tfoot>
              </Table>
            </Col>

            <Col>
              <h3 style={{ color: '#2563eb', textAlign: 'center', fontWeight: 700 }}>PASSIVO + PATRIMÔNIO LÍQUIDO</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Conta</Th>
                    <Th align="right">Valor Atual</Th>
                    <Th align="right">Valor na Data</Th>
                  </tr>
                </thead>
                <tbody>
                  {renderTree(passivoPL, 0, showValorNaData)}
                  {renderTree(patrimonioLiquido, 0, showValorNaData)}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total Passivo + PL</Td>
                    <Td align="right">{moeda(totalPassivoPLAtual)}</Td>
                    <Td align="right">{showValorNaData ? moeda(totalPassivoPLNaData) : '-'}</Td>
                  </tr>
                </tfoot>
              </Table>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
}
