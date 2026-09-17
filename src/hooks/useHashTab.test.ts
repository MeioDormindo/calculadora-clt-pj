import { describe, expect, it } from "vitest";
import { tabFromHash } from "./useHashTab";

describe("aba pela âncora da URL", () => {
  it("abre contadores com #contadores ou #/contadores", () => {
    expect(tabFromHash("#contadores")).toBe("contadores");
    expect(tabFromHash("#/contadores")).toBe("contadores");
    expect(tabFromHash("#demissao")).toBe("demissao");
  });

  it("abre a calculadora sem âncora ou com âncora desconhecida", () => {
    expect(tabFromHash("")).toBe("calculadora");
    expect(tabFromHash("#")).toBe("calculadora");
    expect(tabFromHash("#qualquer-coisa")).toBe("calculadora");
  });
});
