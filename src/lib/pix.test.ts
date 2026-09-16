import { describe, expect, it } from "vitest";
import { crc16, buildPixPayload, parsePixPayload } from "./pix";
import { PIX_KEY, PIX_NAME, PIX_CITY, PIX_PAYLOAD } from "./pixConfig";

describe("crc16", () => {
  it("bate com o vetor de teste padrão do CRC-16/CCITT-FALSE", () => {
    // "123456789" -> 0x29B1 é o vetor canônico deste algoritmo.
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("buildPixPayload", () => {
  // Exemplo da documentação do Banco Central, com CRC conhecido.
  const exemploBcb =
    "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000" +
    "5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";

  it("reproduz o exemplo do Banco Central, CRC incluído", () => {
    const gerado = buildPixPayload({
      key: "123e4567-e12b-12d1-a456-426655440000",
      name: "Fulano de Tal",
      city: "BRASILIA",
    });
    expect(gerado).toBe(exemploBcb);
  });

  it("calcula o CRC sobre o payload incluindo o '6304'", () => {
    const corpo = exemploBcb.slice(0, -4);
    expect(corpo.endsWith("6304")).toBe(true);
    expect(crc16(corpo)).toBe(exemploBcb.slice(-4));
  });

  it("monta os campos obrigatórios do nosso Pix", () => {
    const campos = parsePixPayload(PIX_PAYLOAD);
    expect(campos["00"]).toBe("01");
    expect(campos["52"]).toBe("0000");
    expect(campos["53"]).toBe("986");
    expect(campos["58"]).toBe("BR");
    expect(campos["59"]).toBe(PIX_NAME);
    expect(campos["60"]).toBe(PIX_CITY);
  });

  it("guarda a chave dentro do campo 26, sob o GUI do Pix", () => {
    const conta = parsePixPayload(parsePixPayload(PIX_PAYLOAD)["26"]);
    expect(conta["00"]).toBe("br.gov.bcb.pix");
    expect(conta["01"]).toBe(PIX_KEY);
  });

  it("fecha com um CRC válido", () => {
    expect(crc16(PIX_PAYLOAD.slice(0, -4))).toBe(PIX_PAYLOAD.slice(-4));
  });

  it("declara os tamanhos corretamente em cada campo", () => {
    // Se algum tamanho estivesse errado, o parser não chegaria ao campo 63.
    expect(parsePixPayload(PIX_PAYLOAD)["63"]).toHaveLength(4);
  });

  it("remove acentos para o tamanho em bytes continuar correto", () => {
    const comAcento = buildPixPayload({
      key: PIX_KEY,
      name: "José Antônio",
      city: "SÃO PAULO",
    });
    const campos = parsePixPayload(comAcento);
    expect(campos["59"]).toBe("Jose Antonio");
    expect(campos["60"]).toBe("SAO PAULO");
    expect(crc16(comAcento.slice(0, -4))).toBe(comAcento.slice(-4));
  });

  it("respeita os limites de tamanho do nome e da cidade", () => {
    const campos = parsePixPayload(
      buildPixPayload({
        key: PIX_KEY,
        name: "Nome Absurdamente Longo Que Passa Do Limite",
        city: "Cidade Com Nome Muito Grande",
      }),
    );
    expect(campos["59"].length).toBeLessThanOrEqual(25);
    expect(campos["60"].length).toBeLessThanOrEqual(15);
  });
});
