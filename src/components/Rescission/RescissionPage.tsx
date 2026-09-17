import { useMemo } from "react";
import type { CltInput } from "../../lib/calc/types";
import {
  RESCISSION_TYPES,
  calculateRescission,
  compareRescissions,
  type RescissionInput,
  type RescissionItem,
  type RescissionResult,
  type RescissionType,
} from "../../lib/rescission/rescission";
import { formatDate } from "../../lib/rescission/dates";
import { formatCurrency } from "../../lib/format";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { RescissionInputs } from "./RescissionInputs";

interface RescissionPageProps {
  clt: CltInput;
  value: RescissionInput;
  onCltChange: (clt: CltInput) => void;
  onChange: (value: RescissionInput) => void;
}

const typeLabel = (type: RescissionType) => RESCISSION_TYPES.find((t) => t.id === type)?.short ?? type;

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function Hero({ result }: { result: RescissionResult }) {
  const total = useAnimatedNumber(result.total);
  return (
    <section className="hero">
      <p className="hero-label">
        {typeLabel(result.type)}, com salário de {formatCurrency(result.salary)}: você recebe no total
      </p>
      <p className="hero-figure">{formatCurrency(total)}</p>
      <p className="hero-sub">
        {formatCurrency(result.net)} da rescisão
        {result.fgts.withdrawable > 0 && ` + ${formatCurrency(result.fgts.withdrawable)} do FGTS`}
        {result.unemployment.total > 0 && ` + ${formatCurrency(result.unemployment.total)} de seguro-desemprego`}
      </p>
      {result.fgts.remaining > 0.005 && (
        <p className="hero-sub">
          Mais {formatCurrency(result.fgts.remaining)} continuam na sua conta do FGTS.
        </p>
      )}
    </section>
  );
}

function ItemRows({ items, negative }: { items: RescissionItem[]; negative?: boolean }) {
  return (
    <>
      {items.map((item) => (
        <tr key={item.key}>
          <th scope="row">
            {item.label}
            <span className="item-detail">{item.detail}</span>
          </th>
          <td className={negative && item.value > 0.004 ? "negative" : undefined}>
            {negative && item.value > 0.004 ? `− ${formatCurrency(item.value)}` : formatCurrency(item.value)}
          </td>
        </tr>
      ))}
    </>
  );
}

function ServiceCard({ result }: { result: RescissionResult }) {
  const { service, notice } = result;
  const parts = [
    service.years > 0 && plural(service.years, "ano", "anos"),
    service.months > 0 && plural(service.months, "mês", "meses"),
    service.days > 0 && plural(service.days, "dia", "dias"),
  ].filter(Boolean);

  return (
    <section className="card">
      <h3 className="card-title">Tempo de casa e aviso prévio</h3>
      <dl className="kv-list">
        <div>
          <dt>Período</dt>
          <dd>
            {formatDate(result.admission)} a {formatDate(result.termination)}
          </dd>
        </div>
        <div>
          <dt>Tempo de empresa</dt>
          <dd>{parts.length ? parts.join(", ") : "menos de 1 dia"}</dd>
        </div>
        <div>
          <dt>Aviso prévio</dt>
          <dd>
            {result.type === "PEDIDO"
              ? "30 dias, devidos por você"
              : `${notice.totalDays} dias (30 + 3 × ${service.years} ${service.years === 1 ? "ano" : "anos"})`}
          </dd>
        </div>
        {notice.paidDays > 0 && (
          <div>
            <dt>Dias de aviso pagos</dt>
            <dd>{notice.paidDays.toLocaleString("pt-BR")} dias</dd>
          </div>
        )}
        {notice.projectedDays > 0 && (
          <div>
            <dt>Fim do contrato com a projeção do aviso</dt>
            <dd>{formatDate(result.projectedEnd)}</dd>
          </div>
        )}
      </dl>
      {notice.projectedDays > 0 && (
        <p className="group-note">
          O aviso indenizado conta como tempo de serviço: os {notice.projectedDays} dias a mais entram no
          13º e nas férias proporcionais.
        </p>
      )}
    </section>
  );
}

