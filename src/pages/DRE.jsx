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
  const [dreApi, setDreApi] = useState(null); // conteúdo retornado pela API
  const [dateIso, setDateIso] = useState(() => new Date().toISOString().split("T")[0]); // yyyy-mm-dd

  // Dados derivados / calculados localmente
  const [receitaBruta, setReceitaBruta] = useState(0);
  const [impostos, setImpostos] = useState(0);
  const [devolucoes, setDevolucoes] = useState(0);
  const [receitaLiquida, setReceitaLiquida] = useState(0);
  const [custo, setCusto] = useState(0);
  const [contasDespesas, setContasDespesas] = useState([]); // array de { Valor, NomeContaDespesa }
  const [receitasFinanceiras, setReceitasFinanceiras] = useState(0);
  const [despesasFinanceiras, setDespesasFinanceiras] = useState(0);

  // alíquotas
  const ALIQ_IRPJ = 0.15;
  const ALIQ_CSLL = 0.09;

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

        setDreApi(resp);

        // exemplo: definir campos base a partir do retorno (ajuste conforme shape real)
        setReceitaBruta(resp.receitaBruta ?? 0);
        setImpostos(resp.impostosSobreVenda ?? 0);
        setDevolucoes(resp.devolucoes ?? 0);

        // receita líquida pode vir calculada do backend; se não, calcule
        const rl = resp.receitaLiquida ?? ( (resp.receitaBruta ?? 0) - (resp.impostosSobreVenda ?? 0) - (resp.devolucoes ?? 0) );
        setReceitaLiquida(Number(rl ?? 0));

        // custo (pode ser um número, ou um array dependendo do seu backend)
        setCusto(Number(resp.custos ?? resp.custo ?? 0));

        // contas de despesa — array de ContasDespesasDreDTO
        setContasDespesas(Array.isArray(resp.contasDespesas) ? resp.contasDespesas : []);

        setReceitasFinanceiras(Number(resp.receitasFinanceiras ?? 0));
        setDespesasFinanceiras(Number(resp.despesasFinanceiras ?? resp.contasDespesasFinanceiras ?? 0));

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

  /* cálculos */
  const somaDespesas = () => {
    if (!contasDespesas || contasDespesas.length === 0) return 0;
    return contasDespesas.reduce((acc, c) => {
      // backend usa BigDecimal -> provavelmente string; proteger
      const val = Number(c.Valor ?? c.valor ?? 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const lucroBruto = receitaLiquida - custo;
  const totalDespesasOperacionais = somaDespesas();
  const resultadoAntesReceitasDespesasFinanceiras = lucroBruto - totalDespesasOperacionais;
  const resultadoFinanceiro = Number(receitasFinanceiras || 0) - Number(despesasFinanceiras || 0);
  const resultadoAntesTributos = resultadoAntesReceitasDespesasFinanceiras + resultadoFinanceiro;

  const irpj = resultadoAntesTributos > 0 ? resultadoAntesTributos * ALIQ_IRPJ : 0;
  const csll = resultadoAntesTributos > 0 ? resultadoAntesTributos * ALIQ_CSLL : 0;
  const lucroLiquido = resultadoAntesTributos - irpj - csll;

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
            {/* Nota explicativa / Receita */}
            <Table>
              <thead>
                <tr>
                  <Th>Conta</Th>
                  <Th align="right">Atual</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Receita Bruta</Td>
                  <Td align="right">{format(Number(receitaBruta || 0))}</Td>
                </tr>
                <tr>
                  <Td>(-) Impostos sobre a Venda</Td>
                  <Td align="right">{format(Number(impostos || 0))}</Td>
                </tr>
                <tr>
                  <Td>(-) Devoluções</Td>
                  <Td align="right">{format(Number(devolucoes || 0))}</Td>
                </tr>
                <tr style={{ background: "#f3f6fa", fontWeight: 700 }}>
                  <Td>Receita Líquida</Td>
                  <Td align="right">{format(Number(receitaLiquida || 0))}</Td>
                </tr>
              </tbody>
            </Table>

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
                  <Td align="right">{format(Number(receitaLiquida || 0))}</Td>
                </tr>

                <tr>
                  <Td>(-) Custo</Td>
                  <Td align="right">{format(Number(custo || 0))}</Td>
                </tr>

                <tr style={{ fontWeight: 700 }}>
                  <Td>LUCRO BRUTO</Td>
                  <Td align="right">{format(Number(lucroBruto || 0))}</Td>
                </tr>

                {/* renderizar cada conta de despesa vindo do backend */}
                {contasDespesas && contasDespesas.length > 0 ? (
                  contasDespesas.map((c, idx) => {
                    const val = Number(c.Valor ?? c.valor ?? 0);
                    const nome = c.NomeContaDespesa ?? c.nomeContaDespesa ?? c.nome ?? `Despesa ${idx + 1}`;
                    return (
                      <tr key={idx}>
                        <Td>{nome}</Td>
                        <Td align="right">- {format(val)}</Td>
    
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr>
                      <Td>Água/Luz</Td>
                      <Td align="right">- {format(0)}</Td>

                    </tr>
                    <tr>
                      <Td>Salários</Td>
                      <Td align="right">- {format(0)}</Td>

                    </tr>
                  </>
                )}

                <tr style={{ fontWeight: 700, background: "#f3f6fa" }}>
                  <Td>RESULTADO ANTES DAS RECEITAS E DESPESAS FINANCEIRAS</Td>
                  <Td align="right">{format(resultadoAntesReceitasDespesasFinanceiras)}</Td>
                </tr>

                <tr>
                  <Td>Receita Financeira</Td>
                  <Td align="right">{format(Number(receitasFinanceiras || 0))}</Td>
                </tr>

                <tr>
                  <Td>Despesa Financeira</Td>
                  <Td align="right">- {format(Number(despesasFinanceiras || 0))}</Td>
                </tr>

                <tr style={{ fontWeight: 700 }}>
                  <Td>RESULTADO ANTES DOS TRIBUTOS SOBRE O LUCRO</Td>
                  <Td align="right">{format(resultadoAntesTributos)}</Td>
                </tr>

                <tr>
                  <Td>15% - IRPJ</Td>
                  <Td align="right">- {format(irpj)}</Td>
                </tr>

                <tr>
                  <Td>9% - CSLL</Td>
                  <Td align="right">- {format(csll)}</Td>
                </tr>

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
