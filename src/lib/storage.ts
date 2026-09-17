// v2: modelo com provisões, encargos patronais e proposta PJ. Dados salvos no
// formato antigo são descartados por não terem os campos novos.
const STORAGE_KEY = "clt_vs_pj_inputs_v2";

export function saveToStorage<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage indisponível (modo privado, etc.) — ignora silenciosamente.
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage indisponível — nada a limpar.
  }
}

export function loadFromStorage<T>(): Partial<T> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}
