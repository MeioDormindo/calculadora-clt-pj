import { useState } from "react";
import type { CltInput, ComparisonResult, PjInput } from "../../lib/calc/types";

interface ReportButtonProps {
  result: ComparisonResult;
  clt: CltInput;
  pj: PjInput;
}

export function ReportButton({ result, clt, pj }: ReportButtonProps) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function generate() {
    setState("busy");
    try {
      const { downloadPdfReport } = await import("../../lib/report/pdfReport");
      await downloadPdfReport(result, clt, pj);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="report-bar">
      <button type="button" className="report-button" onClick={generate} disabled={state === "busy"}>
        {state === "busy" ? "Gerando PDF…" : "Baixar relatório em PDF"}
      </button>
      <p className="report-hint">
        {state === "error"
          ? "Não foi possível gerar o PDF. Verifique a conexão e tente de novo."
          : "Gerado no seu navegador, com os valores preenchidos. Nada é enviado a servidor."}
      </p>
    </div>
  );
}
