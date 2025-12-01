import React, { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import styled from 'styled-components';
import { getBalancoPatrimonialByDate } from '../services/relatorios';
import { useUser } from '../contexts/UserContext';

/* --- Styled (mantive os seus) --- */
const Container = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 16px;
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
  text-align: ${(p) => p.align || 'left'};
`;
const Td = styled.td`
  padding: 8px;
  border: 1px solid #eee;
  color: #2563eb;
  text-align: ${(p) => p.align || 'left'};
`;
const Col = styled.div`
  flex: 1;
  min-width: 320px;
`;
const Row = styled.div`
  display: flex;
  gap: 32px;
`;
const Filters = styled.div`
  width: 100%;
  max-width: 1100px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 8px;
`;
const Button = styled.button`
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-weight: 600;
  cursor: pointer;
`;
/* -------------------------------- */

const fmt = (v) =>
  typeof v === 'number'
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : v;

/* (removida) anteriormente havia formatação legível das datas — agora mostramos apenas o input */

/* tenta extrair valores do nó (vários nomes possíveis) */
const extractValue = (node) => {
  if (!node) return 0;
  // backend pode retornar estrutura com campos: valor, Valor, valorAtual, valorInicial, valorAtual.valor etc.
  const vCandidates = [
    node.valorAtual, node.ValorAtual, node.valor_atual, node.valorAtual?.atual,
    node.valorInicial, node.ValorInicial, node.valor_inicial, node.valorInicial?.atual,
    node.valor, node.Valor, node.valorTotal, node.total,
    node.inicial, node.Inicial, node.atual, node.Atual
  ];
  for (const c of vCandidates) {
    if (typeof c === 'number') return c;
    if (typeof c === 'string' && !isNaN(Number(c))) return Number(c);
    if (c && typeof c === 'object' && (typeof c.atual === 'number' || typeof c.atual === 'string')) {
      return Number(c.atual);
    }
  }
  return 0;
};

/* renderiza recursivamente comparando dois nós
   nodeA: nó retornado para dateA (Atual)
   nodeB: nó retornado para dateB (Inicial)
   nivel: recuo visual */
function renderTreeCompare(nodeA, nodeB, nivel = 0) {
  // se ambos vazios, nada pra renderizar
  if (!nodeA && !nodeB) return null;

  // preferir label/codigo de nodeA, senão nodeB
  const nome = nodeA?.nome ?? nodeB?.nome ?? nodeA?.Nome ?? nodeB?.Nome ?? '—';
  const codigo = nodeA?.codigo ?? nodeB?.codigo ?? nodeA?.Codigo ?? nodeB?.Codigo;

  // extrai valores
  const valA = extractValue(nodeA);
  const valB = extractValue(nodeB);

  // filhos: tentar casar por código/nome primeiro, senão por posição
  const filhosA = nodeA?.filhos ?? nodeA?.children ?? nodeA?.nodes ?? [];
  const filhosB = nodeB?.filhos ?? nodeB?.children ?? nodeB?.nodes ?? [];

  // render current row
  const rows = [
    <tr key={`${codigo ?? nome}-root`} >
      <Td style={{ paddingLeft: 16 + nivel * 24, fontWeight: nivel === 0 ? 700 : 400 }}>
        {codigo ? `${codigo} - ` : ''}{nome}
      </Td>
      <Td align="right" style={{ fontWeight: nivel === 0 ? 700 : 400 }}>
        {fmt(valA)}
      </Td>
      <Td align="right" style={{ fontWeight: nivel === 0 ? 700 : 400 }}>
        {fmt(valB)}
      </Td>
    </tr>
  ];

  // cria mapa de filhosB por chave (codigo ou nome) para casar com filhosA
  const mapB = new Map();
  for (const fb of filhosB) {
    const key = fb?.codigo ?? fb?.Codigo ?? fb?.nome ?? fb?.Nome ?? null;
    if (key != null) mapB.set(String(key), fb);
  }

  const usedB = new Set();

  // primeiro, percorre filhosA e tenta casar com mapB
  for (let i = 0; i < filhosA.length; i++) {
    const fa = filhosA[i];
    let fb = null;
    const keyA = fa?.codigo ?? fa?.Codigo ?? fa?.nome ?? fa?.Nome ?? null;
    if (keyA != null && mapB.has(String(keyA))) {
      fb = mapB.get(String(keyA));
      usedB.add(fb);
    } else {
      // fallback por posição
      fb = filhosB[i] ?? null;
      if (fb) usedB.add(fb);
    }
    rows.push(...(renderTreeCompare(fa, fb, nivel + 1) || []));
  }

  // depois, renderiza filhosB que não foram usados
  for (const fb of filhosB) {
    if (usedB.has(fb)) continue;
    rows.push(...(renderTreeCompare(null, fb, nivel + 1) || []));
  }

  return rows;
}

function usePdfExportStyle() {
  useEffect(() => {
    if (!document.head.querySelector('style#pdf-export-style')) {
      const style = document.createElement('style');
      style.id = 'pdf-export-style';
      style.textContent = `
        .pdf-export { font-size: 12px !important; max-width: 1000px !important; }
        .pdf-export table { font-size: 12px !important; }
        .pdf-export th, .pdf-export td { padding: 4px 6px !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);
}

