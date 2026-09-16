import { buildPixPayload } from "./pix";

/** Chave aleatória (EVP) — não expõe CPF, telefone nem e-mail. */
export const PIX_KEY = "2108ccd9-3137-493e-a1a0-65da48ea840c";
export const PIX_NAME = "Siryus Canuto";
export const PIX_CITY = "SAO PAULO";

/** Payload "Copia e Cola", montado uma vez e reaproveitado pelo QR Code. */
export const PIX_PAYLOAD = buildPixPayload({
  key: PIX_KEY,
  name: PIX_NAME,
  city: PIX_CITY,
});
