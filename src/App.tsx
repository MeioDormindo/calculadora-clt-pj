import { useMemo, useRef } from "react";
import { usePersistedState } from "./hooks/usePersistedState";
import { compareCltVsPj } from "./lib/calc/compare";
import type { CltInput, PjInput } from "./lib/calc/types";
import { formatCurrency } from "./lib/format";
import { CltInputs } from "./components/InputForm/CltInputs";
import { PjInputs } from "./components/InputForm/PjInputs";
import { ComparisonSummary } from "./components/Results/ComparisonSummary";
import { BreakevenCallout } from "./components/Results/BreakevenCallout";
import { ComparisonTable } from "./components/Results/ComparisonTable";
import { CostAnalysisPanel } from "./components/Results/CostAnalysisPanel";
import { PjDrivers } from "./components/Results/PjDrivers";
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { Donate } from "./components/Layout/Donate";

interface AppState {
  clt: CltInput;
  pj: PjInput;
}

const defaultState: AppState = {
  clt: {
    grossSalary: 10000,
    dependents: 0,
    vacationBonus: null,
    thirteenth: null,
    fgts: null,
    fgtsFine: null,
    priorNotice: null,
    profitSharing: null,
    transportVoucher: 600,
    mealVoucher: 600,
    healthPlan: 2800,
    otherBenefits: 0,
    maternityAid: 500,
    externalIncome: 0,
    employerInss: null,
    rat: null,
    sistemaS: null,
  },
  pj: {
    proposedGross: 15000,
    taxRegime: "SIMPLES_III",
    manualTaxRatePct: 6,
    inssMode: "SIMPLES_PROLABORE",
    customInssRatePct: 11,
    customInssBase: 0,
    accountantFee: 600,
    lifeInsurance: 300,
    workingDaysPerMonth: 22,
    holidaysPerYear: 12,
    sickDaysPerYear: 5,
    vacationDaysPerYear: 20,
    paidHolidays: false,
    paidSickDays: false,
    paidVacationDays: 0,
  },
};

function App() {
  const [state, setState] = usePersistedState<AppState>(defaultState);
  const resultsRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => compareCltVsPj(state.clt, state.pj), [state.clt, state.pj]);

  return (
    <div className="app-shell">
      <Header />

      <main className="input-grid">
        <CltInputs value={state.clt} onChange={(clt) => setState({ ...state, clt })} />
        <PjInputs value={state.pj} onChange={(pj) => setState({ ...state, pj })} />
      </main>

      <div ref={resultsRef} className="app-shell-results">
        <BreakevenCallout result={result} />
        <ComparisonSummary result={result} />
        <PjDrivers result={result} />
        <CostAnalysisPanel result={result} />
        <ComparisonTable result={result} />
      </div>

      <Donate />

      <Footer />

      <div className="sticky-bar">
        <div>
          <p className="label">PJ precisa faturar</p>
          <p className="value">
            {result.minimumGross === null
              ? "Fora do alcance"
              : `${formatCurrency(result.minimumGross)}/mês`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

export default App;
