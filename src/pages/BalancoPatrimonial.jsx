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

function renderTree(node, nivel = 0) {
  if (!node) return null;
  return (
    <>
      <tr>
        <Td style={{ paddingLeft: 16 + nivel * 24, fontWeight: nivel === 0 ? 700 : 400 }}>
          {node.codigo ? `${node.codigo} - ` : ''}{node.nome}
        </Td>
        <Td align="right" style={{ fontWeight: nivel === 0 ? 700 : 400 }}>
          {Number(node.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Td>
      </tr>
      {node.filhos && node.filhos.map((f, i) => renderTree(f, nivel + 1))}
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
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const pdfRef = useRef();
  usePdfExportStyle();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setErro(null);
        const data = await getBalancoPatrimonial(userId);
        setDados(data);
      } catch (err) {
        setErro(err?.message || 'Erro ao buscar balanço patrimonial');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  function exportarPDF() {
    if (!pdfRef.current) return;
    // Aplica classe temporária para exportação
    const el = pdfRef.current;
    el.classList.add('pdf-export');
    html2pdf().set({
      margin: 0.2,
      filename: `balanco-patrimonial.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    }).from(el).save().then(() => {
      el.classList.remove('pdf-export');
    });
  }

  return (
    <Container>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Balanço Patrimonial</h2>
      <p style={{ maxWidth: 500, margin: '1rem auto', fontSize: 20, color: '#2563eb' }}>Veja o balanço patrimonial da empresa.</p>
      <button onClick={exportarPDF} style={{ alignSelf: 'flex-end', marginBottom: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Exportar PDF</button>
      <Card ref={pdfRef} id="balanco-pdf" style={{ minWidth: 900, maxWidth: '100%', overflowX: 'auto' }}>
        {erro && <div style={{ color: 'red', marginBottom: 8 }}>{erro}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Carregando...</div>
        ) : dados && (
          <Row>
            {/* ATIVO */}
            <Col>
              <h3 style={{ color: '#2563eb', textAlign: 'center', fontWeight: 700 }}>ATIVO</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Conta</Th>
                    <Th align="right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {renderTree(dados.ativo)}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total do Ativo</Td>
                    <Td align="right">{Number(dados.ativo.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
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
                    <Th align="right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {renderTree(dados.passivoPL)}
                  {renderTree(dados.patrimonioLiquido)}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total Passivo + PL</Td>
                    <Td align="right">{(Number(dados.passivoPL.valor) + Number(dados.patrimonioLiquido.valor)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
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
