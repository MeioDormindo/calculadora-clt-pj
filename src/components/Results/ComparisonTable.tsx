import type { ComparisonResult } from "../../lib/calc/types";
import { buildComparisonRows } from "../../lib/comparisonRows";
import { formatCurrency } from "../../lib/format";

interface ComparisonTableProps {
  result: ComparisonResult;
}

function Cell({ value }: { value: number | null }) {
  if (value === null) return <td className="empty">—</td>;
  return <td className={value < 0 ? "negative" : undefined}>{formatCurrency(value)}</td>;
}

export function ComparisonTable({ result }: ComparisonTableProps) {
  const { clt, minimum, proposed } = result;

  const rows = buildComparisonRows(result);

  return (
    <section className="card">
      <h3 className="card-title">Comparativo mensal, linha a linha</h3>
      <p className="card-subtitle">
        Como CLT a empresa banca os benefícios; como PJ eles viram custo seu. É essa diferença que
        o valor mínimo precisa cobrir. No CLT, INSS e IRRF são a média do ano, já contando 13º e férias.
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
