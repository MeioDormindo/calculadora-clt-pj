import type { CostAnalysis, ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";
import { describeScenario, formatDelta, formatPct } from "../../lib/costAnalysisText";

function DeltaCell({ data, kind }: { data: CostAnalysis | null; kind: "employer" | "worker" }) {
  if (!data) return <td className="empty">—</td>;
  const delta = kind === "employer" ? data.employerDelta : data.workerDelta;
  const pct = kind === "employer" ? data.employerDeltaPct : data.workerDeltaPct;
  // A coluna da empresa fica neutra de propósito: economia para ela não é ganho
  // para quem lê. Só o impacto em você recebe cor.
  const className = kind === "worker" ? (delta <= 0 ? "good" : "bad") : undefined;
  return (
    <td className={className}>
      {formatDelta(delta)} <span className="delta-pct">({formatPct(pct)})</span>
    </td>
  );
}

export function CostAnalysisPanel({ result }: { result: ComparisonResult }) {
  const { analysisMinimum: min, analysisProposed: prop } = result;

  return (
    <section className="card analysis">
      <h3 className="card-title">Empresa vs você</h3>
      <ul className="analysis-summary">
        {min && <li>{describeScenario("Se pagassem o mínimo justo", min)}</li>}
        <li>{describeScenario("Com a proposta atual", prop)}</li>
      </ul>

      <p className="scroll-hint">Deslize a tabela para o lado para ver a proposta →</p>
      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th />
              <th>Como CLT</th>
              <th>PJ no mínimo</th>
              <th>PJ na proposta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Custo para a empresa</th>
              <td>{formatCurrency(prop.employerClt)}</td>
              <td>{min ? formatCurrency(min.employerPj) : "—"}</td>
              <td>{formatCurrency(prop.employerPj)}</td>
            </tr>
            <tr className="delta-row">
              <th scope="row">variação</th>
              <td className="empty">—</td>
              <DeltaCell data={min} kind="employer" />
              <DeltaCell data={prop} kind="employer" />
            </tr>
            <tr>
              <th scope="row">Seus custos</th>
              <td>{formatCurrency(prop.workerClt)}</td>
              <td>{min ? formatCurrency(min.workerPj) : "—"}</td>
              <td>{formatCurrency(prop.workerPj)}</td>
            </tr>
            <tr className="delta-row">
              <th scope="row">variação</th>
              <td className="empty">—</td>
              <DeltaCell data={min} kind="worker" />
              <DeltaCell data={prop} kind="worker" />
            </tr>
          </tbody>
        </table>
      </div>

      <p className="group-note analysis-note">
        Seus custos: no CLT, INSS, IRRF e seus descontos no holerite; no PJ, impostos, benefícios
        que você passa a pagar, contador e dias sem faturar. O mínimo não depende da proposta — só
        do CLT e dos custos do PJ.
      </p>
    </section>
  );
}
