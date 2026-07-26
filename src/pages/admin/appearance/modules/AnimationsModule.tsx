import { useState } from 'react';
import type { ThemeState, AnimationTokens } from '../../../../types/theme';

interface AnimationsModuleProps {
  theme: ThemeState;
  onUpdateAnimations: (animations: Partial<AnimationTokens>) => void;
}

export function AnimationsModule({ theme, onUpdateAnimations }: AnimationsModuleProps) {
  const [formData, setFormData] = useState<AnimationTokens>(theme.animations);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: keyof AnimationTokens, val: unknown) => {
    const updated = { ...formData, [key]: val };
    setFormData(updated);
    onUpdateAnimations({ [key]: val });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAnimations(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Animations & Motion Engine</h2>
          <p className="text-xs text-white/50">Configure page transitions, spring physics, duration, easing curves, and reduced motion toggles.</p>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover transition shadow-lg"
        >
          Save Animation Settings
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          ✓ Motion parameters updated!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Page Transition Type</label>
          <select
            value={formData.pageTransition}
            onChange={(e) => handleChange('pageTransition', e.target.value as AnimationTokens['pageTransition'])}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          >
            <option value="fade">Fade In</option>
            <option value="slide">Slide In Left/Right</option>
            <option value="scale">Scale & Fade</option>
            <option value="none">Instant (No Transition)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Animation Duration ({formData.durationMs} ms)</label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={formData.durationMs}
            onChange={(e) => handleChange('durationMs', Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enableAnimations}
            onChange={(e) => handleChange('enableAnimations', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Enable Animations</span>
            <span className="block text-[11px] text-white/50">Global UI transitions</span>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.reducedMotion}
            onChange={(e) => handleChange('reducedMotion', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <div>
            <span className="block text-xs font-bold text-white">Accessibility Reduced Motion</span>
            <span className="block text-[11px] text-white/50">Honor system prefers-reduced-motion</span>
          </div>
        </label>
      </div>
    </form>
  );
}
