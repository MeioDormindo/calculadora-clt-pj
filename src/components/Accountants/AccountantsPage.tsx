import { useState } from "react";
import {
  ACCOUNTANTS,
  ADVERTISING_EMAIL,
  safeUrl,
  whatsappLink,
  type Accountant,
} from "../../lib/accountants";

const SUBJECT = "Quero divulgar meu escritório de contabilidade na calculadora CLT vs PJ";
const BODY = [
  "Olá! Tenho interesse em divulgar meu escritório na aba de contadores.",
  "",
  "Nome do escritório:",
  "Cidade/UF:",
  "Especialidades (ex.: abertura de CNPJ, PJ de TI, MEI):",
  "Site:",
  "Contato (e-mail ou WhatsApp):",
].join("\n");

const mailto = `mailto:${ADVERTISING_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

function AccountantCard({ accountant }: { accountant: Accountant }) {
  const website = safeUrl(accountant.website);
  const whatsapp = whatsappLink(accountant.whatsapp);

  return (
    <article className="card accountant-card">
      <h3 className="card-title">{accountant.name}</h3>
      <p className="card-subtitle">
        {accountant.city}/{accountant.state}
      </p>
      <p className="accountant-description">{accountant.description}</p>
      {accountant.specialties.length > 0 && (
        <ul className="accountant-tags">
          {accountant.specialties.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      <div className="accountant-links">
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer">
            Site
          </a>
        )}
        {accountant.email && <a href={`mailto:${accountant.email}`}>E-mail</a>}
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}

export function AccountantsPage() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(ADVERTISING_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sem permissão de área de transferência: o e-mail continua visível na tela.
    }
  }

  return (
    <div className="app-shell-results">
      <section className="accountants-intro">
        <h2>Contadores</h2>
        <p>
          Vai virar PJ? Abrir o CNPJ, escolher o regime e manter o Fator R em dia é trabalho de
          contador. Aqui você encontra escritórios que atendem quem está saindo da CLT.
        </p>
      </section>

      {ACCOUNTANTS.length > 0 ? (
        <div className="accountants-grid">
          {ACCOUNTANTS.map((a) => (
            <AccountantCard key={`${a.name}-${a.city}`} accountant={a} />
          ))}
        </div>
      ) : (
        <section className="card accountants-empty">
          <h3 className="card-title">Ainda não há contadores divulgados</h3>
          <p className="card-subtitle">
            Esta página acabou de abrir. Os primeiros escritórios parceiros vão aparecer aqui.
          </p>
        </section>
      )}

      <section className="card accountants-cta">
        <h3 className="card-title">É contador e quer divulgar seu escritório?</h3>
        <p className="card-subtitle">
          Quem usa a calculadora está exatamente decidindo se vira PJ. Mande um e-mail com o nome
          do escritório, cidade, especialidades e contato.
        </p>
        <div className="accountants-contact">
          <a className="report-button" href={mailto}>
            Enviar e-mail
          </a>
          <button type="button" className="accountants-copy" onClick={copyEmail}>
            {copied ? "E-mail copiado" : ADVERTISING_EMAIL}
          </button>
        </div>
      </section>

      <p className="group-note accountants-disclaimer">
        Os escritórios listados são anunciantes. A calculadora não os recomenda nem responde pelos
        serviços prestados — confira o registro no CRC antes de contratar.
      </p>
    </div>
  );
}
