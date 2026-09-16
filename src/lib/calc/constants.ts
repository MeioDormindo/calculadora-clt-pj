import type { InssBracket, IrrfBracket, PjTaxRegimeId, PjInssModeId } from "./types";

// Tabelas de referência: ano-base 2026. INSS, IRRF, salário mínimo e limites de
// MEI/Simples Nacional mudam todo ano (geralmente em janeiro) — revisar estes
// valores antes de usar o resultado para decisões em outros anos.
// Fontes: tabela INSS/IRRF 2026 (contabilizei.com.br, valorfinal.com.br) e
// Lei 15.270/2025 (nova faixa de isenção/redutor do IRRF, vigente desde
// 01/01/2026).

export const INSS_BRACKETS: InssBracket[] = [
  { upTo: 1621.0, rate: 0.075 },
  { upTo: 2902.84, rate: 0.09 },
  { upTo: 4354.27, rate: 0.12 },
  { upTo: 8475.55, rate: 0.14 },
];

// Teto do salário de contribuição do INSS — usado para limitar bases de
// cálculo de contribuintes individuais (ex.: autônomo a 20%).
export const INSS_CEILING = 8475.55;

export const IRRF_BRACKETS: IrrfBracket[] = [
  { upTo: 2428.8, rate: 0, deduction: 0 },
  { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
  { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
  { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
  { upTo: Infinity, rate: 0.275, deduction: 908.73 },
];

export const IRRF_DEPENDENT_DEDUCTION = 189.59;

// Lei 15.270/2025: isenção efetiva de IRRF para quem tem rendimento bruto
// mensal até este valor, e redução progressiva ("redutor") do imposto
// calculado normalmente para quem recebe entre este valor e
// IRRF_REDUTOR_GROSS_LIMIT. O redutor usa o rendimento BRUTO (não a base já
// descontada de INSS/dependentes) e nunca deixa o imposto negativo.
export const IRRF_ISENCAO_GROSS_LIMIT = 5000.0;
export const IRRF_REDUTOR_GROSS_LIMIT = 7350.0;
export const IRRF_REDUTOR_BASE = 978.62;
export const IRRF_REDUTOR_FACTOR = 0.133145;

export const FGTS_RATE = 0.08;
export const FGTS_TERMINATION_FINE_RATE = 0.4;

export const MINIMUM_WAGE = 1621.0;

// Divisores das provisões mensais do pacote CLT, no mesmo critério da
// planilha de referência: o valor anual do direito diluído por mês.
export const VACATION_BONUS_DIVISOR = 36; // 1/3 de um salário, dividido por 12
export const THIRTEENTH_DIVISOR = 12; // um salário por ano
export const PRIOR_NOTICE_DIVISOR = 24; // meio salário por ano de provisão
export const PROFIT_SHARING_DIVISOR = 12; // uma PLR de um salário por ano

// Encargos patronais sobre a folha (empresa fora do Simples Nacional).
export const EMPLOYER_INSS_RATE = 0.2;
export const RAT_RATE = 0.03; // 1% a 3% conforme o grau de risco do CNAE
export const SISTEMA_S_RATE = 0.058; // salário-educação, SEBRAE, SESI/SENAI etc.

// Teto do MEI: R$ 81.000/ano desde 2018, mantido em 2026.
export const MEI_ANNUAL_LIMIT = 81000;
export const MEI_MONTHLY_LIMIT = MEI_ANNUAL_LIMIT / 12;

export interface PjTaxPreset {
  id: PjTaxRegimeId;
  label: string;
  rate: number | null;
  fixedMonthly?: number;
}

export const PJ_TAX_PRESETS: PjTaxPreset[] = [
  { id: "MEI", label: "MEI (DAS fixo — serviços)", rate: null, fixedMonthly: 86.05 },
  { id: "SIMPLES_I", label: "Simples Nacional — Anexo I (~4%)", rate: 0.04 },
  { id: "SIMPLES_III", label: "Simples Nacional — Anexo III (~6%)", rate: 0.06 },
  { id: "SIMPLES_V", label: "Simples Nacional — Anexo V (~15,5%)", rate: 0.155 },
  { id: "MANUAL", label: "Taxa manual", rate: null },
];

export interface PjInssPreset {
  id: PjInssModeId;
  label: string;
  description: string;
}

export const PJ_INSS_PRESETS: PjInssPreset[] = [
  {
    id: "MEI",
    label: "MEI",
    description: "INSS já incluso no DAS fixo (sem custo adicional)",
  },
  {
    id: "SIMPLES_PROLABORE",
    label: "Simples Nacional (pró-labore)",
    description: "11% sobre 1 salário mínimo de pró-labore. Em serviços sujeitos ao Fator R, isso leva ao Anexo V",
  },
  {
    id: "FATOR_R",
    label: "Simples Nacional (Fator R)",
    description: "Pró-labore de 28% do faturamento, com INSS de 11% sobre ele — o que garante o Anexo III",
  },
  {
    id: "AUTONOMO",
    label: "Autônomo / carnê-leão",
    description: "20% sobre o valor recebido, limitado ao teto do INSS (sem CNPJ)",
  },
  {
    id: "CUSTOM",
    label: "Personalizado",
    description: "Você define o percentual e a base de cálculo",
  },
];

export const DEFAULT_ACCOUNTANT_FEE = 200;
export const DEFAULT_WORKING_DAYS_PER_MONTH = 22;
export const DEFAULT_HOLIDAYS_PER_YEAR = 12;
export const DEFAULT_SICK_DAYS_PER_YEAR = 5;
export const DEFAULT_VACATION_DAYS_PER_YEAR = 20;

// Fração mínima de pró-labore sobre o faturamento para serviços sujeitos ao
// Fator R saírem do Anexo V (15,5%) e ficarem no Anexo III (6%).
export const FATOR_R_MIN = 0.28;

export interface PjActivity {
  id: string;
  label: string;
  taxRegime: PjTaxRegimeId;
  inssMode: PjInssModeId;
  description: string;
}

// Alíquotas nominais da 1ª faixa do Simples (receita até R$ 180 mil/ano, ou
// R$ 15 mil/mês). Acima disso a alíquota efetiva sobe aos poucos.
export const PJ_ACTIVITIES: PjActivity[] = [
  {
    id: "TI",
    label: "Serviços de TI",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description: "Anexo III (6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele.",
  },
  {
    id: "PJ_EMPRESA",
    label: "PJ em uma empresa (consultoria)",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description: "Consultoria e serviço intelectual: Anexo III (6%) via Fator R.",
  },
  {
    id: "ADMIN",
    label: "Serviços administrativos",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description: "Anexo III (6%) via Fator R, com pró-labore de 28% do faturamento.",
  },
  {
    id: "MEDICINA",
    label: "Medicina",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description: "Anexo III (6%) via Fator R. Sem pró-labore de 28%, cairia no Anexo V (15,5%).",
  },
  {
    id: "SAUDE",
    label: "Psicologia e outros da saúde",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description: "Anexo III (6%) via Fator R, com pró-labore de 28% do faturamento.",
  },
  {
    id: "ENGENHARIA",
    label: "Engenharia e arquitetura",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description: "Anexo III (6%) via Fator R, com pró-labore de 28% do faturamento.",
  },
  {
    id: "MARKETING",
    label: "Marketing e publicidade",
    taxRegime: "SIMPLES_III",
    inssMode: "SIMPLES_PROLABORE",
    description: "Anexo III (6%) direto, sem Fator R. Pró-labore de 1 salário mínimo.",
  },
  {
    id: "COMERCIO",
    label: "Comércio",
    taxRegime: "SIMPLES_I",
    inssMode: "SIMPLES_PROLABORE",
    description: "Anexo I (4%). Pró-labore de 1 salário mínimo.",
  },
  {
    id: "MEI",
    label: "MEI (atividades permitidas)",
    taxRegime: "MEI",
    inssMode: "MEI",
    description: "DAS fixo com INSS incluso. Teto de R$ 81 mil/ano, e nem toda profissão pode ser MEI.",
  },
  {
    id: "CUSTOM",
    label: "Outra / escolher manualmente",
    taxRegime: "SIMPLES_V",
    inssMode: "SIMPLES_PROLABORE",
    description: "Você escolhe o regime tributário e a contribuição ao INSS.",
  },
];
