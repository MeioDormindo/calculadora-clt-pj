import { useEffect, useState } from "react";
import { MINIMUM_WAGE } from "../../lib/calc/constants";
import { formatCurrency } from "../../lib/format";

/** Volta tudo ao padrão em dois cliques, para não apagar dados por engano. */
export function ResetButton({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  // A confirmação some sozinha se a pessoa não clicar de novo.
  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 5000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  return (
    <div className="reset-bar">
      <p>
        Valores iniciais: salário mínimo de {formatCurrency(MINIMUM_WAGE)} nos dois lados. Seus dados ficam
        salvos só neste navegador.
      </p>
      {confirming ? (
        <div className="reset-actions">
          <button
            type="button"
            className="reset-button danger"
            onClick={() => {
              onReset();
              setConfirming(false);
            }}
          >
            Confirmar: apagar tudo
          </button>
          <button type="button" className="reset-button" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" className="reset-button" onClick={() => setConfirming(true)}>
          ↺ Resetar valores
        </button>
      )}
    </div>
  );
}
