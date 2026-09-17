import { useEffect, useState } from "react";

export type Tab = "calculadora" | "contadores";

/** "#contadores" -> "contadores"; qualquer outra coisa abre a calculadora. */
export function tabFromHash(hash: string): Tab {
  return hash.replace(/^#\/?/, "") === "contadores" ? "contadores" : "calculadora";
}

/**
 * Aba atual guardada na âncora da URL. O GitHub Pages só serve arquivos
 * estáticos, então uma rota como /contadores daria 404 ao recarregar — com
 * #contadores o link funciona e pode ser compartilhado.
 */
export function useHashTab(): Tab {
  const [tab, setTab] = useState<Tab>(() => tabFromHash(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setTab(tabFromHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    document.title = tab === "contadores" ? "Contadores · CLT vs PJ" : "CLT vs PJ";
  }, [tab]);

  return tab;
}
