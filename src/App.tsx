import { useMemo, useRef } from "react";
import { usePersistedState } from "./hooks/usePersistedState";
import { compareCltVsPj } from "./lib/calc/compare";
import { createDefaultState, type AppState } from "./lib/defaults";
import { formatCurrency } from "./lib/format";
import { CltInputs } from "./components/InputForm/CltInputs";
import { PjInputs } from "./components/InputForm/PjInputs";
import { ComparisonSummary } from "./components/Results/ComparisonSummary";
import { BreakevenCallout } from "./components/Results/BreakevenCallout";
import { ComparisonTable } from "./components/Results/ComparisonTable";
import { CostAnalysisPanel } from "./components/Results/CostAnalysisPanel";
import { PjDrivers } from "./components/Results/PjDrivers";
import { PayslipCard } from "./components/Results/PayslipCard";
import { ReportButton } from "./components/Results/ReportButton";
import { ContractTotalsCard } from "./components/Results/ContractTotalsCard";
import { ContractCalendarCard } from "./components/Results/ContractCalendarCard";
import { Header } from "./components/Layout/Header";
import { Footer } from "./components/Layout/Footer";
import { Donate } from "./components/Layout/Donate";
import { Tabs } from "./components/Layout/Tabs";
import { AccountantsPage } from "./components/Accountants/AccountantsPage";
import { useHashTab } from "./hooks/useHashTab";
import { ResetButton } from "./components/InputForm/ResetButton";
import { RescissionPage } from "./components/Rescission/RescissionPage";


function App() {
  const [state, setState, resetState] = usePersistedState<AppState>(createDefaultState);
  const resultsRef = useRef<HTMLDivElement>(null);
  const tab = useHashTab();

  const result = useMemo(() => compareCltVsPj(state.clt, state.pj), [state.clt, state.pj]);

  return (
    <div className="app-shell">
      <Tabs current={tab} />
      <Header tab={tab} />

      {tab === "contadores" ? (
        <AccountantsPage />
      ) : tab === "demissao" ? (
        <>
          <ResetButton onReset={resetState} />
          <RescissionPage
            clt={state.clt}
            value={state.rescission}
            onCltChange={(clt) => setState({ ...state, clt })}
            onChange={(rescission) => setState({ ...state, rescission })}
          />
        </>
      ) : (
        <>
          <ResetButton onReset={resetState} />
          <main className="input-grid">
            <CltInputs value={state.clt} onChange={(clt) => setState({ ...state, clt })} />
            <PjInputs value={state.pj} onChange={(pj) => setState({ ...state, pj })} />
          </main>

          <div ref={resultsRef} className="app-shell-results">
            <BreakevenCallout result={result} />
            <ReportButton result={result} clt={state.clt} pj={state.pj} />
            <ComparisonSummary result={result} />
            <PayslipCard result={result} />
            <ContractTotalsCard result={result} />
            <ContractCalendarCard result={result} />
            <PjDrivers result={result} />
            <CostAnalysisPanel result={result} />
            <ComparisonTable result={result} />
          </div>
        </>
      )}

      <Donate />

      <Footer />

      {tab === "calculadora" && (
        <div className="sticky-bar">
          <div>
            <p className="label">
              {result.goalExtra > 0 ? "PJ precisa faturar (meta)" : "PJ precisa faturar"}
            </p>
            <p className="value">
              {result.goalGross === null
                ? "Fora do alcance"
                : `${formatCurrency(result.goalGross)}/mês`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Ver detalhes
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
