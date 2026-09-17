import type { PjInput, CltResult } from "./types";
import type { ContractCalendar } from "../calendar/workCalendar";
import { calculatePj } from "./pj";

/**
 * Busca binária pelo menor faturamento bruto PJ cuja remuneração líquida
 * efetiva alcança o alvo — por padrão a do CLT (empate), ou CLT + meta. O resultado é monotonicamente crescente no
 * faturamento enquanto a soma das frações aplicadas sobre o bruto (imposto,
 * INSS por %, dias parados) for menor que 100%. Retorna null se nem o teto
 * de busca alcança o alvo.
 */
export function findMinimumPjGross(
  clt: CltResult,
  pjInput: PjInput,
  calendar: ContractCalendar,
  {
    target = clt.netEffective,
    bounds = { min: 0, max: 200000 },
    tolerance = 0.01,
  }: { target?: number; bounds?: { min: number; max: number }; tolerance?: number } = {},
): number | null {
  const netAt = (grossInvoice: number) => calculatePj(grossInvoice, pjInput, clt, calendar).netEffective;

  if (netAt(bounds.max) < target) return null;
  if (netAt(bounds.min) >= target) return bounds.min;

  let low = bounds.min;
  let high = bounds.max;
  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    if (netAt(mid) >= target) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return high;
}
