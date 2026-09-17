export interface Accountant {
  name: string;
  city: string;
  /** Sigla do estado, ex.: "PR". */
  state: string;
  description: string;
  specialties: string[];
  website?: string;
  email?: string;
  whatsapp?: string;
}

/** Só links http(s): evita que um cadastro com "javascript:" vire código na página. */
export function safeUrl(url?: string): string | undefined {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : undefined;
}

/** "(43) 99999-0000" -> "https://wa.me/5543999990000" (acrescenta o 55 se faltar). */
export function whatsappLink(phone?: string): string | undefined {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits.length < 10) return undefined;
  return `https://wa.me/${digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`}`;
}

/** Contato para quem quer anunciar na aba de contadores. */
export const ADVERTISING_EMAIL = "siryuscanuto@gmail.com";

/**
 * Contadores anunciantes. Começa vazia: para divulgar um escritório, basta
 * acrescentar um item aqui — a página passa a exibir o card sozinha.
 */
export const ACCOUNTANTS: Accountant[] = [];
