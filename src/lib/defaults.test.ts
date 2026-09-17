import { describe, expect, it } from "vitest";
import { createDefaultState } from "./defaults";
import { MINIMUM_WAGE } from "./calc/constants";
import { isDefaultState } from "../hooks/usePersistedState";

describe("estado padrão", () => {
  it("começa com o salário mínimo nos dois lados e sem benefícios de exemplo", () => {
    const { clt, pj } = createDefaultState();
    expect(clt.grossSalary).toBe(MINIMUM_WAGE);
    expect(pj.proposedGross).toBe(MINIMUM_WAGE);
    expect([clt.transportVoucher, clt.mealVoucher, clt.healthPlan, clt.otherBenefits, clt.externalIncome]).toEqual([0, 0, 0, 0, 0]);
    expect(pj.goalMode).toBe("NONE");
  });

  it("cria um objeto novo a cada chamada", () => {
    const a = createDefaultState();
    a.clt.grossSalary = 9999;
    expect(createDefaultState().clt.grossSalary).toBe(MINIMUM_WAGE);
  });

  it("reconhece o estado padrão e qualquer alteração", () => {
    expect(isDefaultState(createDefaultState(), createDefaultState())).toBe(true);
    const changed = createDefaultState();
    changed.pj.goalAmount = 500;
    expect(isDefaultState(changed, createDefaultState())).toBe(false);
  });
});
