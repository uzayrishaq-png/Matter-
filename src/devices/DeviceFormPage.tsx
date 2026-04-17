import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { DeviceDraft } from "../types";
import { QrScanner } from "../components/QrScanner";
import {
  createDevice,
  getDevice,
  updateDevice,
} from "./useDevices";
import { extractManualCode, isMatterQrPayload } from "./matterPayload";

const EMPTY: DeviceDraft = {
  name: "",
  manufacturer: "",
  model: "",
  manual_code: "",
  qr_payload: "",
};

export function DeviceFormPage() {
  const { id } = useParams<{ id: string }>();
  const editing = id && id !== "new" ? id : null;
  const nav = useNavigate();

  const [draft, setDraft] = useState<DeviceDraft>(EMPTY);
  const [loading, setLoading] = useState(!!editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setLoading(true);
    getDevice(editing)
      .then((d) => {
        if (!d) {
          setError("Device not found.");
          return;
        }
        setDraft({
          name: d.name,
          manufacturer: d.manufacturer ?? "",
          model: d.model ?? "",
          manual_code: d.manual_code ?? "",
          qr_payload: d.qr_payload ?? "",
        });
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [editing]);

  function set<K extends keyof DeviceDraft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleScanResult(text: string) {
    setScanning(false);
    if (isMatterQrPayload(text)) {
      set("qr_payload", text.trim());
    }
    const manual = extractManualCode(text);
    if (manual) set("manual_code", manual);
    if (!isMatterQrPayload(text) && !manual) {
      set("qr_payload", text.trim());
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Give the device a name so you can find it later.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await updateDevice(editing, draft);
      } else {
        const d = await createDevice(draft);
        nav(`/device/${d.id}`, { replace: true });
        return;
      }
      nav(`/device/${editing}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save device.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-dvh max-w-xl mx-auto px-4 safe-top safe-bottom">
      <header className="flex items-center justify-between py-4">
        <Link to={editing ? `/device/${editing}` : "/"} className="text-slate-400">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold">
          {editing ? "Edit device" : "Add device"}
        </h1>
        <span className="w-12" />
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="w-full rounded-xl bg-indigo-600 py-3 font-medium hover:bg-indigo-500"
        >
          Scan Matter QR
        </button>

        <Field label="Name" required>
          <input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Living-room lamp"
            required
            autoFocus={!editing}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Manufacturer">
            <input
              value={draft.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              placeholder="Aqara"
              className={inputCls}
            />
          </Field>
          <Field label="Model">
            <input
              value={draft.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="FP2"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Manual pairing code" hint="11 digits from the device label">
          <input
            value={draft.manual_code}
            onChange={(e) => set("manual_code", e.target.value.replace(/\D/g, ""))}
            placeholder="12345678901"
            inputMode="numeric"
            autoComplete="off"
            className={`${inputCls} font-mono tracking-wider`}
          />
        </Field>

        <Field label="QR payload" hint="Starts with MT: — populated automatically by the scanner">
          <textarea
            value={draft.qr_payload}
            onChange={(e) => set("qr_payload", e.target.value)}
            placeholder="MT:…"
            rows={2}
            className={`${inputCls} font-mono text-sm break-all`}
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 py-3 font-medium hover:bg-emerald-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Add device"}
        </button>
      </form>

      {scanning && (
        <QrScanner
          onResult={handleScanResult}
          onCancel={() => setScanning(false)}
        />
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300 mb-1 block">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-slate-500 mt-1 block">{hint}</span>}
    </label>
  );
}
