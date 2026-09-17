import { describe, expect, it } from "vitest";
import { shouldCountVisit } from "./useVisitCount";

describe("contador de visitas", () => {
  it("conta visitas de pessoas no site publicado", () => {
    expect(shouldCountVisit("meiodormindo.github.io", false)).toBe(true);
  });

  it("não conta servidor local", () => {
    for (const host of ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]) {
      expect(shouldCountVisit(host, false)).toBe(false);
    }
  });

  it("não conta navegador automatizado, nem no site publicado", () => {
    expect(shouldCountVisit("meiodormindo.github.io", true)).toBe(false);
  });
});
