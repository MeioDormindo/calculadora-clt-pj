import type { InssBracket, IrrfBracket, PjTaxRegimeId, PjInssModeId, SimplesBracket } from "./types";

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

// Alternativa às deduções legais (INSS + dependentes) na retenção mensal: vale
// o que for mais vantajoso. Não existe no 13º, que tem tributação exclusiva.
export const IRRF_DESCONTO_SIMPLIFICADO = 607.2;

// Lei 15.270/2025: isenção efetiva de IRRF para quem tem rendimento bruto
// mensal até este valor, e redução progressiva ("redutor") do imposto
// calculado normalmente para quem recebe entre este valor e
// IRRF_REDUTOR_GROSS_LIMIT. O redutor usa o rendimento BRUTO (não a base já
// descontada de INSS/dependentes) e nunca deixa o imposto negativo.
export const IRRF_ISENCAO_GROSS_LIMIT = 5000.0;
// Redução máxima até R$ 5.000 — com o desconto simplificado, zera o imposto.
export const IRRF_REDUCAO_MAXIMA = 312.89;
export const IRRF_REDUTOR_GROSS_LIMIT = 7350.0;
export const IRRF_REDUTOR_BASE = 978.62;
export const IRRF_REDUTOR_FACTOR = 0.133145;

export const FGTS_RATE = 0.08;
export const FGTS_TERMINATION_FINE_RATE = 0.4;

// Lei 7.418/85: o empregado banca o vale-transporte até 6% do salário básico;
// a empresa só paga o que passar disso.
export const TRANSPORT_VOUCHER_EMPLOYEE_SHARE = 0.06;

export const MINIMUM_WAGE = 1621.0;

// Divisores das provisões mensais do pacote CLT, no mesmo critério da
// planilha de referência: o valor anual do direito diluído por mês.
export const VACATION_BONUS_DIVISOR = 36; // 1/3 de um salário, dividido por 12
export const THIRTEENTH_DIVISOR = 12; // um salário por ano
export const PRIOR_NOTICE_DIVISOR = 24; // meio salário por ano de provisão
export const PROFIT_SHARING_DIVISOR = 12; // uma PLR de um salário por ano

// Encargos patronais sobre a folha (empresa fora do Simples Nacional). A folha
// inclui 13º e férias + 1/3, não só o salário do mês — o mesmo vale para o FGTS.
export const EMPLOYER_INSS_RATE = 0.2;
export const RAT_RATE = 0.03; // 1% a 3% conforme o grau de risco do CNAE
export const SISTEMA_S_RATE = 0.058; // salário-educação, SEBRAE, SESI/SENAI etc.

// Teto do MEI: R$ 81.000/ano desde 2018, mantido em 2026.
export const MEI_ANNUAL_LIMIT = 81000;
export const MEI_MONTHLY_LIMIT = MEI_ANNUAL_LIMIT / 12;

// Simples Nacional 2026 (LC 123/2006). Alíquota efetiva =
// (RBT12 x nominal - parcela a deduzir) / RBT12, com RBT12 = receita de 12 meses.
export const SIMPLES_ANEXO_I: SimplesBracket[] = [
  { upTo: 180000, rate: 0.04, deduction: 0 },
  { upTo: 360000, rate: 0.073, deduction: 5940 },
  { upTo: 720000, rate: 0.095, deduction: 13860 },
  { upTo: 1800000, rate: 0.107, deduction: 22500 },
  { upTo: 3600000, rate: 0.143, deduction: 87300 },
  { upTo: 4800000, rate: 0.19, deduction: 378000 },
];

export const SIMPLES_ANEXO_II: SimplesBracket[] = [
  { upTo: 180000, rate: 0.045, deduction: 0 },
  { upTo: 360000, rate: 0.078, deduction: 5940 },
  { upTo: 720000, rate: 0.1, deduction: 13860 },
  { upTo: 1800000, rate: 0.112, deduction: 22500 },
  { upTo: 3600000, rate: 0.147, deduction: 85500 },
  { upTo: 4800000, rate: 0.3, deduction: 720000 },
];

