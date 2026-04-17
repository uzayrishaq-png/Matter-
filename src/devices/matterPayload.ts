// Helpers for extracting displayable info from a scanned Matter QR payload
// without a full TLV decoder. Matter QR strings start with "MT:" followed
// by base38 data; manual pairing codes are 11-digit numeric strings that
// also round-trip through the device's Matter label.

const MANUAL_CODE_RE = /\b\d{11}\b/;

export function isMatterQrPayload(text: string): boolean {
  return text.trim().toUpperCase().startsWith("MT:");
}

export function extractManualCode(text: string): string | null {
  const m = text.match(MANUAL_CODE_RE);
  return m ? m[0] : null;
}

export function formatManualCode(code: string): string {
  // Human-friendly grouping used on device labels: 4-3-4.
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 11) return code;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}
