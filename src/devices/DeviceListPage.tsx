import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useDevices } from "./useDevices";
import type { Device } from "../types";
import { formatManualCode } from "./matterPayload";

function groupByManufacturer(devices: Device[]) {
  const groups = new Map<string, Device[]>();
  for (const d of devices) {
    const key = d.manufacturer?.trim() || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function DeviceListPage() {
  const { devices, error } = useDevices();
  const { signOut } = useAuth();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!devices) return null;
    const needle = q.trim().toLowerCase();
    if (!needle) return devices;
    return devices.filter((d) =>
      [d.name, d.manufacturer, d.model, d.manual_code]
        .filter((v): v is string => !!v)
        .some((v) => v.toLowerCase().includes(needle)),
    );
  }, [devices, q]);

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 pb-24 safe-top">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">Matter Codes</h1>
        <button
          onClick={() => void signOut()}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Sign out
        </button>
      </header>

      <input
        type="search"
        placeholder="Search devices…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {error && (
        <p className="mb-4 rounded-xl border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {filtered === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={q.length > 0} />
      ) : (
        <div className="space-y-6">
          {groupByManufacturer(filtered).map(([maker, rows]) => (
            <section key={maker}>
              <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                {maker}
              </h2>
              <ul className="rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800">
                {rows.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={`/device/${d.id}`}
                      className="block px-4 py-3 hover:bg-slate-800/60"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium truncate">{d.name}</span>
                        {d.manual_code && (
                          <span className="text-xs font-mono text-slate-400">
                            •••• {d.manual_code.slice(-4)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 truncate">
                        {d.model ?? "—"}
                        {d.manual_code && (
                          <span className="font-mono ml-2">
                            {formatManualCode(d.manual_code)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Link
        to="/device/new"
        aria-label="Add device"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl shadow-lg hover:bg-indigo-500 safe-bottom"
      >
        +
      </Link>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  if (hasQuery) {
    return <p className="text-slate-500">No devices match that search.</p>;
  }
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-6 text-slate-400">
      <p className="mb-2 font-medium text-slate-200">No devices yet.</p>
      <p className="text-sm">
        Tap the + button to scan a Matter QR code or enter one manually.
      </p>
    </div>
  );
}
