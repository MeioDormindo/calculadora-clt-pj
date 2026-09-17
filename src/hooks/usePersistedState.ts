import { useCallback, useEffect, useState } from "react";
import { clearStorage, loadFromStorage, saveToStorage } from "../lib/storage";

/** Igual ao padrão não precisa ser guardado: assim o padrão atual sempre vale. */
export function isDefaultState<T>(state: T, defaults: T): boolean {
  return JSON.stringify(state) === JSON.stringify(defaults);
}

export function usePersistedState<T>(
  createDefault: () => T,
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(() => {
    const defaultValue = createDefault();
    const stored = loadFromStorage<T>();
    if (!stored) return defaultValue;

    // Merge de um nível: campos novos adicionados ao modelo continuam vindo do
    // padrão mesmo quando o navegador já tem um estado salvo.
    const merged = { ...defaultValue } as Record<string, unknown>;
    for (const [key, saved] of Object.entries(stored)) {
      const fallback = merged[key];
      merged[key] =
        saved && fallback && typeof saved === "object" && !Array.isArray(saved)
          ? { ...(fallback as object), ...(saved as object) }
          : saved;
    }
    return merged as T;
  });

  useEffect(() => {
    if (isDefaultState(state, createDefault())) clearStorage();
    else saveToStorage(state);
  }, [state, createDefault]);

  const reset = useCallback(() => {
    clearStorage();
    setState(createDefault());
  }, [createDefault]);

  return [state, setState, reset];
}
