import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Device } from "../types";
import { deleteDevice, getDevice } from "./useDevices";
import { QrDisplay } from "../components/QrDisplay";
import { formatManualCode } from "./matterPayload";

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [device, setDevice] = useState<Device | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDevice(id)
      .then((d) => setDevice(d))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this device? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteDevice(id);
      nav("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
      setDeleting(false);
    }
  }

  if (device === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (device === null) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>Device not found.</p>
        <Link to="/" className="text-indigo-400">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh max-w-xl mx-auto px-4 safe-top safe-bottom">
      <header className="flex items-center justify-between py-4">
        <Link to="/" className="text-slate-400">
          ← Back
        </Link>
        <Link
          to={`/device/${device.id}/edit`}
          className="text-indigo-400 font-medium"
        >
          Edit
        </Link>
      </header>

      <h1 className="text-2xl font-semibold mb-1">{device.name}</h1>
      <p className="text-slate-400 mb-6">
        {[device.manufacturer, device.model].filter(Boolean).join(" · ") || "—"}
      </p>

      {error && (
        <p className="mb-4 rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {device.qr_payload ? (
        <div className="flex flex-col items-center mb-6">
          <QrDisplay value={device.qr_payload} size={256} />
          <p className="mt-2 text-xs text-slate-500 break-all font-mono text-center max-w-full">
            {device.qr_payload}
          </p>
        </div>
      ) : (
        <p className="mb-6 text-slate-500 text-sm">
          No QR payload saved for this device.
        </p>
      )}

      {device.manual_code ? (
        <button
          onClick={() => handleCopy(device.manual_code!)}
          className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 mb-6 text-left hover:bg-slate-800/60"
        >
          <span className="block text-xs uppercase tracking-wide text-slate-500 mb-1">
            Manual pairing code {copied && <span className="text-emerald-400">(copied)</span>}
          </span>
          <span className="block text-2xl font-mono tracking-wider">
            {formatManualCode(device.manual_code)}
          </span>
        </button>
      ) : (
        <p className="mb-6 text-slate-500 text-sm">No manual pairing code saved.</p>
      )}

      <button
        onClick={() => void handleDelete()}
        disabled={deleting}
        className="w-full rounded-xl border border-rose-900 text-rose-300 py-3 hover:bg-rose-950/40 disabled:opacity-60"
      >
        {deleting ? "Deleting…" : "Delete device"}
      </button>
    </div>
  );
}
