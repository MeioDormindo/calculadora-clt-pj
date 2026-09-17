import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

export function ComparisonSummary({ result }: { result: ComparisonResult }) {
  const { clt, proposed, proposalDelta, proposalDeltaPct } = result;
  const worseOff = proposalDelta < 0;

  const cltPayslip = useAnimatedNumber(clt.payslip.net);
  const cltInPocket = useAnimatedNumber(clt.monthlyInPocket);
  const hasExtra = clt.externalIncome > 0;
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
            CLT · líquido por mês
          </p>
          {hasExtra ? (
            <div className="tile-split">
              <div>
                <p className="tile-split-label">No holerite</p>
                <p className="tile-split-value">{formatCurrency(cltPayslip)}</p>
              </div>
              <div>
                <p className="tile-split-label">Com o extra por fora</p>
                <p className="tile-split-value strong">{formatCurrency(cltInPocket)}</p>
              </div>
            </div>
          ) : (
            <p className="tile-value">{formatCurrency(cltPayslip)}</p>
          )}
          <p className="tile-meta">
            {hasExtra
              ? `inclui ${formatCurrency(clt.externalIncome)} por fora, sem imposto. `
              : "no holerite. "}
            Com 13º e 1/3 de férias: {formatCurrency(clt.netEffective)}/mês na média do ano
          </p>
        </article>

        <article className="tile">
          <p className="tile-label">
            <span className="dot pj" />
            PJ · sobra por mês
          </p>
          <p className="tile-value">{formatCurrency(pjNet)}</p>
          <p className="tile-meta">depois de impostos, benefícios que você paga e dias parados</p>
        </article>

        <article className="tile">
          <p className="tile-label">Proposta vs CLT (média do ano)</p>
          <p className="tile-value">{formatCurrency(Math.abs(delta))}</p>
          <span className={`tile-delta ${worseOff ? "bad" : "good"}`}>
            {worseOff ? "▼" : "▲"}{" "}
            {proposalDeltaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{" "}
            {worseOff ? "no seu bolso" : "a mais"}
          </span>
        </article>
      </div>

      <section className="card">
        <h3 className="card-title">Quanto sobra por mês, na média do ano</h3>
        <p className="card-subtitle">
          É a base justa de comparação: no CLT entram 13º e 1/3 de férias, que o PJ não tem; no
          PJ saem impostos, os benefícios que você passa a pagar e os dias sem faturar.
        </p>

        <div className="meter">
          <div>
            <div className="meter-head">
              <span className="meter-key">
                <span className="dot clt" />
                CLT (média com 13º e férias)
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
