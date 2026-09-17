import type { CltInput, PjInput, CltResult, PjResult, CostAnalysis, ComparisonResult } from "./types";
import { calculateClt } from "./clt";
import { calculatePj, applyActivity } from "./pj";
import { findMinimumPjGross } from "./breakeven";

function pct(delta: number, base: number): number {
  return base === 0 ? 0 : (delta / base) * 100;
}

function analyse(clt: CltResult, pj: PjResult): CostAnalysis {
  const employerDelta = pj.employerCost - clt.employerCost;
  const workerClt = clt.totalCosts + clt.totalEmployeeShares;
  const workerDelta = pj.totalCosts - workerClt;
  return {
    employerClt: clt.employerCost,
    employerPj: pj.employerCost,
    employerDelta,
    employerDeltaPct: pct(employerDelta, clt.employerCost),
    workerClt,
    workerPj: pj.totalCosts,
    workerDelta,
    workerDeltaPct: pct(workerDelta, workerClt),
  };
}

export function compareCltVsPj(cltInput: CltInput, rawPjInput: PjInput): ComparisonResult {
  const pjInput = applyActivity(rawPjInput);
  const clt = calculateClt(cltInput);
  const proposed = calculatePj(pjInput.proposedGross, pjInput, clt);

  const minimumGross = findMinimumPjGross(clt, pjInput);
  const minimum = minimumGross === null ? null : calculatePj(minimumGross, pjInput, clt);

  const proposalDelta = proposed.netEffective - clt.netEffective;

  return {
    clt,
    minimum,
    proposed,
    minimumGross,
    analysisMinimum: minimum ? analyse(clt, minimum) : null,
    analysisProposed: analyse(clt, proposed),
    proposalDelta,
    proposalDeltaPct: pct(proposalDelta, clt.netEffective),
  };
}
