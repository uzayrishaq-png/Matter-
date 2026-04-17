import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onResult: (text: string) => void;
  onCancel: () => void;
};

const ELEMENT_ID = "qr-reader";

export function QrScanner({ onResult, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID, { verbose: false });
    scannerRef.current = scanner;

    const stop = async () => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;
      try {
        if (scanner.isScanning) await scanner.stop();
        await scanner.clear();
      } catch {
        // ignore
      }
    };

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          void stop().then(() => onResult(decoded));
        },
        () => {
          // per-frame errors are noisy; ignore
        },
      )
      .catch((e: unknown) => {
        setError(
          e instanceof Error
            ? e.message
            : "Could not start the camera. Check browser permissions.",
        );
      });

    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between p-4 safe-top">
        <h2 className="text-lg font-medium">Scan Matter QR</h2>
        <button
          onClick={onCancel}
          className="rounded-full bg-slate-800 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div
          id={ELEMENT_ID}
          className="w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden"
        />
      </div>
      <div className="p-4 text-center text-sm text-slate-400 safe-bottom">
        {error
          ? error
          : "Point the camera at the Matter QR on the device or its box."}
      </div>
    </div>
  );
}