export default function BalancoComparativo() {
  const { userId } = useUser();
  const [dadosA, setDadosA] = useState(null); // resposta para dateA (Atual)
  const [dadosB, setDadosB] = useState(null); // resposta para dateB (Inicial)
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const pdfRef = useRef();
  usePdfExportStyle();

  // defaults: hoje e início do mês anterior (exemplo)
  const today = new Date();
  const defaultA = today.toISOString().split('T')[0]; // hoje
  const prevMonthStart = (() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return d.toISOString().split('T')[0];
  })();

  const [dateA, setDateA] = useState(defaultA);
  const [dateB, setDateB] = useState(prevMonthStart);

  const fetchBoth = async (dA = dateA, dB = dateB) => {
    // garante formato yyyy-MM-dd (inputs já retornam esse formato)
    setLoading(true);
    setErro(null);

    try {
      // faz duas requisições em paralelo
      const [respA, respB] = await Promise.all([
        getBalancoPatrimonialByDate(userId, dA),
        getBalancoPatrimonialByDate(userId, dB)
      ]);

        console.debug('Balanco respA:', respA);
        console.debug('Balanco respB:', respB);

        setDadosA(respA);
        setDadosB(respB);
    } catch (err) {
      console.error('Erro ao buscar comparativo:', err);
      setErro(err?.message || 'Erro ao buscar balanço comparativo');
      setDadosA(null);
      setDadosB(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // busca sempre que o usuário ou as datas mudarem
    fetchBoth(dateA, dateB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, dateA, dateB]);

  function exportarPDF() {
    if (!pdfRef.current) return;
    const el = pdfRef.current;
    el.classList.add('pdf-export');
    html2pdf().set({
      margin: 0.2,
      filename: `balanco_comparativo_${dateA}_vs_${dateB}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    }).from(el).save().then(() => {
      el.classList.remove('pdf-export');
    }).catch(() => {
      el.classList.remove('pdf-export');
    });
  }

  /* helper para obter totals de um nó raiz */
  const getTotals = (node) => {
    if (!node) return { atual: 0, inicial: 0 };

    // se node for array, soma recursivamente
    if (Array.isArray(node)) {
      let sumAtual = 0;
      let sumInicial = 0;
      for (const n of node) {
        const t = getTotals(n);
        sumAtual += Number(t.atual || 0);
        sumInicial += Number(t.inicial || 0);
      }
      return { atual: sumAtual, inicial: sumInicial };
    }

    const atual = extractValue(node);
    // tenta extrair o valor inicial (quando o backend fornece)
    const extractInitial = (n) => {
      if (!n) return 0;
      const cand = [
        n.valorInicial, n.ValorInicial, n.valor_inicial, n.inicial, n.Inicial,
        n.valor?.inicial, n.valor?.Inicial, n.valor?.valorInicial,
        // às vezes o inicial vem em um objeto separado
        n.inicialValor, n.inicial?.valor
      ];
      for (const c of cand) {
        if (typeof c === 'number') return c;
        if (typeof c === 'string' && !isNaN(Number(c))) return Number(c);
        if (c && typeof c === 'object' && (typeof c.inicial === 'number' || typeof c.inicial === 'string')) {
          return Number(c.inicial);
        }
        if (c && typeof c === 'object' && (typeof c.valor === 'number' || typeof c.valor === 'string')) {
          return Number(c.valor);
        }
      }
      return 0;
    };

    const inicial = extractInitial(node);
    return { atual, inicial };
  };

  // logs de totals (ajuda debug quando a UI parece não atualizar)
  useEffect(() => {
    try {
      const tA = getTotals(dadosA?.ativo);
      const tB = getTotals(dadosB?.ativo);
      console.debug('Totals ATIVO A', tA, 'ATIVO B', tB);
    } catch (e) {
      console.debug('Erro ao calcular totals debug', e);
    }
  }, [dadosA, dadosB]);

  // calcular totais uma vez para usar na renderização (evita chamadas repetidas e garante fallback correto)
  const totalsAtivoA = getTotals(dadosA?.ativo);
  const totalsAtivoB = getTotals(dadosB?.ativo);
  const totalsPassivoA = {
    passivo: getTotals(dadosA?.passivoPL).atual || 0,
    pl: getTotals(dadosA?.patrimonioLiquido).atual || 0,
  };
  const totalsPassivoB = {
    passivo: getTotals(dadosB?.passivoPL).inicial || getTotals(dadosB?.passivoPL).atual || 0,
    pl: getTotals(dadosB?.patrimonioLiquido).inicial || getTotals(dadosB?.patrimonioLiquido).atual || 0,
  };

  return (
    <Container>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>Balanço Patrimonial</h2>

      <Filters>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#2563eb', fontWeight: 700 }}>Data atual</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" value={dateA} onChange={(e) => setDateA(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#2563eb', fontWeight: 700 }}>Data comparativa</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" value={dateB} onChange={(e) => setDateB(e.target.value)} />
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button onClick={() => fetchBoth(dateA, dateB)}>Aplicar</Button>
            <Button onClick={exportarPDF}>Exportar PDF</Button>
          </div>
        </div>
      </Filters>

      <Card ref={pdfRef} id="balanco-comparativo" style={{ minWidth: 900, maxWidth: '100%', overflowX: 'auto' }}>
        {erro && <div style={{ color: 'red', marginBottom: 8 }}>{erro}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Carregando comparativo...</div>
        ) : (!dadosA && !dadosB) ? (
          <div style={{ padding: 12 }}>Nenhum dado disponível para as datas selecionadas.</div>
        ) : (
          <Row>
            {/* ATIVO */}
            <Col>
              <h3 style={{ color: '#2563eb', textAlign: 'center', fontWeight: 700 }}>ATIVO</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Conta</Th>
                    <Th align="right">Atual</Th>
                    <Th align="right">Comparativa</Th>
                  </tr>
                </thead>
                <tbody>
                  {/* suporta node raiz ou array */}
                  {Array.isArray(dadosA?.ativo) || Array.isArray(dadosB?.ativo) ? (
                    // se for array, renderiza por índice (tenta casar por posição)
                    (() => {
                      const arrA = Array.isArray(dadosA?.ativo) ? dadosA.ativo : [];
                      const arrB = Array.isArray(dadosB?.ativo) ? dadosB.ativo : [];
                      const max = Math.max(arrA.length, arrB.length);
                      const rows = [];
                      for (let i = 0; i < max; i++) {
                        rows.push(...(renderTreeCompare(arrA[i] ?? null, arrB[i] ?? null) || []));
                      }
                      return rows;
                    })()
                  ) : (
                    renderTreeCompare(dadosA?.ativo ?? null, dadosB?.ativo ?? null)
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total do Ativo</Td>
                    <Td align="right">{fmt(totalsAtivoA.atual)}</Td>
                    <Td align="right">{fmt(totalsAtivoB.inicial || totalsAtivoB.atual)}</Td>
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
                    <Th align="right">Atual</Th>
                    <Th align="right">Comparativa</Th>
                  </tr>
                </thead>
                <tbody>
                  {/* Passivo */}
                  {Array.isArray(dadosA?.passivoPL) || Array.isArray(dadosB?.passivoPL) ? (
                    (() => {
                      const arrA = Array.isArray(dadosA?.passivoPL) ? dadosA.passivoPL : [];
                      const arrB = Array.isArray(dadosB?.passivoPL) ? dadosB.passivoPL : [];
                      const max = Math.max(arrA.length, arrB.length);
                      const rows = [];
                      for (let i = 0; i < max; i++) {
                        rows.push(...(renderTreeCompare(arrA[i] ?? null, arrB[i] ?? null) || []));
                      }
                      return rows;
                    })()
                  ) : (
                    renderTreeCompare(dadosA?.passivoPL ?? null, dadosB?.passivoPL ?? null)
                  )}

                  {/* Patrimônio Líquido */}
                  {Array.isArray(dadosA?.patrimonioLiquido) || Array.isArray(dadosB?.patrimonioLiquido) ? (
                    (() => {
                      const arrA = Array.isArray(dadosA?.patrimonioLiquido) ? dadosA.patrimonioLiquido : [];
                      const arrB = Array.isArray(dadosB?.patrimonioLiquido) ? dadosB.patrimonioLiquido : [];
                      const max = Math.max(arrA.length, arrB.length);
                      const rows = [];
                      for (let i = 0; i < max; i++) {
                        rows.push(...(renderTreeCompare(arrA[i] ?? null, arrB[i] ?? null) || []));
                      }
                      return rows;
                    })()
                  ) : (
                    renderTreeCompare(dadosA?.patrimonioLiquido ?? null, dadosB?.patrimonioLiquido ?? null)
                  )}

                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f6fa', fontWeight: 700 }}>
                    <Td align="right">Total Passivo + PL</Td>
                    <Td align="right">{fmt((totalsPassivoA.passivo || 0) + (totalsPassivoA.pl || 0))}</Td>
                    <Td align="right">{fmt((totalsPassivoB.passivo || 0) + (totalsPassivoB.pl || 0))}</Td>
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
