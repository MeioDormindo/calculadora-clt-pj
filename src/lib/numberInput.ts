/**
 * Entrada numérica no padrão brasileiro, tolerante ao que as pessoas digitam
 * de verdade: "1.500,00", "1500,50", "1500.50", "R$ 5.000".
 *
 * O `<input type="number">` do navegador não serve aqui: ele devolve string
 * vazia para qualquer coisa que considere inválida (incluindo "1.500,00"),
 * aceita sinal e notação científica, e não impede zeros à esquerda.
 */

/** Descarta tudo que não pode fazer parte de um número positivo. */
export function sanitizeNumericInput(raw: string): string {
  const onlyNumeric = raw.replace(/[^\d.,]/g, "");
  // "0100" -> "100", preservando "0" sozinho e o "0" de "0,5".
  return onlyNumeric.replace(/^0+(?=\d)/, "");
}

function toFiniteNumber(text: string): number {
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Converte o texto digitado em número.
 *
 * Quando aparecem os dois separadores, o último é o decimal ("1.500,00").
 * Quando só há um tipo e todos os grupos têm 3 dígitos, é separador de
 * milhar ("1.500" e "1.000.000" viram 1500 e 1000000) — a leitura mais
 * provável num campo de dinheiro. Para meio real, digite "0,5" ou "1,50".
 */
export function parseNumericInput(text: string): number {
  const cleaned = sanitizeNumericInput(text);
  if (cleaned === "") return 0;

  const separators = cleaned.match(/[.,]/g) ?? [];
  if (separators.length === 0) return toFiniteNumber(cleaned);

  const groups = cleaned.split(/[.,]/);
  const allSeparatorsMatch = separators.every((s) => s === separators[0]);
  const looksLikeThousands =
    allSeparatorsMatch &&
    groups[0] !== "" &&
    groups[0] !== "0" &&
    groups[0].length <= 3 &&
    groups.slice(1).every((group) => group.length === 3);

  if (looksLikeThousands) return toFiniteNumber(groups.join(""));

  const decimals = groups[groups.length - 1];
  const whole = groups.slice(0, -1).join("");
  return toFiniteNumber(`${whole || "0"}.${decimals || "0"}`);
}

/** Número como ele deve aparecer no campo, com vírgula decimal. */
export function formatForInput(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

/** Prende o valor entre os limites do campo. */
export function clampNumber(value: number, min: number, max?: number): number {
  const lowerBounded = Math.max(min, value);
  return max === undefined ? lowerBounded : Math.min(max, lowerBounded);
}
