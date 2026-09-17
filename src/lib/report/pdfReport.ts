import type { jsPDF as JsPdf } from "jspdf";
import type { CltInput, ComparisonResult, PjInput } from "../calc/types";
import { PJ_ACTIVITIES, PJ_INSS_PRESETS, PJ_TAX_PRESETS } from "../calc/constants";
import { deriveCltDefaults } from "../calc/clt";
import { applyActivity } from "../calc/pj";
import { buildComparisonRows } from "../comparisonRows";
import { MONTH_NAMES, formatHolidayDate, formatYearMonth } from "../calendar/format";

const SITE_URL = "meiodormindo.github.io/calculadora-clt-pj";

// As fontes padrão do PDF usam WinAnsi: sem símbolos fora dele (setas, ▲▼), e
// os espaços especiais que o Intl põe em "R$ 1.234,56" viram espaço comum.
const clean = (text: string) => text.replace(/[  ]/g, " ");
const money = (value: number) =>
  clean(value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const signed = (value: number | null) => (value === null ? "—" : money(value));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const INK = [11, 11, 11] as const;
const MUTED = [110, 110, 105] as const;
const CLT = [42, 120, 214] as const;
const PJ = [235, 104, 52] as const;

type AutoTable = (doc: JsPdf, options: import("jspdf-autotable").UserOptions) => void;

interface Ctx {
  doc: JsPdf;
  autoTable: AutoTable;
  y: number;
}

const MARGIN = 14;

function lastY(doc: JsPdf): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? MARGIN;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.doc.internal.pageSize.getHeight() - 18) {
    ctx.doc.addPage();
    ctx.y = MARGIN + 4;
  }
}

function heading(ctx: Ctx, text: string, color: readonly number[] = INK) {
  ensureSpace(ctx, 16);
  ctx.doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(color[0], color[1], color[2]);
  ctx.doc.text(clean(text), MARGIN, ctx.y);
  ctx.y += 2;
}

function note(ctx: Ctx, text: string) {
  const width = ctx.doc.internal.pageSize.getWidth() - MARGIN * 2;
  ctx.doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const lines = ctx.doc.splitTextToSize(clean(text), width);
  ensureSpace(ctx, lines.length * 4 + 2);
  ctx.doc.text(lines, MARGIN, ctx.y + 1);
  // Espaço para o título seguinte não encavalar na nota.
  ctx.y += lines.length * 4 + 7;
}

function table(
  ctx: Ctx,
  head: string[] | null,
  body: (string | number)[][],
  options: { money?: number[]; accent?: readonly number[]; foot?: string[] } = {},
) {
  const alignRight = Object.fromEntries((options.money ?? []).map((i) => [i, { halign: "right" as const }]));
  ctx.autoTable(ctx.doc, {
    startY: ctx.y + 2,
    margin: { left: MARGIN, right: MARGIN },
    head: head ? [head.map(clean)] : undefined,
    body: body.map((row) => row.map((cell) => clean(String(cell)))),
    foot: options.foot ? [options.foot.map(clean)] : undefined,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.8, textColor: [40, 40, 38], lineColor: [225, 224, 217], lineWidth: 0.2 },
    headStyles: {
      fillColor: (options.accent ?? [242, 241, 236]) as [number, number, number],
      textColor: options.accent ? [255, 255, 255] : [60, 60, 58],
      fontStyle: "bold",
    },
    footStyles: { fillColor: [242, 241, 236], textColor: [11, 11, 11], fontStyle: "bold" },
    columnStyles: alignRight,
    showHead: "everyPage",
    // columnStyles não vale para cabeçalho e rodapé: alinha as colunas de valor à mão.
    didParseCell: (data) => {
      if (data.section !== "body" && (options.money ?? []).includes(data.column.index)) {
        data.cell.styles.halign = "right";
      }
    },
  });
  ctx.y = lastY(ctx.doc) + 6;
}

function keyValues(ctx: Ctx, rows: [string, string][]) {
  table(ctx, null, rows, { money: [1] });
}

