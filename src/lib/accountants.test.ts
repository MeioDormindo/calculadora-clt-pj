import { describe, expect, it } from "vitest";
import { ACCOUNTANTS, ADVERTISING_EMAIL, safeUrl, whatsappLink } from "./accountants";

describe("contadores", () => {
  it("começa sem anunciantes e com o e-mail de contato", () => {
    expect(ACCOUNTANTS).toEqual([]);
    expect(ADVERTISING_EMAIL).toBe("siryuscanuto@gmail.com");
  });

  it("aceita só links http e https", () => {
    expect(safeUrl("https://escritorio.com.br")).toBe("https://escritorio.com.br");
    expect(safeUrl("http://escritorio.com.br")).toBe("http://escritorio.com.br");
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("  JavaScript:alert(1)")).toBeUndefined();
    expect(safeUrl("data:text/html,<script>")).toBeUndefined();
    expect(safeUrl(undefined)).toBeUndefined();
  });

  it("monta o link do WhatsApp com DDI do Brasil", () => {
    expect(whatsappLink("(43) 99999-0000")).toBe("https://wa.me/5543999990000");
    expect(whatsappLink("+55 43 99999-0000")).toBe("https://wa.me/5543999990000");
    // DDD 55 (Rio Grande do Sul) não pode ser confundido com o DDI.
    expect(whatsappLink("(55) 99999-0000")).toBe("https://wa.me/5555999990000");
    expect(whatsappLink("123")).toBeUndefined();
    expect(whatsappLink(undefined)).toBeUndefined();
  });
});
