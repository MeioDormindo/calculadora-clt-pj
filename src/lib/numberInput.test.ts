import { describe, expect, it } from "vitest";
import {
  sanitizeNumericInput,
  parseNumericInput,
  formatForInput,
  clampNumber,
} from "./numberInput";

describe("sanitizeNumericInput", () => {
  it("remove zeros à esquerda", () => {
    expect(sanitizeNumericInput("01000")).toBe("1000");
    expect(sanitizeNumericInput("0001000")).toBe("1000");
  });

  it("preserva o zero sozinho e o zero antes da vírgula", () => {
    expect(sanitizeNumericInput("0")).toBe("0");
    expect(sanitizeNumericInput("0,5")).toBe("0,5");
  });

  it("descarta letras, símbolos e sinal negativo", () => {
    expect(sanitizeNumericInput("abc")).toBe("");
    expect(sanitizeNumericInput("R$ 5.000")).toBe("5.000");
    expect(sanitizeNumericInput("-5000")).toBe("5000");
    expect(sanitizeNumericInput("1e5")).toBe("15");
    expect(sanitizeNumericInput("12 34")).toBe("1234");
  });
});

describe("parseNumericInput", () => {
  it("lê números simples", () => {
    expect(parseNumericInput("1500")).toBe(1500);
    expect(parseNumericInput("0")).toBe(0);
    expect(parseNumericInput("")).toBe(0);
  });

  it("aceita vírgula decimal", () => {
    expect(parseNumericInput("1500,50")).toBeCloseTo(1500.5, 6);
    expect(parseNumericInput("0,5")).toBeCloseTo(0.5, 6);
  });

  it("aceita ponto decimal", () => {
    expect(parseNumericInput("1500.50")).toBeCloseTo(1500.5, 6);
  });

  it("entende o ponto como separador de milhar", () => {
    expect(parseNumericInput("1.500")).toBe(1500);
    expect(parseNumericInput("1.000.000")).toBe(1000000);
  });

  it("com os dois separadores, o último é o decimal", () => {
    expect(parseNumericInput("1.500,00")).toBe(1500);
    expect(parseNumericInput("1.234,56")).toBeCloseTo(1234.56, 6);
  });

  it("lê valores colados com formatação", () => {
    expect(parseNumericInput("R$ 5.000,00")).toBe(5000);
    expect(parseNumericInput("R$ 10.000")).toBe(10000);
  });

  it("nunca devolve negativo nem NaN", () => {
    expect(parseNumericInput("-5000")).toBe(5000);
    expect(parseNumericInput("abc")).toBe(0);
    expect(parseNumericInput(",")).toBe(0);
    expect(parseNumericInput(".")).toBe(0);
  });

  it("tolera o estado intermediário de quem está digitando", () => {
    expect(parseNumericInput("1500,")).toBe(1500);
    expect(parseNumericInput("0,")).toBe(0);
  });

  it("trata zero antes do separador como decimal, não milhar", () => {
    expect(parseNumericInput("0,500")).toBeCloseTo(0.5, 6);
  });
});

describe("formatForInput", () => {
  it("usa vírgula decimal e arredonda nos centavos", () => {
    expect(formatForInput(833.3333)).toBe("833,33");
    expect(formatForInput(600)).toBe("600");
    expect(formatForInput(0)).toBe("0");
  });
});

describe("clampNumber", () => {
  it("respeita o mínimo e o máximo", () => {
    expect(clampNumber(0, 1)).toBe(1);
    expect(clampNumber(999, 0, 20)).toBe(20);
    expect(clampNumber(10, 0, 20)).toBe(10);
  });
});
