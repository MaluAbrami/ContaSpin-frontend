import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getDRE } from "../services/relatorios";
import { useUser } from "../contexts/UserContext";

/* Styled */
const Container = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 24px;
  background: #f6f9ff;
`;
const Card = styled.div`
  width: 100%;
  max-width: 1100px;
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
  margin: 0;
`;
const Subtitle = styled.p`
  color: #2563eb;
  margin: 6px 0 0 0;
`;
const Actions = styled.div`
  display:flex;
  justify-content:flex-end;
  width:100%;
  margin:12px 0;
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
  text-align: ${(p) => p.align || "left"};
`;
const Td = styled.td`
  padding: 8px;
  border: 1px solid #eee;
  color: #2563eb;
  text-align: ${(p) => p.align || "left"};
`;
const SectionTitle = styled.h3`
  color: #2563eb;
  margin: 18px 0 6px 0;
  font-size: 16px;
`;

/* util de formatação */
const format = (v) =>
  typeof v === "number"
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
    : v;

/* componente */
export default function DREVisual() {
  const pdfRef = useRef(null);
  const { userId } = useUser();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [dreApi, setDreApi] = useState(null); // conteúdo retornado pela API conforme DreResponseDTO
  const [dateIso, setDateIso] = useState(() => new Date().toISOString().split("T")[0]); // yyyy-mm-dd

  useEffect(() => {
    let mounted = true;
    const fetchDRE = async () => {
      setLoading(true);
      setErro(null);

      try {
        // envie a data em formato yyyy-mm-dd (LocalDate no backend)
        const resp = await getDRE(userId, dateIso);
        // resp espera conter: receitaLiquida, custos, contasDespesas: [{Valor, NomeContaDespesa}], possivelmente receitas/despesas financeiras
        if (!mounted) return;

        // armazena a resposta como está — o backend fornece os valores prontos
        setDreApi(resp);
        console.debug("DRE API response:", resp);

      } catch (err) {
        console.error("Erro ao buscar DRE:", err);
        setErro("Falha ao carregar DRE");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDRE();
    return () => {
      mounted = false;
    };
  }, [userId, dateIso]);

  /* Os cálculos são realizados no backend. Aqui derivamos apenas valores seguros para exibição */
  const receitaLiquida = Number(dreApi?.receitaLiquida ?? 0);
  const custos = Number(dreApi?.custos ?? dreApi?.custo ?? 0);
  const lucroBruto = Number(dreApi?.lucroBruto ?? 0);
  const contasDespesa = Array.isArray(dreApi?.contasDespesa)
    ? dreApi.contasDespesa
    : Array.isArray(dreApi?.contasDespesas)
    ? dreApi.contasDespesas
    : [];
  const lucroLiquido = Number(dreApi?.lucroLiquido ?? 0);

  /* exportar PDF */
  const exportarPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgW = pageW - 40;
      const imgH = (imgProps.height * imgW) / imgProps.width;

      if (imgH <= pdf.internal.pageSize.getHeight() - 40) {
        pdf.addImage(imgData, "PNG", 20, 20, imgW, imgH);
      } else {
        let heightLeft = imgH;
        let position = 20;
        let y = 0;
        const pageInner = pdf.internal.pageSize.getHeight() - 40;
        while (heightLeft > 0) {
          pdf.addImage(imgData, "PNG", 20, 20 - y, imgW, imgH);
          heightLeft -= pageInner;
          y += pageInner;
          if (heightLeft > 0) pdf.addPage();
        }
      }
      pdf.save("DRE_visual.pdf");
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF");
    }
  };

  return (
    <Container>
      <Title>Balanço Patrimonial / DRE</Title>
      <Subtitle>Visualização do Demonstrativo do Resultado do Exercício</Subtitle>

      <Actions>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* input para trocar a data visualmente */}
          <input
            type="date"
            value={dateIso}
            onChange={(e) => setDateIso(e.target.value)}
            style={{ padding: 6, borderRadius: 6, border: "1px solid #ddd" }}
          />
          <button
            onClick={exportarPDF}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Exportar PDF
          </button>
        </div>
      </Actions>

      <Card ref={pdfRef} id="dre-visual-card">
        {loading ? (
          <div style={{ padding: 12 }}>Carregando DRE...</div>
        ) : erro ? (
          <div style={{ color: "red", padding: 12 }}>{erro}</div>
        ) : (
          <>
            {/* Exibição simplificada: usamos apenas os campos providos pelo backend */}

            <SectionTitle>DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO</SectionTitle>

            <Table>
              <thead>
                <tr>
                  <Th>Descrição</Th>
                  <Th align="right">Atual</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>RECEITA LÍQUIDA</Td>
                  <Td align="right">{format(receitaLiquida)}</Td>
                </tr>

                <tr>
                  <Td>(-) Custo</Td>
                  <Td align="right">{format(custos)}</Td>
                </tr>

                <tr style={{ fontWeight: 700 }}>
                  <Td>LUCRO BRUTO</Td>
                  <Td align="right">{format(lucroBruto)}</Td>
                </tr>

                {/* renderizar cada conta de despesa vindo do backend */}
                {contasDespesa && contasDespesa.length > 0 ? (
                  contasDespesa.map((c, idx) => {
                    const val = Number(c.Valor ?? c.valor ?? 0);
                    const nome =
                      (typeof c.NomeContaDespesa === "string" && c.NomeContaDespesa.trim()) ||
                      (typeof c.nomeContaDespesa === "string" && c.nomeContaDespesa.trim()) ||
                      (typeof c.nome === "string" && c.nome.trim()) ||
                      (typeof c.Nome === "string" && c.Nome.trim()) ||
                      (typeof c.descricao === "string" && c.descricao.trim()) ||
                      (typeof c.Descricao === "string" && c.Descricao.trim()) ||
                      null;
                    const displayName = nome ?? `Despesa ${idx + 1}`;
                    return (
                      <tr key={idx}>
                        <Td>{displayName}</Td>
                        <Td align="right">- {format(val)}</Td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr>
                      <Td>Sem contas de despesa</Td>
                      <Td align="right">- {format(0)}</Td>
                    </tr>
                  </>
                )}

                <tr style={{ fontWeight: 900, background: "#e6f2ff" }}>
                  <Td>LUCRO LÍQUIDO</Td>
                  <Td align="right">{format(lucroLiquido)}</Td>
                </tr>
              </tbody>
            </Table>
          </>
        )}
      </Card>
    </Container>
  );
}
