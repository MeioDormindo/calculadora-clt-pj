import { describe, expect, it } from "vitest";
import { compareCltVsPj } from "./compare";
import { calculatePj, applyActivity } from "./pj";
import { sheetClt, sheetPj } from "./fixtures";

const today = new Date(2026, 0, 15);

describe("meta como PJ", () => {
  it("sem meta, o alvo é o próprio empate", () => {
    const r = compareCltVsPj(sheetClt, sheetPj, today);
    expect(r.goalExtra).toBe(0);
    expect(r.goalNet).toBeCloseTo(r.clt.netEffective, 6);
    expect(r.goalGross).toBe(r.minimumGross);
    expect(r.goal).toBe(r.minimum);
  });

  it("valor líquido a mais: faturar goalGross deixa CLT + meta", () => {
    const r = compareCltVsPj(sheetClt, { ...sheetPj, goalMode: "AMOUNT", goalAmount: 1000 }, today);
    expect(r.goalExtra).toBe(1000);
    expect(r.goalNet).toBeCloseTo(r.clt.netEffective + 1000, 6);
    expect(r.goalGross!).toBeGreaterThan(r.minimumGross!);
    expect(r.goal!.netEffective).toBeGreaterThanOrEqual(r.goalNet - 1e-9);
    expect(r.goal!.netEffective - r.goalNet).toBeLessThan(0.05);
    // Um centavo a menos já não alcança a meta.
    const below = calculatePj(r.goalGross! - 0.02, applyActivity(sheetPj), r.clt, r.calendar);
    expect(below.netEffective).toBeLessThan(r.goalNet);
  });

  it("porcentagem a mais: calcula sobre a média líquida do CLT", () => {
    const r = compareCltVsPj(sheetClt, { ...sheetPj, goalMode: "PERCENT", goalPercent: 20 }, today);
    expect(r.goalExtra).toBeCloseTo(r.clt.netEffective * 0.2, 6);
    expect(r.goal!.netEffective).toBeGreaterThanOrEqual(r.clt.netEffective * 1.2 - 1e-9);
  });

  it("meta maior pede faturamento maior", () => {
    const g = (goalAmount: number) =>
      compareCltVsPj(sheetClt, { ...sheetPj, goalMode: "AMOUNT", goalAmount }, today).goalGross!;
    expect(g(2000)).toBeGreaterThan(g(1000));
  });

  it("ignora valores guardados do modo que não está ativo e metas negativas", () => {
    const off = compareCltVsPj(sheetClt, { ...sheetPj, goalMode: "NONE", goalAmount: 5000, goalPercent: 50 }, today);
    expect(off.goalExtra).toBe(0);
    const negative = compareCltVsPj(sheetClt, { ...sheetPj, goalMode: "AMOUNT", goalAmount: -300 }, today);
    expect(negative.goalGross).toBe(negative.minimumGross);
  });

  it("meta impossível fica fora do alcance", () => {
    const r = compareCltVsPj(sheetClt, { ...sheetPj, goalMode: "AMOUNT", goalAmount: 1_000_000 }, today);
    expect(r.goalGross).toBeNull();
    expect(r.goal).toBeNull();
    expect(r.minimumGross).not.toBeNull();
  });
});
