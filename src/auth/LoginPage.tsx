import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "./AuthProvider";

function redirectUrl(): string {
  // Comes back to /auth/callback under the app's base path.
  return new URL(
    `${import.meta.env.BASE_URL}auth/callback`.replace(/\/+/g, "/"),
    window.location.origin,
  ).toString();
}

export function LoginPage() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (loading) return <FullscreenLoader />;
  if (session) return <Navigate to="/" replace />;

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl() },
    });
    if (error) setError(error.message);
  }

  async function sendMagicLink(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl() },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">Matter Code Vault</h1>
        <p className="text-slate-400 mb-8 text-sm">
          Sign in to see your devices on every browser you log in from.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 font-medium py-3 hover:bg-slate-100 transition"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          or email a magic link
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-xl bg-indigo-600 py-3 font-medium hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Email me a link"}
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-4 text-sm text-emerald-400">
            Check your inbox for the sign-in link.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      </div>
    </div>
  );
}

function FullscreenLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center text-slate-500">
      Loading…
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.35-1.58-5.06-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.94 10.7A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.28-1.7V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.98-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.94 7.3C4.65 5.16 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}
