import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";

export function PjDrivers({ result }: { result: ComparisonResult }) {
  const pj = result.minimum ?? result.proposed;
  const lines = pj.costs.filter((line) => line.value > 0).sort((a, b) => b.value - a.value);

  if (lines.length === 0) return null;

  const total = lines.reduce((sum, line) => sum + line.value, 0);
  const largest = lines[0].value;

  return (
    <section className="card pj">
      <h3 className="card-title">O que puxa o valor do PJ para cima</h3>
      <p className="card-subtitle">
        Cada custo que você passa a bancar sozinho, do maior para o menor. Somados, são{" "}
        {formatCurrency(total)} por mês que precisam sair do seu faturamento antes de sobrar
        qualquer coisa.
      </p>

      <ul className="drivers">
        {lines.map((line) => (
          <li key={line.key}>
            <div className="driver-head">
              <span className="driver-label">{line.label}</span>
              <span className="driver-value">
                {formatCurrency(line.value)}
                <span className="driver-share">{Math.round((line.value / total) * 100)}%</span>
              </span>
            </div>
            <div className="driver-track">
              <div className="driver-fill" style={{ width: `${(line.value / largest) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