export const SIMPLES_ANEXO_III: SimplesBracket[] = [
  { upTo: 180000, rate: 0.06, deduction: 0 },
  { upTo: 360000, rate: 0.112, deduction: 9360 },
  { upTo: 720000, rate: 0.135, deduction: 17640 },
  { upTo: 1800000, rate: 0.16, deduction: 35640 },
  { upTo: 3600000, rate: 0.21, deduction: 125640 },
  { upTo: 4800000, rate: 0.33, deduction: 648000 },
];

// No Anexo IV o INSS patronal (CPP) não está no DAS: é pago à parte.
export const SIMPLES_ANEXO_IV: SimplesBracket[] = [
  { upTo: 180000, rate: 0.045, deduction: 0 },
  { upTo: 360000, rate: 0.09, deduction: 8100 },
  { upTo: 720000, rate: 0.102, deduction: 12420 },
  { upTo: 1800000, rate: 0.14, deduction: 39780 },
  { upTo: 3600000, rate: 0.22, deduction: 183780 },
  { upTo: 4800000, rate: 0.33, deduction: 828000 },
];

export const SIMPLES_ANEXO_V: SimplesBracket[] = [
  { upTo: 180000, rate: 0.155, deduction: 0 },
  { upTo: 360000, rate: 0.18, deduction: 4500 },
  { upTo: 720000, rate: 0.195, deduction: 9900 },
  { upTo: 1800000, rate: 0.205, deduction: 17100 },
  { upTo: 3600000, rate: 0.23, deduction: 62100 },
  { upTo: 4800000, rate: 0.305, deduction: 540000 },
];

export interface PjTaxPreset {
  id: PjTaxRegimeId;
  label: string;
  brackets?: SimplesBracket[];
  fixedMonthly?: number;
}

export const PJ_TAX_PRESETS: PjTaxPreset[] = [
  { id: "MEI", label: "MEI (DAS fixo — serviços)", fixedMonthly: 86.05 },
  { id: "SIMPLES_I", label: "Simples Nacional — Anexo I (a partir de 4%)", brackets: SIMPLES_ANEXO_I },
  { id: "SIMPLES_II", label: "Simples Nacional — Anexo II (a partir de 4,5%)", brackets: SIMPLES_ANEXO_II },
  { id: "SIMPLES_III", label: "Simples Nacional — Anexo III (a partir de 6%)", brackets: SIMPLES_ANEXO_III },
  { id: "SIMPLES_IV", label: "Simples Nacional — Anexo IV (a partir de 4,5%)", brackets: SIMPLES_ANEXO_IV },
  { id: "SIMPLES_V", label: "Simples Nacional — Anexo V (a partir de 15,5%)", brackets: SIMPLES_ANEXO_V },
  { id: "CARNE_LEAO", label: "Autônomo sem CNPJ — carnê-leão (tabela do IR)" },
  { id: "MANUAL", label: "Taxa manual" },
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
    id: "ANEXO_IV",
    label: "Simples Nacional Anexo IV (pró-labore + CPP)",
    description: "Pró-labore de 1 salário mínimo: 11% seu e 20% de INSS patronal, pago fora do DAS",
  },
  {
    id: "AUTONOMO",
    label: "Autônomo sem CNPJ",
    description: "20% sobre o valor recebido, limitado ao teto do INSS. Combine com o regime carnê-leão",
  },
  {
    id: "CUSTOM",
    label: "Personalizado",
    description: "Você define o percentual e a base de cálculo",
  },
];

// Fração mínima de pró-labore sobre o faturamento para serviços sujeitos ao
// Fator R saírem do Anexo V e ficarem no Anexo III.
export const FATOR_R_MIN = 0.28;

