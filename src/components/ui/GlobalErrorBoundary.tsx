import { useRouteError } from 'react-router-dom';
import { Button } from './Button';
import { Icon } from './Icon';

export function GlobalErrorBoundary() {
  const error = useRouteError();
  const isAdminPath = window.location.pathname.startsWith('/admin');

  console.error('Unhandled Route Error:', error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 space-y-6">
        <div className="mx-auto h-16 w-16 bg-danger/10 text-danger rounded-full flex items-center justify-center">
          <Icon name="alert-triangle" size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Something went wrong.</h1>
          <p className="text-sm text-text-secondary">
            An unexpected error occurred. Please try reloading the page or contact support if the issue persists.
          </p>
        </div>

        {isAdminPath && !!error && (
          <div className="p-4 bg-surface-elevated text-left rounded-xl border border-border text-xs font-mono overflow-auto max-h-48 text-text-secondary leading-relaxed">
            <div className="font-semibold text-danger mb-1">Administrator Debugging Log:</div>
            {error instanceof Error ? error.message : String(error)}
            {error instanceof Error && error.stack && (
              <pre className="mt-2 text-[10px] text-text-muted">{error.stack}</pre>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
          <Button onClick={() => (window.location.href = '/')}>Go Home</Button>
        </div>
      </div>
    </div>
  );
}
