import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getIndicadores } from '../services/relatorios';
import { useUser } from '../contexts/UserContext';

const Container = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 24px;
`;
const Card = styled.div`
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0001;
  padding: 20px;
  margin-top: 16px;
`;
const Title = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #2563eb;
  margin: 0 0 8px 0;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin-top: 10px;
`;
const Th = styled.th`
  padding: 8px;
  border: 1px solid #eee;
  background: #2563eb;
  color: #fff;
  text-align: left;
`;
const Td = styled.td`
  padding: 8px;
  border: 1px solid #eee;
  color: #2563eb;
  text-align: right;
`;

const fmtNum = (v) => {
  if (v == null) return '—';
  const n = Number(v);
  if (isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};

const fmtPct = (v) => {
  if (v == null) return '—';
  const n = Number(v);
  if (isNaN(n)) return '—';
  // se entre -1 e 1, mostra como porcentagem; caso contrário exibe com 2 casas
  if (Math.abs(n) <= 1) return `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export default function Indicadores() {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      setErro(null);
      try {
        const resp = await getIndicadores(userId);
        if (!mounted) return;
        setData(resp);
      } catch (e) {
        console.error('Erro ao carregar indicadores', e);
        setErro('Erro ao carregar indicadores');
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (userId) fetch();
    return () => { mounted = false; };
  }, [userId]);

  return (
    <Container>
      <Title>Indicadores Financeiros</Title>
      <Card>
        {loading ? (
          <div style={{ padding: 12 }}>Carregando indicadores...</div>
        ) : erro ? (
          <div style={{ color: 'red', padding: 12 }}>{erro}</div>
        ) : !data ? (
          <div style={{ padding: 12 }}>Nenhum indicador disponível.</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Indicador</Th>
                <Th style={{ textAlign: 'right' }}>Valor</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td style={{ textAlign: 'left' }}>Liquidez Imediata</Td>
                <Td>{fmtNum(data.liquidezImediata)}</Td>
              </tr>
              <tr>
                <Td style={{ textAlign: 'left' }}>Liquidez Seca</Td>
                <Td>{fmtNum(data.liquidezSeca)}</Td>
              </tr>
              <tr>
                <Td style={{ textAlign: 'left' }}>Liquidez Corrente</Td>
                <Td>{fmtNum(data.liquidezCorrente)}</Td>
              </tr>
              <tr>
                <Td style={{ textAlign: 'left' }}>Liquidez Geral</Td>
                <Td>{fmtNum(data.liquidezGeral)}</Td>
              </tr>
              <tr>
                <Td style={{ textAlign: 'left' }}>Solvência Geral</Td>
                <Td>{fmtNum(data.solvenciaGeral)}</Td>
              </tr>
              <tr>
                <Td style={{ textAlign: 'left' }}>ROA</Td>
                <Td>{fmtPct(data.roa)}</Td>
              </tr>
              <tr>
                <Td style={{ textAlign: 'left' }}>ROE</Td>
                <Td>{fmtPct(data.roe)}</Td>
              </tr>
              <tr>
                <Td style={{ textAlign: 'left' }}>ROI</Td>
                <Td>{fmtPct(data.roi)}</Td>
              </tr>
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}