export async function downloadPdfReport(
  result: ComparisonResult,
  cltInput: CltInput,
  rawPjInput: PjInput,
  now: Date = new Date(),
): Promise<void> {
  // Carrega o jsPDF só quando alguém pede o relatório.
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: Ctx = { doc, autoTable: autoTable as AutoTable, y: MARGIN + 4 };
  const { clt, minimum, proposed, calendar, minimumGross } = result;
  const pjInput = applyActivity(rawPjInput);
  const billing = proposed.billing;
  const months = calendar.months.length;
  const generatedAt = now.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  // ---------- cabeçalho ----------
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Relatório CLT vs PJ", MARGIN, ctx.y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(clean(`Gerado em ${generatedAt} · ${SITE_URL}`), MARGIN, ctx.y + 6);
  ctx.y += 14;

  // ---------- resultado ----------
  heading(ctx, "Resultado");
  const gap = minimumGross === null ? null : proposed.grossInvoice - minimumGross;
  keyValues(ctx, [
    [
      "PJ precisa faturar por mês para empatar com o CLT",
      minimumGross === null ? "Fora do alcance (acima de R$ 200.000)" : money(minimumGross),
    ],
    ...(minimum?.billing.hourlyRate != null
      ? ([["Equivale a, por hora", money(minimum.billing.hourlyRate)]] as [string, string][])
      : []),
    ["Proposta PJ por mês", money(proposed.grossInvoice)],
    [
      "Proposta em relação ao mínimo",
      gap === null ? "—" : `${gap >= 0 ? "acima" : "abaixo"} em ${money(Math.abs(gap))}`,
    ],
    ["CLT: líquido no holerite (mês comum)", money(clt.payslip.net)],
    ...(clt.externalIncome > 0
      ? ([["CLT: líquido com o recebido por fora", money(clt.monthlyInPocket)]] as [string, string][])
      : []),
    ["CLT: média mensal do ano (com 13º e 1/3 de férias)", money(clt.netEffective)],
    ["PJ na proposta: sobra por mês", money(proposed.netEffective)],
    [
      "Proposta vs CLT (média do ano)",
      `${money(result.proposalDelta)} (${result.proposalDeltaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`,
    ],
  ]);

  // ---------- dados informados ----------
  const auto = deriveCltDefaults(cltInput);
  const autoOr = (value: number | null, automatic: number) =>
    value === null ? `${money(automatic)} (automático)` : `${money(value)} (informado)`;

  heading(ctx, "Dados informados · CLT", CLT);
  keyValues(ctx, [
    ["Salário bruto mensal", money(cltInput.grossSalary)],
    ["Dependentes (IRRF)", String(cltInput.dependents)],
    ["Ajuda de custo (não tributável)", money(cltInput.allowance)],
    ["Recebido por fora (líquido)", money(cltInput.externalIncome)],
    ["Vale-transporte (valor total)", money(cltInput.transportVoucher)],
    ["Vale-refeição", money(cltInput.mealVoucher)],
    ["Plano de saúde: empresa paga", money(cltInput.healthPlan)],
    ["Plano de saúde: seu desconto", money(cltInput.healthPlanEmployeeShare)],
    ["Participação nos lucros (mês)", autoOr(cltInput.profitSharing, auto.profitSharing)],
    ["Auxílio maternidade", money(cltInput.maternityAid)],
    ["Outros benefícios", money(cltInput.otherBenefits)],
    ["Adicional de férias (mês)", autoOr(cltInput.vacationBonus, auto.vacationBonus)],
    ["Décimo terceiro (mês)", autoOr(cltInput.thirteenth, auto.thirteenth)],
    ["FGTS (mês)", autoOr(cltInput.fgts, auto.fgts)],
    ["Multa do FGTS (mês)", autoOr(cltInput.fgtsFine, auto.fgtsFine)],
    ["Aviso prévio (mês)", autoOr(cltInput.priorNotice, auto.priorNotice)],
    ["INSS patronal (mês)", autoOr(cltInput.employerInss, auto.employerInss)],
    ["RAT (mês)", autoOr(cltInput.rat, auto.rat)],
    ["Sistema S (mês)", autoOr(cltInput.sistemaS, auto.sistemaS)],
  ]);

  const activity = PJ_ACTIVITIES.find((a) => a.id === pjInput.activity);
  const regime = PJ_TAX_PRESETS.find((p) => p.id === pjInput.taxRegime);
  const inss = PJ_INSS_PRESETS.find((p) => p.id === pjInput.inssMode);
  const yesNo = (value: boolean) => (value ? "sim" : "não");

  heading(ctx, "Dados informados · PJ", PJ);
  keyValues(ctx, [
    ["Valor proposto por mês", money(pjInput.proposedGross)],
    ["Atividade", activity?.label ?? pjInput.activity],
    ["Regime tributário", `${regime?.label ?? pjInput.taxRegime}${pjInput.taxRegime === "MANUAL" ? ` (${pjInput.manualTaxRatePct}%)` : ""}`],
    ["INSS", inss?.label ?? pjInput.inssMode],
    ["Forma de pagamento", pjInput.billingMode === "HOURLY" ? "Por hora trabalhada" : "Valor fixo por mês"],
    ["Horas mensais desse valor", `${pjInput.monthlyHours}h`],
    ["Horas por dia", `${pjInput.hoursPerDay}h`],
    ["Hora contratada", money(billing.contractedHourlyRate)],
    ["Contrato", `${plural(months, "mês", "meses")} a partir de ${formatYearMonth(calendar.start)}`],
    ["Contar Carnaval e Corpus Christi", yesNo(pjInput.includeOptionalHolidays)],
    ["Feriados estaduais/municipais", `${pjInput.localHolidaysPerYear} dias/ano`],
    ["Empresa abona feriados", yesNo(pjInput.paidHolidays)],
    ["Médico / doença", `${pjInput.sickDaysPerYear} dias/ano (abonados: ${yesNo(pjInput.paidSickDays)})`],
    ["Férias", `${pjInput.vacationDaysPerYear} dias úteis/ano (pagos: ${pjInput.paidVacationDays})`],
    ["Contabilidade (mês)", money(pjInput.accountantFee)],
    ["Seguro de vida (mês)", money(pjInput.lifeInsurance)],
  ]);

  // ---------- holerite ----------
  heading(ctx, "Holerite do mês · CLT", CLT);
  const slip = clt.payslip;
  const slipRows: string[][] = [
    ["Salário", money(slip.salary), ""],
    ...(slip.allowance > 0 ? [["Ajuda de custo", money(slip.allowance), ""]] : []),
    ["INSS", "", money(slip.inss)],
    ["IRRF", "", money(slip.irrf)],
    ...(slip.healthPlanDiscount > 0 ? [["Plano de saúde", "", money(slip.healthPlanDiscount)]] : []),
    ...(slip.transportVoucherDiscount > 0 ? [["Vale-transporte", "", money(slip.transportVoucherDiscount)]] : []),
    ["Totais", money(slip.totalEarnings), money(slip.totalDiscounts)],
  ];
  table(ctx, ["Descrição", "Vencimentos", "Descontos"], slipRows, {
    money: [1, 2],
    foot: ["Valor líquido", "", money(slip.net)],
  });
  keyValues(ctx, [
    ["Líquido no holerite", money(slip.net)],
    ...(clt.externalIncome > 0 ? ([["+ recebido por fora", money(clt.externalIncome)]] as [string, string][]) : []),
    [`+ 13º líquido (${money(clt.thirteenthNet)} ÷ 12)`, money(clt.thirteenthNet / 12)],
    [`+ 1/3 de férias líquido (${money(clt.vacationBonusNet)} ÷ 12)`, money(clt.vacationBonusNet / 12)],
    ["= Média mensal usada na comparação", money(clt.netEffective)],
  ]);
  note(ctx, `FGTS do mês: ${money(slip.fgts)}. FGTS e benefícios não entram na média: aparecem no lado PJ como custo.`);

  // ---------- comparativo ----------
  heading(ctx, "Comparativo mensal, linha a linha");
  table(
    ctx,
    ["Descrição", "CLT", "PJ mínimo", "PJ proposta"],
    buildComparisonRows(result).map((r) => [r.label, signed(r.clt), signed(r.min), signed(r.prop)]),
    {
      money: [1, 2, 3],
      foot: [
        "Remuneração líquida efetiva",
        money(clt.netEffective),
        minimum ? money(minimum.netEffective) : "—",
        money(proposed.netEffective),
      ],
    },
  );
  note(ctx, "No CLT, INSS e IRRF são a média do ano, já contando 13º e férias. Valores negativos são custos.");

  // ---------- empresa vs você ----------
  heading(ctx, "Empresa vs você");
  const analysisRows = (label: string, a: ComparisonResult["analysisProposed"]) => [
    [`${label}: como CLT`, money(a.employerClt), money(a.workerClt)],
    [`${label}: como PJ`, money(a.employerPj), money(a.workerPj)],
    [
      `${label}: variação`,
      `${money(a.employerDelta)} (${a.employerDeltaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`,
      `${money(a.workerDelta)} (${a.workerDeltaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`,
    ],
  ];
  table(
    ctx,
    ["Cenário", "Custo da empresa", "Seus custos"],
    [
      ...(result.analysisMinimum ? analysisRows("Mínimo justo", result.analysisMinimum) : []),
      ...analysisRows("Proposta atual", result.analysisProposed),
    ],
    { money: [1, 2] },
  );

  // ---------- contrato ----------
  heading(ctx, `Contrato · ${plural(months, "mês", "meses")} a partir de ${formatYearMonth(calendar.start)}`, PJ);
  keyValues(ctx, [
    ["CLT no período", money(clt.netEffective * months)],
    ["PJ na proposta no período", money(proposed.netEffective * months)],
    ["Diferença no período", money((proposed.netEffective - clt.netEffective) * months)],
    ["Dias úteis / feriados em dia útil", `${calendar.totalWorkdays} / ${calendar.totalHolidays}`],
    ["Horas trabalhadas no calendário", `${Math.round(billing.totalWorkedHours).toLocaleString("pt-BR")}h`],
    ["Hora efetiva (faturado ÷ horas trabalhadas)", money(billing.effectiveHourlyRate)],
  ]);

  const hourly = billing.hourlyRate !== null;
  table(
    ctx,
    ["Mês", "Dias úteis", "Feriados", hourly ? "Horas faturadas" : "Horas trabalhadas", "Faturado"],
    billing.perMonth.map((m) => [
      `${MONTH_NAMES[m.month - 1]} ${m.year}`,
      String(m.workdays),
      String(m.holidays),
      `${Math.round((hourly ? (m.hours ?? 0) : m.workedHours) * 10) / 10}h`,
      money(m.billed),
    ]),
    {
      money: [1, 2, 3, 4],
      foot: [
        "Total",
        String(calendar.totalWorkdays),
        String(calendar.totalHolidays),
        `${Math.round(billing.perMonth.reduce((s, m) => s + (hourly ? (m.hours ?? 0) : m.workedHours), 0)).toLocaleString("pt-BR")}h`,
        money(billing.perMonth.reduce((s, m) => s + m.billed, 0)),
      ],
    },
  );
  note(ctx, "Faturado antes de doença, férias e feriados locais, que não têm data e entram como média mensal.");

  const holidays = calendar.months.flatMap((m) =>
    m.allHolidays.map((h) => [
      formatHolidayDate(h.date),
      h.name,
      m.holidays.includes(h) ? h.kind : "não conta (fim de semana ou desligado)",
    ]),
  );
  heading(ctx, `Feriados do período (${holidays.length})`);
  table(ctx, ["Data", "Feriado", "Situação"], holidays);

  // ---------- rodapé em todas as páginas ----------
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    const height = doc.internal.pageSize.getHeight();
    const width = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(
      clean("Estimativa com tabelas de INSS, IRRF e Simples de 2026 e feriados nacionais. Não substitui um contador."),
      MARGIN,
      height - 8,
    );
    doc.text(`Página ${page} de ${pages}`, width - MARGIN, height - 8, { align: "right" });
  }

  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  doc.save(`relatorio-clt-vs-pj-${stamp}.pdf`);
}
