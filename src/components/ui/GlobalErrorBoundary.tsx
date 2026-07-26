import { useRouteError } from 'react-router-dom';
import { Button } from './Button';
import { Icon } from './Icon';

export function GlobalErrorBoundary() {
  const error = useRouteError();

  console.error('Unhandled Route Error:', error);

  const errorString =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
      ? (error as any).statusText || (error as any).message || JSON.stringify(error)
      : String(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-6 text-center">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-surface p-8 space-y-6 shadow-2xl">
        <div className="mx-auto h-16 w-16 bg-danger/10 text-danger rounded-full flex items-center justify-center">
          <Icon name="alert-triangle" size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Something went wrong.</h1>
          <p className="text-sm text-text-secondary">
            An unexpected error occurred. Below are the details for diagnosis.
          </p>
        </div>

        {!!error && (
          <div className="p-4 bg-surface-elevated text-left rounded-xl border border-border text-xs font-mono overflow-auto max-h-56 text-text-secondary leading-relaxed">
            <div className="font-semibold text-danger mb-1">Error Diagnostic Log:</div>
            <div className="text-text-primary font-bold">{errorString}</div>
            {error instanceof Error && error.stack && (
              <pre className="mt-2 text-[10px] text-text-muted overflow-x-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
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
