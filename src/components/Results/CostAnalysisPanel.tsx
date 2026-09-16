import type { CostAnalysis, ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";

const formatPct = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

const formatDelta = (value: number) =>
  `${value > 0 ? "+" : ""}${formatCurrency(value)}`;

function AnalysisBlock({ title, subtitle, data }: { title: string; subtitle: string; data: CostAnalysis }) {
  return (
    <section className="card analysis">
      <h3 className="card-title">{title}</h3>
      <p className="card-subtitle">{subtitle}</p>

      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th />
              <th>Empresa</th>
              <th>Você</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Como CLT</th>
              <td>{formatCurrency(data.employerClt)}</td>
              <td>{formatCurrency(data.workerClt)}</td>
            </tr>
            <tr>
              <th scope="row">Como PJ</th>
              <td>{formatCurrency(data.employerPj)}</td>
              <td>{formatCurrency(data.workerPj)}</td>
            </tr>
            {/* A coluna da empresa fica neutra de propósito: economia para ela
                não é ganho para quem lê. Só o impacto em você recebe cor. */}
            <tr>
              <th scope="row">Variação</th>
              <td>{formatDelta(data.employerDelta)}</td>
              <td className={data.workerDelta <= 0 ? "good" : "bad"}>
                {formatDelta(data.workerDelta)}
              </td>
            </tr>
            <tr>
              <th scope="row">Variação %</th>
              <td>{formatPct(data.employerDeltaPct)}</td>
              <td className={data.workerDelta <= 0 ? "good" : "bad"}>
                {formatPct(data.workerDeltaPct)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CostAnalysisPanel({ result }: { result: ComparisonResult }) {
  return (
    <div className="analysis-grid">
      {result.analysisMinimum && (
        <AnalysisBlock
          title="Se pagassem o mínimo justo"
          subtitle="Mesmo pagando o valor que te deixa no zero a zero, a empresa ainda economiza."
          data={result.analysisMinimum}
        />
      )}
      <AnalysisBlock
        title="Com a proposta atual"
        subtitle="Quanto cada lado ganha ou perde no valor que foi oferecido."
        data={result.analysisProposed}
      />
    </div>
  );
}
