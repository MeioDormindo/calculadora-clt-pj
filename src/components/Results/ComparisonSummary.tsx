import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

export function ComparisonSummary({ result }: { result: ComparisonResult }) {
  const { clt, proposed, proposalDelta, proposalDeltaPct } = result;
  const worseOff = proposalDelta < 0;

  const cltNet = useAnimatedNumber(clt.netEffective);
  const pjNet = useAnimatedNumber(proposed.netEffective);
  const delta = useAnimatedNumber(proposalDelta);

  const scale = Math.max(clt.netEffective, proposed.netEffective, 1);
  const cltPct = Math.max(0, (clt.netEffective / scale) * 100);
  const pjPct = Math.max(0, (proposed.netEffective / scale) * 100);

  return (
    <>
      <div className="tiles">
        <article className="tile">
          <p className="tile-label">
            <span className="dot clt" />
            CLT hoje
          </p>
          <p className="tile-value">{formatCurrency(cltNet)}</p>
          <p className="tile-meta">líquida efetiva por mês</p>
        </article>

        <article className="tile">
          <p className="tile-label">
            <span className="dot pj" />
            PJ na proposta
          </p>
          <p className="tile-value">{formatCurrency(pjNet)}</p>
          <p className="tile-meta">líquida efetiva por mês</p>
        </article>

        <article className="tile">
          <p className="tile-label">Variação da proposta</p>
          <p className="tile-value">{formatCurrency(Math.abs(delta))}</p>
          <span className={`tile-delta ${worseOff ? "bad" : "good"}`}>
            {worseOff ? "▼" : "▲"}{" "}
            {proposalDeltaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{" "}
            {worseOff ? "no seu bolso" : "a mais"}
          </span>
        </article>
      </div>

      <section className="card">
        <h3 className="card-title">Remuneração líquida efetiva</h3>
        <p className="card-subtitle">
          O que sobra no seu bolso depois de impostos e de bancar o que a empresa bancava.
        </p>

        <div className="meter">
          <div>
            <div className="meter-head">
              <span className="meter-key">
                <span className="dot clt" />
                CLT hoje
              </span>
              <span className="meter-value">{formatCurrency(clt.netEffective)}</span>
            </div>
            <div className="meter-track clt">
              <div className="meter-fill clt" style={{ width: `${cltPct}%` }} />
            </div>
          </div>

          <div>
            <div className="meter-head">
              <span className="meter-key">
                <span className="dot pj" />
                PJ na proposta
              </span>
              <span className="meter-value">{formatCurrency(proposed.netEffective)}</span>
            </div>
            <div className="meter-track pj">
              <div className="meter-fill pj" style={{ width: `${pjPct}%` }} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
