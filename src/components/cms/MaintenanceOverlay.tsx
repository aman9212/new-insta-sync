import { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import type { MaintenanceSettings } from '../../types/cms';

interface MaintenanceOverlayProps {
  settings: MaintenanceSettings;
  isAdmin?: boolean;
}

export function MaintenanceOverlay({ settings, isAdmin = false }: MaintenanceOverlayProps) {
  const [bypassed, setBypassed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 2,
    minutes: 45,
    seconds: 0,
  });

  useEffect(() => {
    if (!settings.countdownEnd) return;
    const target = new Date(settings.countdownEnd).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.countdownEnd]);

  if (!settings.enabled || (settings.whitelistAdmin && isAdmin && bypassed)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070914] px-6 text-center text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-accent/20 blur-[120px]" />

      <div className="relative z-10 max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Icon name="wrench" size={32} />
        </div>

        <div className="space-y-2">
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            Maintenance Mode Active
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">We'll be right back</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            {settings.message || 'System maintenance in progress. Please check back shortly.'}
          </p>
        </div>

        {/* Countdown timer */}
        {settings.countdownEnd && (
          <div className="grid grid-cols-3 gap-3 border-y border-white/10 py-4">
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-2xl font-bold text-accent">{timeLeft.hours}</span>
              <span className="text-[10px] uppercase text-white/40 font-semibold">Hours</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-2xl font-bold text-accent">{timeLeft.minutes}</span>
              <span className="text-[10px] uppercase text-white/40 font-semibold">Minutes</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-2xl font-bold text-accent">{timeLeft.seconds}</span>
              <span className="text-[10px] uppercase text-white/40 font-semibold">Seconds</span>
            </div>
          </div>
        )}

        {isAdmin && settings.whitelistAdmin && (
          <button
            type="button"
            onClick={() => setBypassed(true)}
            className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            Bypass Maintenance (Admin Access)
          </button>
        )}
      </div>
    </div>
  );
}
