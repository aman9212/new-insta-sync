import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const refreshedProfile = await refreshProfile();

        if (cancelled) return;

        if (refreshedProfile?.onboarding_completed) {
          navigate(`/${refreshedProfile.role}/dashboard`, { replace: true });
        } else {
          // New user or incomplete onboarding — profile may be null
          // if the trigger hasn't fired yet. The onboarding page
          // uses upsert, which will create the row.
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication callback failed');
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-text-primary">
        <section className="max-w-md rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center">
          <h1 className="text-xl font-semibold text-danger">Sign-in failed</h1>
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
          >
            Back to sign in
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg text-text-secondary">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span>Completing secure sign in…</span>
      </div>
    </main>
  );
}
