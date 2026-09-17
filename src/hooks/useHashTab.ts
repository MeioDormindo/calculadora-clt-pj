import { useEffect, useState } from "react";

export type Tab = "calculadora" | "demissao" | "contadores";

const TAB_TITLES: Record<Tab, string> = {
  calculadora: "CLT vs PJ",
  demissao: "Demissão · CLT vs PJ",
  contadores: "Contadores · CLT vs PJ",
};

/** "#contadores" -> "contadores"; qualquer outra coisa abre a calculadora. */
export function tabFromHash(hash: string): Tab {
  const id = hash.replace(/^#\/?/, "");
  return id === "contadores" || id === "demissao" ? id : "calculadora";
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
    document.title = TAB_TITLES[tab];
  }, [tab]);

  return tab;
}
