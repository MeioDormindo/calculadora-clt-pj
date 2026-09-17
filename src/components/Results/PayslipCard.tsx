import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";

const pct = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "";

export function PayslipCard({ result }: { result: ComparisonResult }) {
  const { payslip, netEffective, thirteenthNet, vacationBonusNet, externalIncome } = result.clt;

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
        Deve bater com o líquido do seu holerite num mês comum, sem 13º nem férias. Mais abaixo, a
        conta que leva deste valor à média usada na comparação com o PJ.
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

      <div className="payslip-bridge">
        <p className="payslip-bridge-title">Do holerite à média mensal do ano</p>
        <dl>
          <div>
            <dt>Líquido no holerite</dt>
            <dd>{formatCurrency(payslip.net)}</dd>
          </div>
          <div>
            <dt>+ 13º líquido ({formatCurrency(thirteenthNet)} ÷ 12)</dt>
            <dd>{formatCurrency(thirteenthNet / 12)}</dd>
          </div>
          <div>
            <dt>+ 1/3 de férias líquido ({formatCurrency(vacationBonusNet)} ÷ 12)</dt>
            <dd>{formatCurrency(vacationBonusNet / 12)}</dd>
          </div>
          {externalIncome > 0 && (
            <div>
              <dt>+ recebido por fora</dt>
              <dd>{formatCurrency(externalIncome)}</dd>
            </div>
          )}
          <div className="total">
            <dt>= Média mensal usada na comparação</dt>
            <dd>{formatCurrency(netEffective)}</dd>
          </div>
        </dl>
        <p className="payslip-note">
          FGTS e benefícios não entram aqui: eles aparecem do lado PJ, como custo que você passa a
          ter.
        </p>
      </div>

      <p className="payslip-fgts">
        FGTS do mês: {formatCurrency(payslip.fgts)} (depositado pela empresa, não sai do salário).
        Diferença de centavos no INSS é arredondamento do sistema de folha.
      </p>
    </section>
  );
}
