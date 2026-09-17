import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";

const pct = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "";

export function PayslipCard({ result }: { result: ComparisonResult }) {
  const { payslip, netEffective } = result.clt;

  const rows = [
    { label: "Salário", reference: "30/30", earning: payslip.salary, discount: 0 },
    { label: "Ajuda de custo", reference: "", earning: payslip.allowance, discount: 0 },
    { label: "INSS", reference: pct(payslip.inss, payslip.salary), earning: 0, discount: payslip.inss },
    { label: "IRRF", reference: "", earning: 0, discount: payslip.irrf },
    { label: "Plano de saúde", reference: "", earning: 0, discount: payslip.healthPlanDiscount },
    { label: "Vale-transporte", reference: "até 6%", earning: 0, discount: payslip.transportVoucherDiscount },
  ].filter((row) => row.label === "Salário" || row.label === "INSS" || row.earning > 0 || row.discount > 0.004);

  return (
    <section className="card">
      <h3 className="card-title">Seu holerite do mês (CLT)</h3>
      <p className="card-subtitle">
        Para conferir com o seu holerite de um mês comum. A comparação com o PJ usa a{" "}
        <strong>média do ano</strong> ({formatCurrency(netEffective)}/mês), que soma 13º, 1/3 de
        férias, FGTS e benefícios — por isso os dois valores são diferentes.
      </p>

      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Referência</th>
              <th>Vencimentos</th>
              <th>Descontos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="reference">{row.reference}</td>
                <td>{row.earning > 0 ? formatCurrency(row.earning) : ""}</td>
                <td className={row.discount > 0 ? "negative" : "empty"}>
                  {row.label === "IRRF" || row.discount > 0 ? formatCurrency(row.discount) : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Totais</th>
              <td />
              <td>{formatCurrency(payslip.totalEarnings)}</td>
              <td>{formatCurrency(payslip.totalDiscounts)}</td>
            </tr>
            <tr>
              <th scope="row">Valor líquido</th>
              <td />
              <td colSpan={2}>{formatCurrency(payslip.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="payslip-fgts">
        FGTS do mês: {formatCurrency(payslip.fgts)} (depositado pela empresa, não sai do salário).
        Diferença de centavos no INSS é arredondamento do sistema de folha.
      </p>
    </section>
  );
}
