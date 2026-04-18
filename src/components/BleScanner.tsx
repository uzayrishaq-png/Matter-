import { useState } from "react";

export type BleResult = {
  vendorId: number;
  productId: number;
  discriminator: number;
};

const MATTER_BLE_SERVICE = 0xfff6;

function parseServiceData(data: DataView): BleResult | null {
  // Matter BLE advertisement service data layout (from Matter spec):
  // Byte 0: Opcode + version (4 bits each)
  // Bytes 1-2: Discriminator + advertising bits
  // Bytes 3-4: Vendor ID (little-endian)
  // Bytes 5-6: Product ID (little-endian)
  if (data.byteLength < 7) return null;
  try {
    data.getUint8(0); // version + opcode, not needed
    const disc_lo = data.getUint8(1);
    const disc_hi = data.getUint8(2);
    const discriminator = disc_lo | ((disc_hi & 0x0f) << 8);
    const vendorId = data.getUint16(3, true);
    const productId = data.getUint16(5, true);
    return { vendorId, productId, discriminator };
  } catch {
    return null;
  }
}

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: {
        filters: Array<{ services: number[] }>;
        optionalServices?: number[];
      }): Promise<BluetoothDevice>;
    };
  }
  interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
    name?: string;
  }
  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: number): Promise<BluetoothRemoteGATTService>;
  }
  interface BluetoothRemoteGATTService {
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }
  interface BluetoothRemoteGATTCharacteristic {
    readValue(): Promise<DataView>;
  }
}

export function useBleSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}

type Props = {
  onResult: (result: BleResult) => void;
};

export function BleScanner({ onResult }: Props) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setScanning(true);
    setError(null);
    try {
      const device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [MATTER_BLE_SERVICE] }],
        optionalServices: [MATTER_BLE_SERVICE],
      });

      if (!device.gatt) {
        setError("Could not connect to device.");
        return;
      }

      const server = await device.gatt.connect();
      try {
        const service = await server.getPrimaryService(MATTER_BLE_SERVICE);
        const chars = await service.getCharacteristics();

        // Try to find commissioning data in characteristics
        for (const char of chars) {
          try {
            const value = await char.readValue();
            const parsed = parseServiceData(value);
            if (parsed) {
              onResult(parsed);
              return;
            }
          } catch {
            // skip unreadable characteristics
          }
        }
      } finally {
        server.disconnect();
      }

      // If we got here, we connected but couldn't parse service data.
      // Fall back: use the device name if it contains useful info.
      // At minimum we discovered a Matter device — prompt manual entry.
      setError(
        "Connected to a Matter device but couldn't read its commissioning data. " +
        "Try scanning the QR code on the device instead.",
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotFoundError") {
        // User cancelled the picker
        setError(null);
      } else {
        setError(
          e instanceof Error ? e.message : "Bluetooth scan failed.",
        );
      }
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleScan()}
        disabled={scanning}
        className="w-full rounded-xl border border-indigo-600 text-indigo-400 py-3 font-medium hover:bg-indigo-950/40 disabled:opacity-60"
      >
        {scanning ? "Scanning…" : "Scan nearby (Bluetooth)"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-amber-400">{error}</p>
      )}
    </div>
  );
}
