const DCL_BASE = "https://on.dcl.csa-iot.org/dcl";

export type DeviceInfo = {
  vendorName: string | null;
  productName: string | null;
};

// Well-known vendor IDs as fallback when the DCL API is unreachable (CORS).
const KNOWN_VENDORS: Record<number, string> = {
  4098: "IKEA",
  4107: "Espressif",
  4362: "Eve Systems",
  4417: "Apple",
  4447: "Lumi / Aqara",
  4476: "Nanoleaf",
  4742: "TP-Link",
  4877: "Tuya",
  4937: "Meross",
  4996: "SwitchBot",
  5009: "Yeelight",
  5010: "Philips Hue / Signify",
  5264: "Wiz",
};

async function fetchJson(url: string): Promise<unknown> {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  return resp.json();
}

export async function lookupDevice(
  vendorId: number,
  productId: number,
): Promise<DeviceInfo> {
  const result: DeviceInfo = { vendorName: null, productName: null };

  try {
    const [vendorData, modelData] = await Promise.all([
      fetchJson(`${DCL_BASE}/vendorinfo/vendors/${vendorId}`),
      fetchJson(`${DCL_BASE}/model/models/${vendorId}/${productId}`),
    ]);

    if (vendorData && typeof vendorData === "object") {
      const vi = (vendorData as Record<string, Record<string, string>>)
        .vendorInfo;
      if (vi?.vendorName) result.vendorName = vi.vendorName;
    }

    if (modelData && typeof modelData === "object") {
      const m = (modelData as Record<string, Record<string, string>>).model;
      if (m?.productName) result.productName = m.productName;
      else if (m?.productLabel) result.productName = m.productLabel;
    }
  } catch {
    // DCL unreachable (likely CORS) — fall back to local table.
  }

  if (!result.vendorName && vendorId in KNOWN_VENDORS) {
    result.vendorName = KNOWN_VENDORS[vendorId];
  }

  return result;
}
