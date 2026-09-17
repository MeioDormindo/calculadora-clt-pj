import { useEffect, useState } from "react";

// Abacus: contador público, sem cadastro. Guarda só um número inteiro —
// nenhum dado do visitante é enviado.
const BASE = "https://abacus.jasoncameron.dev";
const NAMESPACE = "meiodormindo-calculadora-clt-pj";
const KEY = "total";
const SESSION_FLAG = "clt_vs_pj_visita_contada";

// Uma única requisição por carregamento da página. Sem isso, a segunda
// montagem do efeito (StrictMode, em dev) dispara um /get que pode chegar
// antes do /hit e mostrar um número defasado.
let request: Promise<number | null> | null = null;

/**
 * Só conta visita de gente no site publicado. Servidor local e navegador
 * automatizado (testes, robôs que se declaram) apenas leem o total — senão
 * cada teste de desenvolvimento virava uma "visita" no contador real.
 */
export function shouldCountVisit(hostname: string, isAutomated: boolean): boolean {
  if (isAutomated) return false;
  return !["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(hostname);
}

function fetchVisitCount(): Promise<number | null> {
  if (request) return request;

  let alreadyCounted = !shouldCountVisit(window.location.hostname, navigator.webdriver === true);
  try {
    if (!alreadyCounted) {
      alreadyCounted = sessionStorage.getItem(SESSION_FLAG) === "1";
      if (!alreadyCounted) sessionStorage.setItem(SESSION_FLAG, "1");
    }
  } catch {
    // sessionStorage bloqueado: só lê o total, sem contar de novo.
    alreadyCounted = true;
  }

  request = fetch(`${BASE}/${alreadyCounted ? "get" : "hit"}/${NAMESPACE}/${KEY}`, {
    signal: AbortSignal.timeout(6000),
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { value?: number } | null) =>
      typeof data?.value === "number" ? data.value : null,
    )
    .catch(() => null);

  return request;
}

/**
 * Total de visitas. Conta uma vez por sessão do navegador: recarregar a página
 * não infla o número. Devolve `null` enquanto carrega e também quando o
 * serviço falha — nesse caso o contador simplesmente não aparece, em vez de
 * mostrar um valor inventado.
 */
export function useVisitCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchVisitCount().then((value) => {
      if (!cancelled && value !== null) setCount(value);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
