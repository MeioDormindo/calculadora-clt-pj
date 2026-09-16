import { useVisitCount } from "../../hooks/useVisitCount";

const buildTime = new Date(__BUILD_TIME__);

const formatted = buildTime.toLocaleString("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function Footer() {
  const visits = useVisitCount();

  return (
    <footer className="app-footer">
      <p>
        Tabelas de INSS e IRRF de ano-base 2026, já com a isenção/redutor de IRRF da Lei
        15.270/2025 para rendimentos brutos até R$ 7.350 — revise os valores em{" "}
        <code>constants.ts</code> antes de usar para outros anos. Esta calculadora é uma
        estimativa e não substitui a orientação de um contador.
      </p>
      <p className="build-stamp">
        Última atualização em <time dateTime={buildTime.toISOString()}>{formatted}</time>
        {visits !== null && (
          <>
            <span className="sep" aria-hidden="true">·</span>
            {visits.toLocaleString("pt-BR")} {visits === 1 ? "visita" : "visitas"}
          </>
        )}
      </p>
    </footer>
  );
}
