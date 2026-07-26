import { Navigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';

export function LoginPage() {
  const { profile, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (profile?.onboarding_completed) return <Navigate to={`/${profile.role}/dashboard`} replace />;

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Google sign in failed');
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-6 text-text-primary relative overflow-hidden">
      {/* Premium Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <section className="flex flex-col gap-4 overflow-hidden rounded-[20px] bg-surface/80 backdrop-blur-3xl py-4 text-sm border border-border/80 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="grid auto-rows-min items-start gap-1 rounded-t-[20px] px-8 text-center space-y-2 pb-6 border-b border-border/50">
            <h1 className="text-3xl font-bold tracking-tight mt-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Welcome back</h1>
            <p className="text-text-secondary text-[15px] leading-relaxed mx-auto max-w-[280px]">
              Don't worry, we'll check if you have an account with us already. If not, we'll get you started!
            </p>
          </div>
          
          <div className="px-8 space-y-7 pt-4 pb-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Sign in as Creator</h3>
                <p className="text-[13px] text-text-secondary">Content creators sign in with Google or Discord</p>
              </div>
              <Button className="w-full h-12 text-base font-medium shadow-[0_2px_10px_rgba(var(--color-accent),0.3)] transition-transform hover:-translate-y-0.5" onClick={handleGoogle} loading={loading}>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 488 512" className="mr-3 h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full h-12 text-base font-medium opacity-50 cursor-not-allowed border-border/60 bg-bg/50" disabled>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="mr-3 h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"></path></svg>
                Continue with Discord <span className="ml-2 text-[11px] opacity-70">(Coming Soon)</span>
              </Button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-3 text-text-muted font-semibold tracking-widest">Or</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-primary">Sign in as Brand</h3>
                <p className="text-[13px] text-text-secondary">Brands and companies access your brand dashboard</p>
              </div>
              <Button variant="outline" className="w-full h-12 text-base font-medium transition-transform hover:-translate-y-0.5 border-border/80 bg-bg/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-surface-elevated" onClick={handleGoogle} loading={loading}>
                <Icon name="monitor" size={20} className="mr-3 h-5 w-5 text-text-muted" />
                Brand Access
              </Button>
            </div>
            
            {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger text-center font-medium shadow-inner">{error}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
