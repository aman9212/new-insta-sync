import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthContext } from "../../app/providers";
import type { UserRole } from "../../types";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, user, profile } = useAuthContext();
  const location = useLocation();

  if (!configured) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm">Loading CreatorX session…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  // Allow authenticated users without a profile (or incomplete onboarding) through
  // to the /onboarding page. Otherwise this guard would infinitely redirect.
  if (!profile || !profile.onboarding_completed) {
    if (location.pathname === "/onboarding") {
      return children;
    }
    return <Navigate to="/onboarding" replace />;
  }

  if (profile.account_status === "suspended" || profile.account_status === "banned") {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-center text-text-primary">
        <section className="max-w-md rounded-xl border border-danger/30 bg-danger/10 p-6">
          <h1 className="text-2xl font-semibold">Account unavailable</h1>
          <p className="mt-2 text-text-secondary">
            This account is {profile.account_status}. Contact CreatorX support if this looks wrong.
          </p>
        </section>
      </main>
    );
  }

  return children;
}

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { profile } = useAuthContext();

  if (!profile) return null;
  if (profile.role !== role) return <Navigate to={`/${profile.role}/dashboard`} replace />;

  return children;
}
