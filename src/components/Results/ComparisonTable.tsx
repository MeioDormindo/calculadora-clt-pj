import type { ComparisonResult, PjResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";

interface ComparisonTableProps {
  result: ComparisonResult;
}

interface Row {
  label: string;
  clt: number | null;
  min: number | null;
  prop: number | null;
}

const cost = (pj: PjResult | null, key: string): number | null => {
  if (!pj) return null;
  const value = pj.costs.find((c) => c.key === key)?.value ?? 0;
  return value === 0 ? 0 : -value;
};

function Cell({ value }: { value: number | null }) {
  if (value === null) return <td className="empty">—</td>;
  return <td className={value < 0 ? "negative" : undefined}>{formatCurrency(value)}</td>;
}

export function ComparisonTable({ result }: ComparisonTableProps) {
  const { clt, minimum, proposed } = result;

  const rows: Row[] = [
    {
      label: "Salário bruto / faturamento",
      clt: clt.grossSalary,
      min: minimum?.grossInvoice ?? null,
      prop: proposed.grossInvoice,
    },
    { label: "Adicional de férias", clt: clt.vacationBonus, min: null, prop: null },
    { label: "Décimo terceiro salário", clt: clt.thirteenth, min: null, prop: null },
    ...(clt.externalIncome > 0
      ? [{ label: "Recebido por fora (líquido)", clt: clt.externalIncome, min: null, prop: null }]
      : []),
    ...clt.benefits.map((benefit) => ({
      label: benefit.label,
      clt: benefit.value,
      min: cost(minimum, benefit.key),
      prop: cost(proposed, benefit.key),
    })),
    {
      label: "Seguro de vida",
      clt: null,
      min: cost(minimum, "lifeInsurance"),
      prop: cost(proposed, "lifeInsurance"),
    },
    {
      label: "Serviços de contabilidade",
      clt: null,
      min: cost(minimum, "accountantFee"),
      prop: cost(proposed, "accountantFee"),
    },
    { label: "INSS", clt: -clt.inss, min: cost(minimum, "inss"), prop: cost(proposed, "inss") },
    { label: "IRRF", clt: -clt.irrf, min: null, prop: null },
    {
      label: "Simples Nacional ou MEI",
      clt: null,
      min: cost(minimum, "tax"),
      prop: cost(proposed, "tax"),
    },
    ...proposed.lostDays.breakdown.map((item) => ({
      label: item.label,
      clt: null,
      min: cost(minimum, item.key),
      prop: cost(proposed, item.key),
    })),
  ];

  return (
    <section className="card">
      <h3 className="card-title">Comparativo mensal, linha a linha</h3>
      <p className="card-subtitle">
        Como CLT a empresa banca os benefícios; como PJ eles viram custo seu. É essa diferença que
        o valor mínimo precisa cobrir.
      </p>

      <p className="scroll-hint">Deslize a tabela para o lado para ver a proposta →</p>

      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>
                <span className="dot clt" /> CLT
              </th>
              <th>PJ mínimo</th>
              <th>PJ proposta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <Cell value={row.clt} />
                <Cell value={row.min} />
                <Cell value={row.prop} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Remuneração líquida efetiva</th>
              <td>{formatCurrency(clt.netEffective)}</td>
              <td>{minimum ? formatCurrency(minimum.netEffective) : "—"}</td>
              <td>{formatCurrency(proposed.netEffective)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
