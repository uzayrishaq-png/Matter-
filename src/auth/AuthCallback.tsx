import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

// Supabase's detectSessionInUrl picks up the tokens from the hash
// automatically on load; all we need to do here is bounce the user
// back to the list once the session is present.
export function AuthCallback() {
  const { session, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && session) nav("/", { replace: true });
  }, [loading, session, nav]);

  useEffect(() => {
    if (!loading && !session) {
      const t = setTimeout(() => nav("/login", { replace: true }), 1500);
      return () => clearTimeout(t);
    }
  }, [loading, session, nav]);

  return (
    <div className="min-h-dvh flex items-center justify-center text-slate-400">
      Signing you in…
    </div>
  );
}
