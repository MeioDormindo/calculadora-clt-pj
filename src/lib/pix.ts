/**
 * Gera o payload "Pix Copia e Cola" (BR Code), no padrão EMV® MPM adotado
 * pelo Banco Central. É esse texto que vira o QR Code — a chave sozinha não
 * é reconhecida pelos aplicativos de banco.
 */

/** Campo no formato TLV: id (2) + tamanho (2) + valor. */
function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

/**
 * CRC-16/CCITT-FALSE: polinômio 0x1021, valor inicial 0xFFFF, sem reflexão
 * e sem XOR final.
 */
export function crc16(payload: string): string {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Tira acentos e caracteres fora do ASCII imprimível. Além da compatibilidade
 * com os apps, isso é requisito de correção: o tamanho no TLV é contado em
 * bytes, e um caractere acentuado ocupa mais de um.
 */
function toAscii(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim()
    .slice(0, maxLength);
}

export interface PixPayloadInput {
  key: string;
  name: string;
  city: string;
  txid?: string;
}

export function buildPixPayload({ key, name, city, txid = "***" }: PixPayloadInput): string {
  const merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", key);

  const payload =
    tlv("00", "01") + // versão do payload
    tlv("26", merchantAccount) +
    tlv("52", "0000") + // categoria do estabelecimento: não informada
    tlv("53", "986") + // moeda: BRL
    tlv("58", "BR") +
    tlv("59", toAscii(name, 25)) +
    tlv("60", toAscii(city, 15)) +
    tlv("62", tlv("05", txid));

  // O "6304" entra no cálculo do CRC — é o erro mais comum nos geradores.
  const withCrcTag = `${payload}6304`;
  return withCrcTag + crc16(withCrcTag);
}

/** Decompõe um payload em campos, para conferência. */
export function parsePixPayload(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let cursor = 0;

  while (cursor + 4 <= payload.length) {
    const id = payload.slice(cursor, cursor + 2);
    const length = Number(payload.slice(cursor + 2, cursor + 4));
    if (!Number.isFinite(length)) break;
    fields[id] = payload.slice(cursor + 4, cursor + 4 + length);
    cursor += 4 + length;
  }

  return fields;
}
