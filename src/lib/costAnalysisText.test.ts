import { describe, expect, it } from "vitest";
import { describeScenario } from "./costAnalysisText";
import type { CostAnalysis } from "./calc/types";

const base: CostAnalysis = {
  employerClt: 9000, employerPj: 8500, employerDelta: -500, employerDeltaPct: -5.56,
  workerClt: 800, workerPj: 3000, workerDelta: 2200, workerDeltaPct: 275,
};
const clean = (s: string) => s.replace(/\s/g, " ");

describe("frase da análise empresa vs você", () => {
  it("diz que a empresa gasta menos quando ela economiza", () => {
    expect(clean(describeScenario("No mínimo", base))).toBe(
      "No mínimo, a empresa gasta R$ 500,00 a menos (-5,6%) e seus custos sobem R$ 2.200,00 por mês.",
    );
  });

  it("diz que a empresa gasta mais quando ela não economiza", () => {
    const frase = clean(describeScenario("No mínimo", { ...base, employerDelta: 229.71, employerDeltaPct: 2.08 }));
    expect(frase).toContain("a empresa gasta R$ 229,71 a mais (+2,1%)");
    expect(frase).not.toContain("a menos");
  });

  it("trata empate e custos que caem", () => {
    const frase = clean(describeScenario("Na proposta", { ...base, employerDelta: 0, workerDelta: -150 }));
    expect(frase).toBe("Na proposta, a empresa gasta o mesmo e seus custos caem R$ 150,00 por mês.");
  });
});
