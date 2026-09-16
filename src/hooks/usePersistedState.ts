import { useEffect, useState } from "react";
import { loadFromStorage, saveToStorage } from "../lib/storage";

export function usePersistedState<T>(defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
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
    saveToStorage(state);
  }, [state]);

  return [state, setState];
}
