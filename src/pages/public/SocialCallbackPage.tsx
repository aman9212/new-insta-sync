import { useEffect, useState, useId } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { socialIntegrationService } from '../../services/social-integration.service';
import { Icon } from '../../components/ui/Icon';
import { useAuth } from '../../hooks/useAuth';

export function SocialCallbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { platformId } = useParams<{ platformId: string }>();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const traceId = useId();

  useEffect(() => {
    let active = true;

    async function handleExchange() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!platformId) {
          throw new Error('Platform identifier is missing from callback URL.');
        }

        if (!code) {
          throw new Error('Authorization code parameter ("code") is missing from Meta callback URL.');
        }

        if (!state) {
          throw new Error('Security state parameter ("state") is missing from Meta callback URL.');
        }

        // Call Edge Function oauth-callback
        await socialIntegrationService.handleOAuthCallback(platformId as any, code, state);

        if (!active) return;
        setStatus('success');
        
        setTimeout(() => {
          if (active) {
            navigate('/creator/accounts', { replace: true, state: { message: `Successfully connected your ${platformId.toUpperCase()} account!` } });
          }
        }, 1500);

      } catch (err) {
        if (!active) return;
        console.error('[OAuth Callback Failed]:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to exchange authorization token with provider.');
      }
    }

    void handleExchange();

    return () => {
      active = false;
    };
  }, [platformId, searchParams, navigate]);

  const handleRetryOAuth = async () => {
    if (!platformId || !user) {
      navigate('/creator/accounts', { replace: true });
      return;
    }
    setRetrying(true);
    try {
      const res = await socialIntegrationService.initiateOAuthFlow(platformId as any, user.id);
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('Failed to obtain authorization URL');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to restart authorization');
      setRetrying(false);
    }
  };

  if (status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-text-primary">
        <section className="max-w-md w-full rounded-[28px] border border-danger/30 bg-danger/5 p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-danger/10 text-danger grid place-items-center border border-danger/20">
            <Icon name="alert-triangle" size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-text-primary">Connection Failed</h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              {errorMessage || 'An error occurred while communicating with the provider.'}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] font-mono text-text-muted space-y-1 text-left">
            <div className="flex justify-between">
              <span>Platform:</span>
              <span className="font-bold text-text-primary uppercase">{platformId || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span>Trace ID:</span>
              <span className="text-accent">{traceId}</span>
            </div>
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleRetryOAuth}
              disabled={retrying}
              className="w-full rounded-xl bg-accent px-4 py-3 text-xs font-bold text-white transition hover:bg-accent-hover flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Icon name="refresh-cw" size={14} className={retrying ? 'animate-spin' : ''} />
              {retrying ? 'Restarting Authorization...' : 'Try Connecting Again'}
            </button>

            <button
              onClick={() => navigate('/creator/accounts', { replace: true })}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
            >
              Return to Linked Accounts
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="grid min-h-screen place-items-center bg-bg text-text-primary">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 grid place-items-center animate-bounce">
            <Icon name="check-circle" size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Account Connected!</h2>
            <p className="text-xs text-text-secondary mt-1">Your channel is verified. Redirecting back to CreatorX...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg text-text-secondary">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Authenticating with provider...</h2>
          <p className="text-[11px] text-text-muted mt-0.5">Exchanging authorization tokens and retrieving metrics securely.</p>
        </div>
      </div>
    </main>
  );
}
