import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PIX_PAYLOAD, PIX_NAME } from "../../lib/pixConfig";

export function Donate() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(PIX_PAYLOAD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sem permissão de área de transferência: o código fica visível para
      // seleção manual, então não há o que avisar.
    }
  }

  return (
    <section className="card donate">
      <div className="donate-qr">
        {/* Sempre escuro sobre branco: leitor de código espera esse contraste,
            independente do tema da página. O tamanho não é estético — são 53
            módulos, e abaixo de ~200px cada um fica fino demais para a câmera
            de um celular pegar de primeira. */}
        <QRCodeSVG value={PIX_PAYLOAD} size={212} level="M" marginSize={2} bgColor="#ffffff" fgColor="#0b0b0b" />
      </div>

      <div className="donate-text">
        <h3 className="card-title">Curtiu? Me paga um café</h3>
        <p className="card-subtitle">
          O site é gratuito e sem anúncios. Se ele te ajudou numa negociação, uma doação via Pix
          ajuda a manter o projeto — em qualquer valor, e totalmente opcional.
        </p>

        <label className="donate-code">
          <span className="field-label">Pix copia e cola · {PIX_NAME}</span>
          <textarea readOnly value={PIX_PAYLOAD} rows={3} onFocus={(e) => e.target.select()} />
        </label>

        <button type="button" className="donate-button" onClick={copy}>
          {copied ? "Código copiado" : "Copiar código Pix"}
        </button>
      </div>
    </section>
  );
}
