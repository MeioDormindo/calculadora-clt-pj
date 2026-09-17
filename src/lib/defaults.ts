import type { CltInput, PjInput } from "./calc/types";
import { MINIMUM_WAGE } from "./calc/constants";
import type { RescissionInput } from "./rescission/rescission";

export interface AppState {
  clt: CltInput;
  pj: PjInput;
  rescission: RescissionInput;
}

/**
 * O que quem abre o site pela primeira vez (ou restaura o padrão) vê: salário
 * e proposta iguais ao salário mínimo configurado em constants.ts e nenhum
 * benefício de exemplo. Atualizar MINIMUM_WAGE atualiza o padrão.
 */
export function createDefaultState(): AppState {
  return {
    clt: {
      grossSalary: MINIMUM_WAGE,
      dependents: 0,
      vacationBonus: null,
      thirteenth: null,
      fgts: null,
      fgtsFine: null,
      priorNotice: null,
      profitSharing: null,
      transportVoucher: 0,
      mealVoucher: 0,
      healthPlan: 0,
      otherBenefits: 0,
      maternityAid: 0,
      healthPlanEmployeeShare: 0,
      allowance: 0,
      externalIncome: 0,
      employerInss: null,
      rat: null,
      sistemaS: null,
    },
    pj: {
      proposedGross: MINIMUM_WAGE,
      goalMode: "NONE",
      goalAmount: 0,
      goalPercent: 0,
      activity: "TI",
      taxRegime: "SIMPLES_III",
      manualTaxRatePct: 6,
      inssMode: "FATOR_R",
      customInssRatePct: 11,
      customInssBase: 0,
      accountantFee: 600,
      lifeInsurance: 300,
      billingMode: "MONTHLY",
      monthlyHours: 160,
      hoursPerDay: 8,
      contractMonths: 12,
      contractStart: null,
      includeOptionalHolidays: true,
      localHolidaysPerYear: 0,
      sickDaysPerYear: 5,
      vacationDaysPerYear: 20,
      paidHolidays: false,
      paidSickDays: false,
      paidVacationDays: 0,
    },
    rescission: {
      admissionDate: null,
      terminationDate: null,
      type: "SEM_JUSTA_CAUSA",
      noticeMode: "INDENIZADO",
      expiredVacationPeriods: 0,
      fgtsBalance: null,
      saqueAniversario: false,
      thirteenthAdvancePaid: false,
      unemploymentRequests: 0,
    },
  };
}
