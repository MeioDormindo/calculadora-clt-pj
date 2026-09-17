import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";

export function ContractTotalsCard({ result }: { result: ComparisonResult }) {
  const { clt, proposed, calendar } = result;
  const months = calendar.months.length;
  const cltTotal = clt.netEffective * months;
  const pjTotal = proposed.netEffective * months;
  const diff = pjTotal - cltTotal;
  const pjWins = diff >= 0;

  return (
    <section className="card">
      <h3 className="card-title">
        No período do contrato ({months} {months === 1 ? "mês" : "meses"})
      </h3>
      <p className="card-subtitle">
        Quanto sobra no total. No CLT, 13º e férias entram na proporção dos meses.
      </p>

      <div className="tiles contract-totals">
        <article className="tile">
          <p className="tile-label">
            <span className="dot clt" />
            CLT
          </p>
          <p className="tile-value">{formatCurrency(cltTotal)}</p>
        </article>
        <article className="tile">
          <p className="tile-label">
            <span className="dot pj" />
            PJ na proposta
          </p>
          <p className="tile-value">{formatCurrency(pjTotal)}</p>
        </article>
        <article className="tile">
          <p className="tile-label">Diferença no período</p>
          <p className="tile-value">{formatCurrency(Math.abs(diff))}</p>
          <span className={`tile-delta ${pjWins ? "good" : "bad"}`}>
            {pjWins ? "▲ PJ rende mais" : "▼ CLT rende mais"}
          </span>
        </article>
      </div>
    </section>
  );
}
