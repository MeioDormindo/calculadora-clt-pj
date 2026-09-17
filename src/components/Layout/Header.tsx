import type { Tab } from "../../hooks/useHashTab";

export function Header({ tab = "calculadora" }: { tab?: Tab }) {
  const rescission = tab === "demissao";
  return (
    <header className="app-header">
      <span className="tag">
        <span className="dot clt" />
        <span className="dot pj" />
        Tabelas 2026
      </span>
      <h1>{rescission ? "Quanto recebo na demissão?" : "CLT vs PJ"}</h1>
      <p className="lead">
        {rescission
          ? "Veja o que entra na sua rescisão — saldo de salário, aviso prévio, 13º, férias, FGTS e seguro-desemprego — e compare os três tipos de demissão."
          : "Descubra a partir de qual faturamento vale a pena sair da carteira assinada — contando 13º, férias, FGTS, impostos e os dias em que o PJ não fatura."}
      </p>
    </header>
  );
}