function TrctCard({ result }: { result: RescissionResult }) {
  return (
    <section className="card">
      <h3 className="card-title">Rescisão, item por item</h3>
      <p className="card-subtitle">
        O que aparece no termo de rescisão (TRCT). A empresa tem até 10 dias depois do último dia para
        pagar.
      </p>
      <div className="table-scroll">
        <table className="comparison-table rescission-table">
          <thead>
            <tr>
              <th>Verbas a receber</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <ItemRows items={result.earnings} />
            <tr className="subtotal">
              <th scope="row">Total bruto</th>
              <td>{formatCurrency(result.grossEarnings)}</td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <th>Descontos</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <ItemRows items={result.discounts} negative />
            <tr className="subtotal">
              <th scope="row">
                Total de descontos
                <span className="item-detail">
                  Aviso indenizado e férias indenizadas (+ 1/3) não têm INSS nem imposto de renda.
                </span>
              </th>
              <td className={result.totalDiscounts > 0.004 ? "negative" : undefined}>
                − {formatCurrency(result.totalDiscounts)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Líquido da rescisão</th>
              <td>{formatCurrency(result.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function FgtsCard({ result }: { result: RescissionResult }) {
  const { fgts } = result;
  const pct = `${Math.round(fgts.fineRate * 100)}%`;
  return (
    <section className="card">
      <h3 className="card-title">FGTS</h3>
      <p className="card-subtitle">{fgts.detail}</p>
      <div className="table-scroll">
        <table className="comparison-table rescission-table">
          <tbody>
            <tr>
              <th scope="row">
                Saldo antes da rescisão
                <span className="item-detail">
                  {fgts.balanceEstimated
                    ? "Estimado: 8% dos salários, 13º e 1/3 de férias do período, sem rendimento. Informe o saldo real para mais precisão."
                    : "Valor que você informou."}
                </span>
              </th>
              <td>{formatCurrency(fgts.balance)}</td>
            </tr>
            <tr>
              <th scope="row">
                Depósito da rescisão
                <span className="item-detail">8% sobre saldo de salário, aviso prévio pago e 13º</span>
              </th>
              <td>{formatCurrency(fgts.deposit)}</td>
            </tr>
            <tr>
              <th scope="row">
                Multa rescisória {fgts.fineRate > 0 ? `(${pct})` : ""}
                <span className="item-detail">
                  {fgts.fineRate > 0
                    ? `${pct} sobre ${formatCurrency(fgts.balance + fgts.deposit)}, paga pela empresa na conta do FGTS`
                    : "Não há multa no pedido de demissão"}
                </span>
              </th>
              <td>{formatCurrency(fgts.fine)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Para sacar agora</th>
              <td>{formatCurrency(fgts.withdrawable)}</td>
            </tr>
            <tr className="payslip-extra">
              <th scope="row">Continua na conta do FGTS</th>
              <td>{formatCurrency(fgts.remaining)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function UnemploymentCard({ result }: { result: RescissionResult }) {
  const { unemployment } = result;
  return (
    <section className="card">
      <h3 className="card-title">Seguro-desemprego</h3>
      {unemployment.eligible ? (
        <div className="tiles compact">
          <article className="tile">
            <p className="tile-label">Parcelas</p>
            <p className="tile-value">{unemployment.installments}</p>
          </article>
          <article className="tile">
            <p className="tile-label">Valor de cada</p>
            <p className="tile-value">{formatCurrency(unemployment.value)}</p>
          </article>
          <article className="tile">
            <p className="tile-label">Total</p>
            <p className="tile-value">{formatCurrency(unemployment.total)}</p>
          </article>
        </div>
      ) : null}
      <p className="group-note">{unemployment.reason}</p>
      {unemployment.eligible && (
        <p className="group-note">
          Peça entre 7 e 120 dias depois da demissão, pelo app Carteira de Trabalho Digital ou gov.br. O
          valor usa a média dos 3 últimos salários, com teto de R$ 2.518,65 em 2026.
        </p>
      )}
    </section>
  );
}

type Row = { label: string; get: (r: RescissionResult) => number; strong?: boolean; negative?: boolean };

const COMPARISON_ROWS: Row[] = [
  { label: "Saldo de salário", get: (r) => item(r, "saldo") },
  { label: "Aviso prévio", get: (r) => item(r, "aviso") },
  { label: "13º proporcional", get: (r) => item(r, "decimo") },
  { label: "Férias vencidas + 1/3", get: (r) => item(r, "ferias-vencidas") + item(r, "terco-vencidas") },
  { label: "Férias proporcionais + 1/3", get: (r) => item(r, "ferias") + item(r, "terco") },
  { label: "Descontos", get: (r) => -r.totalDiscounts, negative: true },
  { label: "Líquido da rescisão", get: (r) => r.net, strong: true },
  { label: "Multa do FGTS", get: (r) => r.fgts.fine },
  { label: "FGTS para sacar (com a multa)", get: (r) => r.fgts.withdrawable },
  { label: "Seguro-desemprego", get: (r) => r.unemployment.total },
  { label: "Total que você recebe", get: (r) => r.total, strong: true },
  { label: "Fica na conta do FGTS", get: (r) => r.fgts.remaining },
];

function item(r: RescissionResult, key: string) {
  return r.earnings.find((i) => i.key === key)?.value ?? 0;
}

function ComparisonCard({
  results,
  selected,
  onSelect,
}: {
  results: RescissionResult[];
  selected: RescissionType;
  onSelect: (type: RescissionType) => void;
}) {
  const best = results.reduce((a, b) => (b.total > a.total ? b : a));
  const worst = results.reduce((a, b) => (b.total < a.total ? b : a));

  return (
    <section className="card">
      <h3 className="card-title">Comparação dos 3 tipos de demissão</h3>
      <p className="card-subtitle">
        Mesmos dados e mesmo último dia. O aviso trabalhado continua trabalhado; nos outros casos, a
        empresa indeniza quando demite e dispensa o aviso no pedido de demissão.
      </p>
      <p className="scroll-hint">Deslize a tabela para o lado para ver os três →</p>
      <div className="table-scroll">
        <table className="comparison-table rescission-compare">
          <thead>
            <tr>
              <th />
              {results.map((r) => (
                <th key={r.type} className={r.type === selected ? "selected" : undefined}>
                  {typeLabel(r.type)}
                  {r.type === selected ? (
                    <span className="compare-badge">você escolheu</span>
                  ) : (
                    <button type="button" className="compare-badge link" onClick={() => onSelect(r.type)}>
                      ver detalhes
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className={row.strong ? "subtotal" : undefined}>
                <th scope="row">{row.label}</th>
                {results.map((r) => {
                  const v = row.get(r);
                  return (
                    <td
                      key={r.type}
                      className={[
                        r.type === selected ? "selected" : "",
                        row.negative && v < -0.004 ? "negative" : "",
                      ].join(" ").trim() || undefined}
                    >
                      {row.negative && v < -0.004 ? `− ${formatCurrency(-v)}` : formatCurrency(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="group-note">
        <strong>{typeLabel(best.type)}</strong> rende mais: {formatCurrency(best.total - worst.total)} a mais
        que <strong>{typeLabel(worst.type).toLowerCase()}</strong>. No acordo você abre mão de metade do aviso,
        de metade da multa, de 20% do saque do FGTS e do seguro-desemprego.
      </p>
    </section>
  );
}

function NotesCard() {
  return (
    <section className="card">
      <h3 className="card-title">O que esta conta não inclui</h3>
      <ul className="notes-list">
        <li>Horas extras, comissões e adicionais variáveis — some a média deles ao salário.</li>
        <li>Regras da convenção coletiva da sua categoria (multas, aviso maior, estabilidades).</li>
        <li>O rendimento da conta do FGTS, quando o saldo é estimado.</li>
        <li>
          Demissão por justa causa: nela só entram saldo de salário e férias vencidas + 1/3, sem 13º, férias
          proporcionais, multa, saque do FGTS ou seguro-desemprego.
        </li>
        <li>É uma estimativa — confira com o sindicato, um contador ou advogado trabalhista.</li>
      </ul>
    </section>
  );
}

export function RescissionPage({ clt, value, onCltChange, onChange }: RescissionPageProps) {
  const salary = clt.grossSalary;
  const dependents = clt.dependents;

  const outcome = useMemo(() => calculateRescission(salary, dependents, value), [salary, dependents, value]);
  const estimate = useMemo(() => {
    const auto = calculateRescission(salary, dependents, { ...value, fgtsBalance: null });
    return auto.ok ? auto.result.fgts.balance : 0;
  }, [salary, dependents, value]);
  const comparison = useMemo(
    () =>
      compareRescissions(salary, dependents, value).flatMap((c) => (c.outcome.ok ? [c.outcome.result] : [])),
    [salary, dependents, value],
  );

  return (
    <>
      <main className="input-grid">
        <RescissionInputs
          clt={clt}
          value={value}
          estimatedFgts={estimate}
          onCltChange={onCltChange}
          onChange={onChange}
        />
      </main>

      <div className="app-shell-results">
        {outcome.ok ? (
          <>
            <Hero result={outcome.result} />
            <ServiceCard result={outcome.result} />
            <TrctCard result={outcome.result} />
            <FgtsCard result={outcome.result} />
            <UnemploymentCard result={outcome.result} />
            {comparison.length === 3 && (
              <ComparisonCard
                results={comparison}
                selected={value.type}
                onSelect={(type) => {
                  onChange({ ...value, type, noticeMode: comparison.find((r) => r.type === type)!.noticeMode });
                  document.querySelector(".app-shell-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            )}
            <NotesCard />
          </>
        ) : (
          <section className="hero pending">
            <p className="hero-label">Quanto você recebe</p>
            <p className="hero-figure">{outcome.message}</p>
            <p className="hero-sub">O cálculo aparece aqui assim que as datas estiverem preenchidas.</p>
          </section>
        )}
      </div>
    </>
  );
}
