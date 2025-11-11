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

function renderTree(node1, node2, nivel = 0) {
  if (!node1 && !node2) return null;

  const nome = node1?.nome || node2?.nome;
  const codigo = node1?.codigo || node2?.codigo;

  const filhos1 = node1?.filhos || [];
  const filhos2 = node2?.filhos || [];

  const filhos = Array.from(new Set([...filhos1.map(f => f.nome), ...filhos2.map(f => f.nome)]));

  return (
    <>
      <tr>
        <Td style={{ paddingLeft: 16 + nivel * 24, fontWeight: nivel === 0 ? 700 : 400 }}>
          {codigo ? `${codigo} - ` : ''}{nome}
        </Td>
        <Td align="right" style={{ fontWeight: nivel === 0 ? 700 : 400 }}>
          {node1?.valor !== undefined
            ? Number(node1.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '-'}
        </Td>
        <Td align="right" style={{ fontWeight: nivel === 0 ? 700 : 400 }}>
          {node2?.valor !== undefined
            ? Number(node2.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '-'}
        </Td>
      </tr>
      {filhos.map((nomeFilho, i) => {
        const filho1 = filhos1.find(f => f.nome === nomeFilho);
        const filho2 = filhos2.find(f => f.nome === nomeFilho);
        return renderTree(filho1, filho2, nivel + 1);
      })}
    </>
  );
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
  const [dataAtual, setDataAtual] = useState('');
  const [dataComparativa, setDataComparativa] = useState('');
  const [balanco1, setBalanco1] = useState(null);
  const [balanco2, setBalanco2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const pdfRef = useRef();
  usePdfExportStyle();

  async function buscarBalancos() {
    if (!dataAtual || !dataComparativa) {
      setErro('Selecione as duas datas para gerar o balanço comparativo.');
      return;
    }

    try {
      setLoading(true);
      setErro(null);
      const [b1, b2] = await Promise.all([
        getBalancoPatrimonial(userId, dataAtual),
        getBalancoPatrimonial(userId, dataComparativa)
      ]);
      setBalanco1(b1);
      setBalanco2(b2);
    } catch (err) {
      setErro(err?.message || 'Erro ao buscar balanços');
    } finally {
      setLoading(false);
    }
  }

  function exportarPDF() {
    if (!pdfRef.current) return;
    const el = pdfRef.current;
    el.classList.add('pdf-export');
    html2pdf().set({
      margin: 0.2,
      filename: `balanco-patrimonial-comparativo.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    }).from(el).save().then(() => {
      el.classList.remove('pdf-export');
    });
  }

  return (
    <Container>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Balanço Patrimonial</h2>
      <p style={{ maxWidth: 500, margin: '1rem auto', fontSize: 20, color: '#2563eb' }}>
        Compare os balanços patrimoniais entre duas datas.
      </p>

      {/* Seleção de datas */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div>
          <label style={{ color: '#2563eb', fontWeight: 600 }}>Data 1:</label><br />
          <input type="date" value={dataAtual} onChange={e => setDataAtual(e.target.value)} />
        </div>
        <div>
          <label style={{ color: '#2563eb', fontWeight: 600 }}>Data 2:</label><br />
          <input type="date" value={dataComparativa} onChange={e => setDataComparativa(e.target.value)} />
        </div>
        <button
          onClick={buscarBalancos}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}
        >
          Buscar Balanços
        </button>
      </div>

      <button onClick={exportarPDF} style={{ alignSelf: 'flex-end', marginBottom: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Exportar PDF</button>

      <Card ref={pdfRef} id="balanco-pdf" style={{ minWidth: 900, maxWidth: '100%', overflowX: 'auto' }}>
        {erro && <div style={{ color: 'red', marginBottom: 8 }}>{erro}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Carregando...</div>
        ) : (balanco1 && balanco2) && (
          <Row>
            {/* ATIVO */}
            <Col>
              <h3 style={{ color: '#2563eb', textAlign: 'center', fontWeight: 700 }}>ATIVO</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Conta</Th>
                    <Th align="right">{dataAtual}</Th>
                    <Th align="right">{dataComparativa}</Th>
                  </tr>
                </thead>
                <tbody>
                  {renderTree(balanco1.ativo, balanco2.ativo)}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total do Ativo</Td>
                    <Td align="right">
                      {Number(balanco1.ativo.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Td>
                    <Td align="right">
                      {Number(balanco2.ativo.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Td>
                  </tr>
                </tfoot>
              </Table>
            </Col>

            {/* PASSIVO + PL */}
            <Col>
              <h3 style={{ color: '#2563eb', textAlign: 'center', fontWeight: 700 }}>PASSIVO + PATRIMÔNIO LÍQUIDO</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Conta</Th>
                    <Th align="right">{dataAtual}</Th>
                    <Th align="right">{dataComparativa}</Th>
                  </tr>
                </thead>
                <tbody>
                  {renderTree(balanco1.passivoPL, balanco2.passivoPL)}
                  {renderTree(balanco1.patrimonioLiquido, balanco2.patrimonioLiquido)}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total Passivo + PL</Td>
                    <Td align="right">
                      {(Number(balanco1.passivoPL.valor) + Number(balanco1.patrimonioLiquido.valor)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Td>
                    <Td align="right">
                      {(Number(balanco2.passivoPL.valor) + Number(balanco2.patrimonioLiquido.valor)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Td>
                  </tr>
                </tfoot>
              </Table>
            </Col>
          </Row>
        )}
      </Card>
    </Container>
  );
}