const BASE38 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-.";

function base38Decode(encoded: string): Uint8Array {
  const result: number[] = [];
  let i = 0;
  while (i < encoded.length) {
    const remaining = encoded.length - i;
    let chunkSize: number;
    let byteCount: number;
    if (remaining >= 5) {
      chunkSize = 5;
      byteCount = 3;
    } else if (remaining >= 4) {
      chunkSize = 4;
      byteCount = 2;
    } else {
      chunkSize = 2;
      byteCount = 1;
    }
    let value = 0;
    for (let j = i + chunkSize - 1; j >= i; j--) {
      const idx = BASE38.indexOf(encoded[j]);
      if (idx < 0) throw new Error(`Invalid base38 character: ${encoded[j]}`);
      value = value * 38 + idx;
    }
    for (let j = 0; j < byteCount; j++) {
      result.push(value & 0xff);
      value >>= 8;
    }
    i += chunkSize;
  }
  return new Uint8Array(result);
}

function readBits(data: Uint8Array, offset: number, length: number): number {
  let value = 0;
  for (let i = 0; i < length; i++) {
    const byteIdx = Math.floor((offset + i) / 8);
    const bitIdx = (offset + i) % 8;
    if (data[byteIdx] & (1 << bitIdx)) {
      value |= 1 << i;
    }
  }
  return value;
}

export type MatterPayloadData = {
  version: number;
  vendorId: number;
  productId: number;
  customFlow: number;
  discoveryCapabilities: number;
  discriminator: number;
  passcode: number;
};

export function decodeMatterQr(qrPayload: string): MatterPayloadData | null {
  const trimmed = qrPayload.trim().toUpperCase();
  if (!trimmed.startsWith("MT:")) return null;
  try {
    const encoded = trimmed.slice(3);
    const data = base38Decode(encoded);
    if (data.length < 11) return null;
    return {
      version: readBits(data, 0, 3),
      vendorId: readBits(data, 3, 16),
      productId: readBits(data, 19, 16),
      customFlow: readBits(data, 35, 2),
      discoveryCapabilities: readBits(data, 37, 8),
      discriminator: readBits(data, 45, 12),
      passcode: readBits(data, 57, 27),
    };
  } catch {
    return null;
  }
}

export function passcodeToManualCode(
  passcode: number,
  discriminator: number,
  vendorIdPresent: boolean,
): string {
  const disc12 = discriminator & 0xfff;
  const vid = vendorIdPresent ? 1 : 0;
  const d1 = (vid << 2) | ((disc12 >> 10) & 0x03);
  const d2to6 = ((disc12 & 0x300) << 6) | (passcode & 0x3fff);
  const d7to10 = passcode >> 14;
  const raw = `${d1}${String(d2to6).padStart(5, "0")}${String(d7to10).padStart(4, "0")}`;
  const check = verhoeffCheck(raw);
  return raw + check;
}

// Verhoeff check digit tables
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function verhoeffCheck(num: string): string {
  let c = 0;
  const digits = num.split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][digits[i]]];
  }
  return String(VERHOEFF_INV[c]);
}