export interface PjActivity {
  id: string;
  label: string;
  taxRegime: PjTaxRegimeId;
  inssMode: PjInssModeId;
  description: string;
}

// As descrições citam a alíquota da 1ª faixa; o cálculo usa a tabela inteira,
// então acima de R$ 15 mil/mês a alíquota efetiva sobe sozinha.
export const PJ_ACTIVITIES: PjActivity[] = [
  {
    id: "PJ_EMPRESA",
    label: "PJ em uma empresa",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Prestação de serviço intelectual: Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "TI",
    label: "Serviços de TI",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Desenvolvimento e suporte: Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "ADMIN",
    label: "Serviços administrativos",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Gestão e administração: Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "COMERCIO",
    label: "Comércio",
    taxRegime: "SIMPLES_I",
    inssMode: "SIMPLES_PROLABORE",
    description:
      "Anexo I (a partir de 4%). Pró-labore de 1 salário mínimo.",
  },
  {
    id: "INDUSTRIA",
    label: "Indústria",
    taxRegime: "SIMPLES_II",
    inssMode: "SIMPLES_PROLABORE",
    description:
      "Anexo II (a partir de 4,5%). Pró-labore de 1 salário mínimo.",
  },
  {
    id: "MEDICINA",
    label: "Medicina",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "ODONTOLOGIA",
    label: "Odontologia",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "SAUDE",
    label: "Psicologia, fisioterapia e outros da saúde",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "VETERINARIA",
    label: "Medicina veterinária",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "MARKETING",
    label: "Marketing e publicidade",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "ARQUITETURA",
    label: "Arquitetura",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "ENGENHARIA",
    label: "Engenharia",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "EDUCACAO",
    label: "Educação e cursos livres",
    taxRegime: "SIMPLES_III",
    inssMode: "SIMPLES_PROLABORE",
    description:
      "Anexo III (a partir de 6%) direto, sem Fator R. Pró-labore de 1 salário mínimo.",
  },
  {
    id: "ADVOCACIA",
    label: "Advocacia",
    taxRegime: "SIMPLES_IV",
    inssMode: "ANEXO_IV",
    description:
      "Anexo IV (a partir de 4,5%). O INSS patronal de 20% sobre o pró-labore é pago fora do DAS.",
  },
  {
    id: "CONSULTORIA",
    label: "Consultoria",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "REPRESENTACAO",
    label: "Representação comercial",
    taxRegime: "SIMPLES_III",
    inssMode: "FATOR_R",
    description:
      "Anexo III (a partir de 6%) via Fator R: pró-labore de 28% do faturamento, com INSS de 11% sobre ele. Sem isso, cairia no Anexo V (a partir de 15,5%).",
  },
  {
    id: "CONTABILIDADE",
    label: "Contabilidade",
    taxRegime: "SIMPLES_III",
    inssMode: "SIMPLES_PROLABORE",
    description:
      "Anexo III (a partir de 6%) direto. Em muitas cidades o ISS é fixo e pago à parte.",
  },
  {
    id: "CORRETAGEM",
    label: "Corretagem de imóveis",
    taxRegime: "SIMPLES_III",
    inssMode: "SIMPLES_PROLABORE",
    description:
      "Anexo III (a partir de 6%) direto, sem Fator R. Pró-labore de 1 salário mínimo.",
  },
  {
    id: "MEI",
    label: "MEI (atividades permitidas)",
    taxRegime: "MEI",
    inssMode: "MEI",
    description:
      "DAS fixo com INSS incluso. Teto de R$ 81 mil/ano, e nem toda profissão pode ser MEI.",
  },
  {
    id: "CUSTOM",
    label: "Outra / escolher manualmente",
    taxRegime: "SIMPLES_V",
    inssMode: "SIMPLES_PROLABORE",
    description:
      "Você escolhe o regime tributário e a contribuição ao INSS.",
  },
];
