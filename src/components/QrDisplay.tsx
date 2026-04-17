import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QrDisplay({ value, size = 256 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(() => {
      // ignore render errors — we show the raw payload as fallback
    });
  }, [value, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="rounded-xl bg-white"
    />
  );
}
